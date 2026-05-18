// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IActa} from "./Acta.sol";

/**
 * @title Honos
 * @notice Reputation bond — tokenized agent reputation that decays without
 *         activity, can be slashed for misbehavior, and grows from verified
 *         Acta receipts.
 *
 * @dev DESIGN
 *   - One bond per agent (1:1 mapping). Self-mint by agent or operator.
 *   - Reputation grows when an agent accumulates SUCCESSFUL Acta receipts.
 *   - Reputation decays via discrete halving (every `decayHalfLife` seconds,
 *     base reputation halves). Cheap to compute, no FP math required.
 *   - Slashing is permissioned to a `slasher` role (set by owner). Each slash
 *     references a `disputeRef` for off-chain dispute resolution audit trail.
 *
 * @dev RECORD-SUCCESS FLOW
 *   1. Acta has emitted the receipt (counter-signed by agent + counterparty).
 *   2. Caller (anyone) provides the original Receipt struct + bondId.
 *   3. Honos computes Acta.digestOf(receipt) and verifies it matches
 *      Acta.storedDigest(receiptId). This binds the on-chain reputation
 *      change to the EXACT receipt that Acta verified.
 *   4. Honos updates baseReputation += weight (proportional to receipt amount).
 *
 * @custom:status v0.2 — full implementation. Sybil-resistance for agent self-
 *                trade is documented as future work (v0.3 anti-Sybil).
 */

interface IHonos {
    // ---- Types ----

    struct Bond {
        address agent;              // 1:1 — agent's address
        uint128 baseReputation;     // accumulated rep, decayed on read
        uint64  lastUpdateAt;       // when baseReputation last changed
        uint64  decayHalfLife;      // seconds until rep halves with no activity
        uint64  bornAt;             // mint timestamp
        uint128 totalSlashed;       // cumulative slashed (audit trail)
        bool    active;             // false after fatal slash or self-burn
    }

    // ---- Events ----

    event BondMinted(uint256 indexed bondId, address indexed agent, uint64 decayHalfLife);
    event SuccessRecorded(
        uint256 indexed bondId,
        address indexed agent,
        bytes32 indexed receiptId,
        uint128 weight,
        uint128 newBaseReputation
    );
    event Slashed(
        uint256 indexed bondId,
        address indexed agent,
        uint128 amount,
        uint128 newBaseReputation,
        bytes32 disputeRef
    );
    event SlasherUpdated(address indexed previousSlasher, address indexed newSlasher);
    event BondBurned(uint256 indexed bondId, address indexed agent);

    // ---- Errors ----

    error AgentZero();
    error AgentAlreadyHasBond(address agent, uint256 existingBondId);
    error BondDoesNotExist(uint256 bondId);
    error BondNotActive(uint256 bondId);
    error ReceiptNotEmitted(bytes32 receiptId);
    error ReceiptDigestMismatch(bytes32 receiptId);
    error ReceiptAgentMismatch(uint256 bondId, address bondAgent, address receiptAgent);
    error UnauthorizedSlasher(address caller);
    error UnauthorizedAgent(address caller, address bondAgent);
    error InvalidHalfLife();
    error AmountIsZero();
    error AmountExceedsReputation(uint128 requested, uint128 available);

    // ---- Lifecycle ----

    function mint(address agent, uint64 decayHalfLife) external returns (uint256 bondId);
    function burn(uint256 bondId) external;
    function setSlasher(address newSlasher) external;
    function recordSuccess(uint256 bondId, IActa.Receipt calldata receipt) external;
    function slash(uint256 bondId, uint128 amount, bytes32 disputeRef) external;

    // ---- Views ----

    function getBond(uint256 bondId) external view returns (Bond memory);
    function bondOf(address agent) external view returns (uint256);
    function effectiveReputation(uint256 bondId) external view returns (uint128);
}

contract Honos is IHonos {
    /// @notice Acta contract — receipt source of truth.
    IActa public immutable acta;

    /// @notice Owner can update slasher and contract-level params.
    address public owner;

    /// @notice Authorized to call slash().
    address public slasher;

    uint256 private _nextBondId = 1;
    mapping(uint256 => Bond) private _bonds;
    mapping(address => uint256) private _bondOf;

    /// @notice Minimum allowed half-life — prevents instant decay configuration.
    uint64 public constant MIN_HALF_LIFE = 1 hours;
    /// @notice Maximum allowed half-life — prevents practically-immortal rep.
    uint64 public constant MAX_HALF_LIFE = 730 days;

    constructor(address actaAddress, address slasherAddress) {
        if (actaAddress == address(0)) revert AgentZero();
        if (slasherAddress == address(0)) revert AgentZero();
        acta = IActa(actaAddress);
        owner = msg.sender;
        slasher = slasherAddress;
    }

    // ============================================================
    // LIFECYCLE
    // ============================================================

    function mint(address agent, uint64 decayHalfLife) external returns (uint256 bondId) {
        if (agent == address(0)) revert AgentZero();
        if (_bondOf[agent] != 0) revert AgentAlreadyHasBond(agent, _bondOf[agent]);
        if (decayHalfLife < MIN_HALF_LIFE || decayHalfLife > MAX_HALF_LIFE) revert InvalidHalfLife();

        bondId = _nextBondId++;
        uint64 nowTs = uint64(block.timestamp);

        _bonds[bondId] = Bond({
            agent: agent,
            baseReputation: 0,
            lastUpdateAt: nowTs,
            decayHalfLife: decayHalfLife,
            bornAt: nowTs,
            totalSlashed: 0,
            active: true
        });
        _bondOf[agent] = bondId;

        emit BondMinted(bondId, agent, decayHalfLife);
    }

    function burn(uint256 bondId) external {
        Bond storage b = _bonds[bondId];
        if (b.agent == address(0)) revert BondDoesNotExist(bondId);
        if (!b.active) revert BondNotActive(bondId);
        if (msg.sender != b.agent) revert UnauthorizedAgent(msg.sender, b.agent);

        b.active = false;
        delete _bondOf[b.agent];

        emit BondBurned(bondId, b.agent);
    }

    function setSlasher(address newSlasher) external {
        if (msg.sender != owner) revert UnauthorizedSlasher(msg.sender);
        if (newSlasher == address(0)) revert AgentZero();
        address previous = slasher;
        slasher = newSlasher;
        emit SlasherUpdated(previous, newSlasher);
    }

    // ============================================================
    // REPUTATION UPDATES
    // ============================================================

    /**
     * @notice Record a successful action for a bond, sourced from a verified
     *         Acta receipt. Anyone may call (the receipt's signatures are the
     *         authority — Sybil-resistance is the caller's responsibility).
     */
    function recordSuccess(uint256 bondId, IActa.Receipt calldata receipt) external {
        Bond storage b = _bonds[bondId];
        if (b.agent == address(0)) revert BondDoesNotExist(bondId);
        if (!b.active) revert BondNotActive(bondId);

        if (b.agent != receipt.agent) {
            revert ReceiptAgentMismatch(bondId, b.agent, receipt.agent);
        }

        // Verify the receipt is actually attested by Acta with the EXACT
        // fields we're processing (prevents tampered re-submission).
        if (!acta.isEmitted(receipt.receiptId)) revert ReceiptNotEmitted(receipt.receiptId);
        bytes32 expected = acta.digestOf(receipt);
        if (acta.storedDigest(receipt.receiptId) != expected) {
            revert ReceiptDigestMismatch(receipt.receiptId);
        }

        // Apply current decay before adding new weight.
        uint128 decayed = _decayed(b);

        // Weight: 1 USDC (6-decimal) = 1 reputation point. Minimum 1.
        uint128 weight = uint128(receipt.amount / 1_000_000);
        if (weight == 0) weight = 1;

        // Saturating add — uint128 max would take ~3.4e20 receipts to hit.
        unchecked {
            uint128 newRep = decayed + weight;
            if (newRep < decayed) newRep = type(uint128).max; // overflow guard
            b.baseReputation = newRep;
        }
        b.lastUpdateAt = uint64(block.timestamp);

        emit SuccessRecorded(bondId, b.agent, receipt.receiptId, weight, b.baseReputation);
    }

    function slash(uint256 bondId, uint128 amount, bytes32 disputeRef) external {
        if (msg.sender != slasher) revert UnauthorizedSlasher(msg.sender);

        Bond storage b = _bonds[bondId];
        if (b.agent == address(0)) revert BondDoesNotExist(bondId);
        if (!b.active) revert BondNotActive(bondId);
        if (amount == 0) revert AmountIsZero();

        uint128 current = _decayed(b);
        if (amount > current) revert AmountExceedsReputation(amount, current);

        b.baseReputation = current - amount;
        b.lastUpdateAt = uint64(block.timestamp);
        b.totalSlashed += amount;

        emit Slashed(bondId, b.agent, amount, b.baseReputation, disputeRef);
    }

    // ============================================================
    // VIEWS
    // ============================================================

    function getBond(uint256 bondId) external view returns (Bond memory) {
        return _bonds[bondId];
    }

    function bondOf(address agent) external view returns (uint256) {
        return _bondOf[agent];
    }

    function effectiveReputation(uint256 bondId) external view returns (uint128) {
        Bond memory b = _bonds[bondId];
        if (b.agent == address(0) || !b.active) return 0;
        return _decayed(b);
    }

    // ============================================================
    // INTERNAL
    // ============================================================

    /**
     * @notice Apply discrete-halving decay to baseReputation.
     *
     *         For every full `decayHalfLife` period since `lastUpdateAt`, the
     *         reputation halves. Computed via right-shift for gas efficiency.
     *         After ~127 half-lives, returns 0.
     */
    function _decayed(Bond memory b) internal view returns (uint128) {
        if (b.baseReputation == 0) return 0;

        uint64 elapsed = uint64(block.timestamp) - b.lastUpdateAt;
        if (elapsed < b.decayHalfLife) return b.baseReputation;

        uint64 periods = elapsed / b.decayHalfLife;
        if (periods >= 128) return 0; // shifted to oblivion

        return b.baseReputation >> uint8(periods);
    }
}
