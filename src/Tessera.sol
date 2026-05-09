// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Tessera
 * @notice Constrained-USDC primitive — wraps native USDC into a token whose
 *         spend is gated by an on-chain Policy. The constraint travels with
 *         the asset itself, not the holder.
 *
 * @dev DESIGN PRINCIPLES
 *   - Asset-native constraints (not approve-based, not ERC-7715-based).
 *   - Operator kill switch always available.
 *   - Compatible with x402 EIP-3009 path (unwrap + transfer is a single tx).
 *   - Categories use Merkle roots for cheap on-chain validation of arbitrary
 *     allowlist sizes without storing the full list.
 *
 * @dev STATUS — v0.2 SCAFFOLD. Not audited. Not deployed. Do not use with
 *      real funds. Logic is intentionally minimal here so each rule can be
 *      reviewed in isolation before integration with TalosFacilitator.
 *
 * @custom:roadmap
 *   - v0.2.1: full PolicyEnforcer integration with Acta receipt emission
 *   - v0.2.2: integration with Honos for reputation-aware spending
 *   - v0.3:   Lit Protocol custody adapter calls Tessera.spend on behalf of agent
 */

import {IERC20} from "../lib/forge-std/src/interfaces/IERC20.sol";

interface ITessera {
    // ---- Types ----

    /// @notice Spending policy attached to a Tessera-wrapped position.
    /// @dev Stored on-chain per `policyId`. Updated by operator only.
    struct Policy {
        bytes32 categoryRoot;       // Merkle root of allowed (recipient, category) pairs
        uint128 perTxCap;            // max single transfer (in USDC atomic units)
        uint128 dailyCap;            // max cumulative per UTC day
        uint64  expiresAt;           // policy auto-expires; 0 = never
        address operator;            // who created the policy & holds kill switch
        address killKey;             // emergency revoke address (often == operator)
        bool    active;              // false after revokeAndRecover
    }

    /// @notice Per-day spend tracking for cap enforcement.
    struct DailyState {
        uint64  utcDay;              // floor(block.timestamp / 86400)
        uint128 spentToday;          // resets when utcDay advances
    }

    // ---- Events ----

    event PolicyCreated(uint256 indexed policyId, address indexed operator, address indexed holder, uint128 amount);
    event PolicySpent(uint256 indexed policyId, address indexed to, uint128 amount, bytes32 categoryHash);
    event PolicyRevoked(uint256 indexed policyId, address indexed operator, uint128 returnedAmount);
    event PolicyExpired(uint256 indexed policyId, uint128 returnedAmount);

    // ---- Errors ----

    error PolicyNotActive(uint256 policyId);
    error PolicyExpiredError(uint256 policyId, uint64 expiredAt);
    error AmountExceedsBalance(uint256 policyId, uint128 requested, uint128 available);
    error AmountExceedsPerTxCap(uint128 requested, uint128 cap);
    error AmountExceedsDailyCap(uint128 requestedTotal, uint128 cap);
    error CategoryNotAllowed(bytes32 categoryHash);
    error UnauthorizedOperator(address caller, address required);
    error InvalidMerkleProof();

    // ---- Lifecycle ----

    /**
     * @notice Wrap underlying USDC into a constrained Tessera position.
     *
     *         Caller MUST have approved this contract for `amount` USDC first.
     *
     * @param holder       The address that will be authorized to spend (typically the agent address).
     * @param amount       USDC atomic units to wrap.
     * @param policy       Policy struct attached to this Tessera position.
     * @return policyId    Unique identifier for the created policy.
     */
    function wrap(address holder, uint128 amount, Policy calldata policy)
        external
        returns (uint256 policyId);

    /**
     * @notice Spend from a Tessera position. Validates against the attached
     *         policy, then unwraps + transfers underlying USDC to recipient.
     *
     * @param policyId         The Tessera position to spend from.
     * @param to               Recipient of USDC.
     * @param amount           USDC atomic units.
     * @param categoryHash     Hash of the category being charged (e.g. keccak256("AI_COMPUTE")).
     * @param categoryProof    Merkle proof that (to, categoryHash) is in policy.categoryRoot.
     */
    function spend(
        uint256 policyId,
        address to,
        uint128 amount,
        bytes32 categoryHash,
        bytes32[] calldata categoryProof
    ) external;

    /**
     * @notice Operator-only kill switch. Returns remaining USDC to the operator
     *         and marks the policy inactive. Blocks future spend() calls.
     */
    function revokeAndRecover(uint256 policyId) external;

    /**
     * @notice Anyone can call to clean up an expired policy. Returns remaining
     *         USDC to the operator and marks inactive.
     */
    function expire(uint256 policyId) external;

    // ---- Views ----

    function getPolicy(uint256 policyId) external view returns (Policy memory);
    function getRemainingBalance(uint256 policyId) external view returns (uint128);
    function getRemainingDailyCap(uint256 policyId) external view returns (uint128);
}

/**
 * @notice Skeleton implementation. Internal accounting + policy validation
 *         to be filled in across v0.2.1 — v0.2.3.
 */
contract Tessera is ITessera {
    /// @notice The underlying USDC contract on Arc Testnet.
    /// @dev Value verified via Foundry test on 2026-05-08.
    address public constant USDC = 0x3600000000000000000000000000000000000000;

    uint256 private _nextPolicyId;

    mapping(uint256 policyId => Policy) private _policies;
    mapping(uint256 policyId => uint128) private _balances;
    mapping(uint256 policyId => DailyState) private _daily;

    // ============================================================
    // LIFECYCLE
    // ============================================================

    function wrap(address holder, uint128 amount, Policy calldata policy)
        external
        returns (uint256 policyId)
    {
        // TODO v0.2.1:
        //   1. Validate policy struct (operator != 0, expiresAt valid, caps > 0)
        //   2. Pull `amount` USDC from msg.sender via transferFrom
        //   3. Allocate policyId and persist policy + balance
        //   4. Emit PolicyCreated
        revert("Tessera.wrap: not yet implemented");
    }

    function spend(
        uint256 policyId,
        address to,
        uint128 amount,
        bytes32 categoryHash,
        bytes32[] calldata categoryProof
    ) external {
        // TODO v0.2.1:
        //   1. Load policy; check active + not expired
        //   2. Check amount <= balance
        //   3. Check amount <= perTxCap
        //   4. Check daily cap: rotate utcDay if changed, then assert spent + amount <= dailyCap
        //   5. Verify Merkle proof (categoryHash, to) ∈ categoryRoot
        //   6. Decrement balance, increment spentToday
        //   7. IERC20(USDC).transfer(to, amount)
        //   8. Emit PolicySpent
        revert("Tessera.spend: not yet implemented");
    }

    function revokeAndRecover(uint256 policyId) external {
        // TODO v0.2.1:
        //   1. Load policy
        //   2. Require msg.sender == operator OR msg.sender == killKey
        //   3. Mark inactive
        //   4. Refund remaining balance to operator
        //   5. Emit PolicyRevoked
        revert("Tessera.revokeAndRecover: not yet implemented");
    }

    function expire(uint256 policyId) external {
        // TODO v0.2.1:
        //   1. Load policy
        //   2. Require expiresAt > 0 && block.timestamp >= expiresAt
        //   3. Mark inactive
        //   4. Refund remaining balance to operator
        //   5. Emit PolicyExpired
        revert("Tessera.expire: not yet implemented");
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
}
