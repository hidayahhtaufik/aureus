// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Acta
 * @notice Semantic action receipt — captures intent → outcome of an agent
 *         action with COUNTER-SIGNED proof from both agent and counterparty.
 *
 * @dev DESIGN
 *   - Each receipt is signed by both parties via EIP-712 typed data.
 *   - On-chain `emitReceipt` verifies both signatures, stores `emittedAt`,
 *     and emits an indexable event for downstream consumers.
 *   - Receipt IDs are unique — duplicate emit reverts (replay protection).
 *   - No on-chain custody, no token movement; Acta is an attestation primitive.
 *
 * @dev DOWNSTREAM USE
 *   - Honos reads ReceiptEmitted events to update agent reputation.
 *   - Lending protocols (Aave / Maple) can build credit profiles from receipt
 *     history.
 *   - Auditors / regulators get tamper-evident records of agent actions.
 *
 * @custom:status v0.2 — full implementation. EIP-712 domain and types are
 *                stable; consumers should pin against the deployed address.
 */

interface IActa {
    // ---- Types ----

    struct Receipt {
        bytes32 receiptId;          // unique per (agent, intent), e.g. keccak256(agent, nonce)
        address agent;              // who performed the action
        address operator;           // who deployed/owns the agent
        address counterparty;       // who received service / sent payment to agent
        bytes32 categoryHash;       // semantic category, e.g. keccak256("AI_COMPUTE")
        uint128 amount;             // value transacted (in `asset`'s atomic units)
        address asset;              // token address (e.g. Arc USDC)
        bytes32 intentHash;         // hash of agent's stated intent
        bytes32 outcomeHash;        // hash of recorded outcome
        int128  satisfactionDelta;  // -1e6 .. +1e6 — bipolar quality signal
        uint64  timestamp;          // block.timestamp at time of agreement
    }

    // ---- Events ----

    event ReceiptEmitted(
        bytes32 indexed receiptId,
        address indexed agent,
        address indexed counterparty,
        address operator,
        bytes32 categoryHash,
        uint128 amount,
        address asset,
        bytes32 intentHash,
        bytes32 outcomeHash,
        int128  satisfactionDelta,
        uint64  timestamp,
        uint64  emittedAt
    );

    // ---- Errors ----

    error ReceiptAlreadyEmitted(bytes32 receiptId);
    error InvalidAgentSignature();
    error InvalidCounterpartySignature();
    error InvalidSignatureLength();
    error InvalidReceipt(string reason);

    // ---- API ----

    function emitReceipt(
        Receipt calldata receipt,
        bytes calldata agentSig,
        bytes calldata counterpartySig
    ) external;

    function isEmitted(bytes32 receiptId) external view returns (bool);
    function emittedAt(bytes32 receiptId) external view returns (uint64);
    function digestOf(Receipt calldata receipt) external view returns (bytes32);
    function storedDigest(bytes32 receiptId) external view returns (bytes32);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

contract Acta is IActa {
    string public constant NAME = "Aureus Acta";
    string public constant VERSION = "1";

    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    bytes32 private constant RECEIPT_TYPEHASH = keccak256(
        "Receipt(bytes32 receiptId,address agent,address operator,address counterparty,bytes32 categoryHash,uint128 amount,address asset,bytes32 intentHash,bytes32 outcomeHash,int128 satisfactionDelta,uint64 timestamp)"
    );

    /// @notice block.timestamp when each receipt was emitted; 0 if not yet emitted.
    mapping(bytes32 => uint64) private _emittedAt;

    /// @notice The EIP-712 digest of the emitted receipt, indexed by receiptId.
    /// @dev    Used by downstream consumers (e.g. Honos) to verify a caller-
    ///         supplied Receipt struct matches what was actually attested.
    mapping(bytes32 => bytes32) private _storedDigest;

    // ============================================================
    // PUBLIC API
    // ============================================================

    function emitReceipt(
        Receipt calldata receipt,
        bytes calldata agentSig,
        bytes calldata counterpartySig
    ) external {
        if (receipt.receiptId == bytes32(0)) revert InvalidReceipt("receiptId zero");
        if (receipt.agent == address(0)) revert InvalidReceipt("agent zero");
        if (receipt.counterparty == address(0)) revert InvalidReceipt("counterparty zero");
        if (receipt.agent == receipt.counterparty) revert InvalidReceipt("agent == counterparty");
        if (_emittedAt[receipt.receiptId] != 0) revert ReceiptAlreadyEmitted(receipt.receiptId);

        bytes32 digest = _typedDataHash(_hashReceipt(receipt));

        address recoveredAgent = _recover(digest, agentSig);
        if (recoveredAgent != receipt.agent) revert InvalidAgentSignature();

        address recoveredCounterparty = _recover(digest, counterpartySig);
        if (recoveredCounterparty != receipt.counterparty) revert InvalidCounterpartySignature();

        uint64 nowTs = uint64(block.timestamp);
        _emittedAt[receipt.receiptId] = nowTs;
        _storedDigest[receipt.receiptId] = digest;

        emit ReceiptEmitted(
            receipt.receiptId,
            receipt.agent,
            receipt.counterparty,
            receipt.operator,
            receipt.categoryHash,
            receipt.amount,
            receipt.asset,
            receipt.intentHash,
            receipt.outcomeHash,
            receipt.satisfactionDelta,
            receipt.timestamp,
            nowTs
        );
    }

    function isEmitted(bytes32 receiptId) external view returns (bool) {
        return _emittedAt[receiptId] != 0;
    }

    function emittedAt(bytes32 receiptId) external view returns (uint64) {
        return _emittedAt[receiptId];
    }

    function digestOf(Receipt calldata receipt) external view returns (bytes32) {
        return _typedDataHash(_hashReceipt(receipt));
    }

    function storedDigest(bytes32 receiptId) external view returns (bytes32) {
        return _storedDigest[receiptId];
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparator();
    }

    // ============================================================
    // EIP-712 INTERNALS
    // ============================================================

    function _hashReceipt(Receipt calldata r) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            RECEIPT_TYPEHASH,
            r.receiptId,
            r.agent,
            r.operator,
            r.counterparty,
            r.categoryHash,
            r.amount,
            r.asset,
            r.intentHash,
            r.outcomeHash,
            r.satisfactionDelta,
            r.timestamp
        ));
    }

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes(NAME)),
            keccak256(bytes(VERSION)),
            block.chainid,
            address(this)
        ));
    }

    function _typedDataHash(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
    }

    function _recover(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        if (sig.length != 65) revert InvalidSignatureLength();

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (v < 27) v += 27;

        return ecrecover(digest, v, r, s);
    }
}
