// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2, Vm} from "forge-std/Test.sol";
import {Acta, IActa} from "../src/Acta.sol";

contract ActaTest is Test {
    Acta acta;

    uint256 internal agentPk;
    uint256 internal counterpartyPk;
    uint256 internal attackerPk;

    address internal agent;
    address internal operator;
    address internal counterparty;
    address internal attacker;

    bytes32 internal constant CATEGORY_AI = keccak256("AI_COMPUTE");
    address internal constant ARC_USDC = 0x3600000000000000000000000000000000000000;

    function setUp() public {
        acta = new Acta();

        // Deterministic test keys
        agentPk = 0xA11CE;
        counterpartyPk = 0xB0B;
        attackerPk = 0xBADBADBAD;

        agent = vm.addr(agentPk);
        counterparty = vm.addr(counterpartyPk);
        attacker = vm.addr(attackerPk);
        operator = makeAddr("operator");
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    function _sampleReceipt(bytes32 id) internal view returns (IActa.Receipt memory) {
        return IActa.Receipt({
            receiptId: id,
            agent: agent,
            operator: operator,
            counterparty: counterparty,
            categoryHash: CATEGORY_AI,
            amount: 10_000, // 0.01 USDC (6 decimals)
            asset: ARC_USDC,
            intentHash: keccak256("get-weather-jakarta"),
            outcomeHash: keccak256("rain-26C-78pct"),
            satisfactionDelta: int128(50_000), // 5% positive
            timestamp: uint64(block.timestamp)
        });
    }

    function _signEip712(uint256 pk, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    // ========================================================================
    // emitReceipt() — happy path
    // ========================================================================

    function test_emitReceipt_happyPath() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(1)));
        bytes32 digest = acta.digestOf(rcpt);

        bytes memory agentSig = _signEip712(agentPk, digest);
        bytes memory counterSig = _signEip712(counterpartyPk, digest);

        vm.recordLogs();
        acta.emitReceipt(rcpt, agentSig, counterSig);
        Vm.Log[] memory entries = vm.getRecordedLogs();

        assertTrue(acta.isEmitted(rcpt.receiptId));
        assertEq(acta.emittedAt(rcpt.receiptId), uint64(block.timestamp));

        // Confirm event was emitted (basic structural check)
        assertEq(entries.length, 1);
        assertEq(entries[0].topics[0], keccak256(
            "ReceiptEmitted(bytes32,address,address,address,bytes32,uint128,address,bytes32,bytes32,int128,uint64,uint64)"
        ));
        assertEq(entries[0].topics[1], rcpt.receiptId);
        assertEq(entries[0].topics[2], bytes32(uint256(uint160(agent))));
        assertEq(entries[0].topics[3], bytes32(uint256(uint160(counterparty))));
    }

    // ========================================================================
    // Validation reverts
    // ========================================================================

    function test_emit_revertsOnZeroReceiptId() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(0));
        bytes memory agentSig = _signEip712(agentPk, acta.digestOf(rcpt));
        bytes memory counterSig = _signEip712(counterpartyPk, acta.digestOf(rcpt));

        vm.expectRevert(abi.encodeWithSelector(IActa.InvalidReceipt.selector, "receiptId zero"));
        acta.emitReceipt(rcpt, agentSig, counterSig);
    }

    function test_emit_revertsOnZeroAgent() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(2)));
        rcpt.agent = address(0);
        // Use any signature — we expect the validation revert before signature check.
        bytes memory placeholder = abi.encodePacked(bytes32(0), bytes32(0), uint8(27));

        vm.expectRevert(abi.encodeWithSelector(IActa.InvalidReceipt.selector, "agent zero"));
        acta.emitReceipt(rcpt, placeholder, placeholder);
    }

    function test_emit_revertsOnZeroCounterparty() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(3)));
        rcpt.counterparty = address(0);
        bytes memory placeholder = abi.encodePacked(bytes32(0), bytes32(0), uint8(27));

        vm.expectRevert(abi.encodeWithSelector(IActa.InvalidReceipt.selector, "counterparty zero"));
        acta.emitReceipt(rcpt, placeholder, placeholder);
    }

    function test_emit_revertsWhenAgentEqualsCounterparty() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(4)));
        rcpt.counterparty = rcpt.agent;
        bytes memory placeholder = abi.encodePacked(bytes32(0), bytes32(0), uint8(27));

        vm.expectRevert(abi.encodeWithSelector(IActa.InvalidReceipt.selector, "agent == counterparty"));
        acta.emitReceipt(rcpt, placeholder, placeholder);
    }

    function test_emit_revertsOnDuplicate() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(5)));
        bytes32 digest = acta.digestOf(rcpt);
        bytes memory agentSig = _signEip712(agentPk, digest);
        bytes memory counterSig = _signEip712(counterpartyPk, digest);

        acta.emitReceipt(rcpt, agentSig, counterSig);

        vm.expectRevert(abi.encodeWithSelector(IActa.ReceiptAlreadyEmitted.selector, rcpt.receiptId));
        acta.emitReceipt(rcpt, agentSig, counterSig);
    }

    // ========================================================================
    // Signature verification reverts
    // ========================================================================

    function test_emit_revertsOnInvalidAgentSignature() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(6)));
        bytes32 digest = acta.digestOf(rcpt);

        // Attacker signs as agent — should fail.
        bytes memory agentSigFake = _signEip712(attackerPk, digest);
        bytes memory counterSig = _signEip712(counterpartyPk, digest);

        vm.expectRevert(IActa.InvalidAgentSignature.selector);
        acta.emitReceipt(rcpt, agentSigFake, counterSig);
    }

    function test_emit_revertsOnInvalidCounterpartySignature() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(7)));
        bytes32 digest = acta.digestOf(rcpt);

        bytes memory agentSig = _signEip712(agentPk, digest);
        // Attacker signs as counterparty — should fail.
        bytes memory counterSigFake = _signEip712(attackerPk, digest);

        vm.expectRevert(IActa.InvalidCounterpartySignature.selector);
        acta.emitReceipt(rcpt, agentSig, counterSigFake);
    }

    function test_emit_revertsOnTamperedReceipt() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(8)));
        bytes32 digest = acta.digestOf(rcpt);

        bytes memory agentSig = _signEip712(agentPk, digest);
        bytes memory counterSig = _signEip712(counterpartyPk, digest);

        // Tamper amount AFTER signing.
        rcpt.amount = 9_999_999;

        vm.expectRevert(IActa.InvalidAgentSignature.selector);
        acta.emitReceipt(rcpt, agentSig, counterSig);
    }

    function test_emit_revertsOnInvalidSignatureLength() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(9)));
        bytes32 digest = acta.digestOf(rcpt);

        bytes memory shortSig = hex"1234";
        bytes memory counterSig = _signEip712(counterpartyPk, digest);

        vm.expectRevert(IActa.InvalidSignatureLength.selector);
        acta.emitReceipt(rcpt, shortSig, counterSig);
    }

    // ========================================================================
    // Independence — different receipts succeed independently
    // ========================================================================

    function test_emit_multipleReceiptsIndependent() public {
        IActa.Receipt memory r1 = _sampleReceipt(bytes32(uint256(100)));
        IActa.Receipt memory r2 = _sampleReceipt(bytes32(uint256(101)));

        bytes32 d1 = acta.digestOf(r1);
        bytes32 d2 = acta.digestOf(r2);

        acta.emitReceipt(r1, _signEip712(agentPk, d1), _signEip712(counterpartyPk, d1));
        acta.emitReceipt(r2, _signEip712(agentPk, d2), _signEip712(counterpartyPk, d2));

        assertTrue(acta.isEmitted(r1.receiptId));
        assertTrue(acta.isEmitted(r2.receiptId));
    }

    // ========================================================================
    // Domain separator semantics
    // ========================================================================

    function test_domainSeparator_includesChainIdAndAddress() public {
        bytes32 expected = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("Aureus Acta")),
            keccak256(bytes("1")),
            block.chainid,
            address(acta)
        ));
        assertEq(acta.DOMAIN_SEPARATOR(), expected);
    }

    function test_signatureFromDifferentChainId_failsRecovery() public {
        IActa.Receipt memory rcpt = _sampleReceipt(bytes32(uint256(200)));

        // Compute a digest using a fake chainId to simulate signing on the wrong chain.
        bytes32 fakeDomain = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("Aureus Acta")),
            keccak256(bytes("1")),
            uint256(99999),
            address(acta)
        ));
        bytes32 structHash = keccak256(abi.encode(
            keccak256(
                "Receipt(bytes32 receiptId,address agent,address operator,address counterparty,bytes32 categoryHash,uint128 amount,address asset,bytes32 intentHash,bytes32 outcomeHash,int128 satisfactionDelta,uint64 timestamp)"
            ),
            rcpt.receiptId,
            rcpt.agent,
            rcpt.operator,
            rcpt.counterparty,
            rcpt.categoryHash,
            rcpt.amount,
            rcpt.asset,
            rcpt.intentHash,
            rcpt.outcomeHash,
            rcpt.satisfactionDelta,
            rcpt.timestamp
        ));
        bytes32 wrongDigest = keccak256(abi.encodePacked("\x19\x01", fakeDomain, structHash));

        bytes memory agentSigWrongChain = _signEip712(agentPk, wrongDigest);
        bytes memory counterSig = _signEip712(counterpartyPk, acta.digestOf(rcpt));

        vm.expectRevert(IActa.InvalidAgentSignature.selector);
        acta.emitReceipt(rcpt, agentSigWrongChain, counterSig);
    }
}
