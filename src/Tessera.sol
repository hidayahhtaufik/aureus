// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Tessera
 * @notice Constrained-USDC primitive — wraps native USDC into a position
 *         whose spending is gated by an on-chain Policy. The constraint
 *         travels with the asset, not the holder.
 *
 * @dev DESIGN
 *   - One Tessera position per (operator, holder, policy).
 *   - Policies are immutable once created. To change rules, revoke + re-wrap.
 *   - Categories use Merkle roots so policies can encode arbitrarily large
 *     allowlists without paying storage cost for every entry.
 *   - Operator (or designated killKey) can always revoke and recover funds.
 *   - Auto-expiry is permissionless: anyone can call `expire()` once the
 *     deadline has passed (the operator gets the refund regardless).
 *
 * @custom:status v0.2 — full implementation, not yet audited.
 *                Test deploy on Arc Testnet only. Do NOT use on mainnet.
 */

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @notice Minimal Merkle-proof verifier (subset of OpenZeppelin's library).
 *         Avoids an external dependency for v0.2 simplicity.
 */
library MerkleProofLib {
    function verify(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 sibling = proof[i];
            // Hash pair sorted (matches OZ's MerkleProof default).
            computed = computed < sibling
                ? keccak256(abi.encodePacked(computed, sibling))
                : keccak256(abi.encodePacked(sibling, computed));
        }
        return computed == root;
    }
}

interface ITessera {
    // ---- Types ----

    struct Policy {
        bytes32 categoryRoot;       // Merkle root of allowed (recipient, category) pairs
        uint128 perTxCap;           // max single transfer (USDC atomic units)
        uint128 dailyCap;           // max cumulative per UTC day
        uint64  expiresAt;          // policy auto-expires; 0 = never
        address operator;           // who created the policy & holds kill switch
        address killKey;            // emergency revoke address (often == operator)
        bool    active;             // false after revoke / expire
    }

    struct DailyState {
        uint64  utcDay;
        uint128 spentToday;
    }

    // ---- Events ----

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed operator,
        address indexed holder,
        uint128 amount,
        uint64  expiresAt
    );

    event PolicySpent(
        uint256 indexed policyId,
        address indexed to,
        uint128 amount,
        bytes32 categoryHash
    );

    event PolicyRevoked(
        uint256 indexed policyId,
        address indexed operator,
        uint128 returnedAmount
    );

    event PolicyExpired(
        uint256 indexed policyId,
        uint128 returnedAmount
    );

    // ---- Errors ----

    error PolicyNotActive(uint256 policyId);
    error PolicyExpiredErr(uint256 policyId);
    error PolicyNotYetExpired(uint256 policyId);
    error AmountExceedsBalance(uint128 requested, uint128 available);
    error AmountExceedsPerTxCap(uint128 requested, uint128 cap);
    error AmountExceedsDailyCap(uint128 requestedTotal, uint128 cap);
    error InvalidCategoryProof();
    error UnauthorizedOperator(address caller);
    error InvalidPolicy(string reason);
    error AmountIsZero();
    error TransferFailed();

    // ---- Lifecycle ----

    function wrap(address holder, uint128 amount, Policy calldata policy)
        external
        returns (uint256 policyId);

    function spend(
        uint256 policyId,
        address to,
        uint128 amount,
        bytes32 categoryHash,
        bytes32[] calldata categoryProof
    ) external;

    function revokeAndRecover(uint256 policyId) external;
    function expire(uint256 policyId) external;

    // ---- Views ----

    function getPolicy(uint256 policyId) external view returns (Policy memory);
    function getRemainingBalance(uint256 policyId) external view returns (uint128);
    function getRemainingDailyCap(uint256 policyId) external view returns (uint128);
    function holderOf(uint256 policyId) external view returns (address);
}

contract Tessera is ITessera {
    using MerkleProofLib for bytes32[];

    /// @notice Underlying USDC token.
    /// @dev The address is supplied at construction so the same contract works
    ///      against the real Arc USDC (`0x3600...0000`) and against test
    ///      mocks. The default in production is the canonical Arc Testnet
    ///      address, which can be passed by the deploy script.
    IERC20 public immutable usdc;

    uint256 private _nextPolicyId;

    mapping(uint256 policyId => Policy)         private _policies;
    mapping(uint256 policyId => uint128)        private _balances;
    mapping(uint256 policyId => DailyState)     private _daily;
    mapping(uint256 policyId => address)        private _holder;

    constructor(address usdcAddress) {
        if (usdcAddress == address(0)) revert InvalidPolicy("USDC address zero");
        usdc = IERC20(usdcAddress);
        _nextPolicyId = 1;
    }

    // ============================================================
    // LIFECYCLE
    // ============================================================

    function wrap(address holder, uint128 amount, Policy calldata policy)
        external
        returns (uint256 policyId)
    {
        if (amount == 0) revert AmountIsZero();
        if (holder == address(0)) revert InvalidPolicy("holder is zero");
        if (policy.operator == address(0)) revert InvalidPolicy("operator is zero");
        if (policy.killKey == address(0)) revert InvalidPolicy("killKey is zero");
        if (policy.perTxCap == 0) revert InvalidPolicy("perTxCap is zero");
        if (policy.dailyCap == 0) revert InvalidPolicy("dailyCap is zero");
        if (policy.perTxCap > policy.dailyCap) revert InvalidPolicy("perTxCap > dailyCap");
        if (policy.expiresAt != 0 && policy.expiresAt <= block.timestamp) {
            revert InvalidPolicy("expiresAt in past");
        }
        if (!policy.active) revert InvalidPolicy("active must be true");

        // Pull USDC from operator (msg.sender). Caller must have approved this contract.
        bool ok = usdc.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        policyId = _nextPolicyId++;
        _policies[policyId] = policy;
        _balances[policyId] = amount;
        _holder[policyId] = holder;

        emit PolicyCreated(policyId, policy.operator, holder, amount, policy.expiresAt);
    }

    function spend(
        uint256 policyId,
        address to,
        uint128 amount,
        bytes32 categoryHash,
        bytes32[] calldata categoryProof
    ) external {
        Policy memory p = _policies[policyId];
        if (!p.active) revert PolicyNotActive(policyId);
        if (p.expiresAt != 0 && block.timestamp >= p.expiresAt) {
            revert PolicyExpiredErr(policyId);
        }

        // Caller must be the holder (operator-controlled agent).
        if (msg.sender != _holder[policyId]) revert UnauthorizedOperator(msg.sender);

        if (amount == 0) revert AmountIsZero();

        uint128 balance = _balances[policyId];
        if (amount > balance) revert AmountExceedsBalance(amount, balance);
        if (amount > p.perTxCap) revert AmountExceedsPerTxCap(amount, p.perTxCap);

        // Daily cap enforcement
        uint64 today = uint64(block.timestamp / 86400);
        DailyState memory d = _daily[policyId];
        if (today != d.utcDay) {
            d.utcDay = today;
            d.spentToday = 0;
        }
        uint256 newDailyTotal = uint256(d.spentToday) + uint256(amount);
        if (newDailyTotal > uint256(p.dailyCap)) {
            revert AmountExceedsDailyCap(uint128(newDailyTotal), p.dailyCap);
        }

        // Verify Merkle proof: leaf = keccak256(to, categoryHash)
        bytes32 leaf = keccak256(abi.encodePacked(to, categoryHash));
        if (!categoryProof.verify(p.categoryRoot, leaf)) {
            revert InvalidCategoryProof();
        }

        // Effects
        _balances[policyId] = balance - amount;
        d.spentToday = uint128(newDailyTotal);
        _daily[policyId] = d;

        // Interaction
        bool ok = usdc.transfer(to, amount);
        if (!ok) revert TransferFailed();

        emit PolicySpent(policyId, to, amount, categoryHash);
    }

    function revokeAndRecover(uint256 policyId) external {
        Policy memory p = _policies[policyId];
        if (!p.active) revert PolicyNotActive(policyId);
        if (msg.sender != p.operator && msg.sender != p.killKey) {
            revert UnauthorizedOperator(msg.sender);
        }

        uint128 remaining = _balances[policyId];
        _balances[policyId] = 0;
        _policies[policyId].active = false;

        if (remaining > 0) {
            bool ok = usdc.transfer(p.operator, remaining);
            if (!ok) revert TransferFailed();
        }

        emit PolicyRevoked(policyId, p.operator, remaining);
    }

    function expire(uint256 policyId) external {
        Policy memory p = _policies[policyId];
        if (!p.active) revert PolicyNotActive(policyId);
        if (p.expiresAt == 0 || block.timestamp < p.expiresAt) {
            revert PolicyNotYetExpired(policyId);
        }

        uint128 remaining = _balances[policyId];
        _balances[policyId] = 0;
        _policies[policyId].active = false;

        if (remaining > 0) {
            bool ok = usdc.transfer(p.operator, remaining);
            if (!ok) revert TransferFailed();
        }

        emit PolicyExpired(policyId, remaining);
    }

    // ============================================================
    // VIEWS
    // ============================================================

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return _policies[policyId];
    }

    function getRemainingBalance(uint256 policyId) external view returns (uint128) {
        return _balances[policyId];
    }

    function getRemainingDailyCap(uint256 policyId) external view returns (uint128) {
        Policy memory p = _policies[policyId];
        DailyState memory d = _daily[policyId];
        uint64 today = uint64(block.timestamp / 86400);
        uint128 spent = (today == d.utcDay) ? d.spentToday : 0;
        return p.dailyCap >= spent ? p.dailyCap - spent : 0;
    }

    function holderOf(uint256 policyId) external view returns (address) {
        return _holder[policyId];
    }
}
