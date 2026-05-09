// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, Vm} from "forge-std/Test.sol";
import {Acta, IActa} from "../src/Acta.sol";
import {Honos, IHonos} from "../src/Honos.sol";

contract HonosTest is Test {
    Acta acta;
    Honos honos;

    uint256 internal agentPk;
    uint256 internal counterpartyPk;
    uint256 internal attackerPk;

    address internal agent;
    address internal counterparty;
    address internal attacker;
    address internal operator;
    address internal slasher;

    bytes32 internal constant CATEGORY_AI = keccak256("AI_COMPUTE");
    address internal constant ARC_USDC = 0x3600000000000000000000000000000000000000;

    uint64 internal constant ONE_DAY = 1 days;

    function setUp() public {
        agentPk = 0xA11CE;
        counterpartyPk = 0xB0B;
        attackerPk = 0xBADBAD;

        agent = vm.addr(agentPk);
        counterparty = vm.addr(counterpartyPk);
        attacker = vm.addr(attackerPk);
        operator = makeAddr("operator");
        slasher = makeAddr("slasher");

        acta = new Acta();
        honos = new Honos(address(acta), slasher);
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    function _signEip712(uint256 pk, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _emitReceipt(bytes32 id, uint128 amount) internal returns (IActa.Receipt memory rcpt) {
        rcpt = IActa.Receipt({
            receiptId: id,
            agent: agent,
            operator: operator,
            counterparty: counterparty,
            categoryHash: CATEGORY_AI,
            amount: amount,
            asset: ARC_USDC,
            intentHash: keccak256("intent"),
            outcomeHash: keccak256("outcome"),
            satisfactionDelta: int128(50_000),
            timestamp: uint64(block.timestamp)
        });
        bytes32 digest = acta.digestOf(rcpt);
        bytes memory aSig = _signEip712(agentPk, digest);
        bytes memory cSig = _signEip712(counterpartyPk, digest);
        acta.emitReceipt(rcpt, aSig, cSig);
    }

    function _mintBondForAgent(uint64 halfLife) internal returns (uint256 bondId) {
        bondId = honos.mint(agent, halfLife);
    }

    // ========================================================================
    // mint()
    // ========================================================================

    function test_mint_happyPath() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);

        IHonos.Bond memory b = honos.getBond(bondId);
        assertEq(b.agent, agent);
        assertEq(b.baseReputation, 0);
        assertEq(b.decayHalfLife, ONE_DAY);
        assertTrue(b.active);
        assertEq(honos.bondOf(agent), bondId);
    }

    function test_mint_revertsOnZeroAgent() public {
        vm.expectRevert(IHonos.AgentZero.selector);
        honos.mint(address(0), ONE_DAY);
    }

    function test_mint_revertsOnDuplicateAgent() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        vm.expectRevert(abi.encodeWithSelector(IHonos.AgentAlreadyHasBond.selector, agent, bondId));
        honos.mint(agent, ONE_DAY);
    }

    function test_mint_revertsOnHalfLifeTooShort() public {
        vm.expectRevert(IHonos.InvalidHalfLife.selector);
        honos.mint(agent, 30 minutes); // < MIN_HALF_LIFE (1 hour)
    }

    function test_mint_revertsOnHalfLifeTooLong() public {
        vm.expectRevert(IHonos.InvalidHalfLife.selector);
        honos.mint(agent, 800 days); // > MAX_HALF_LIFE (730 days)
    }

    // ========================================================================
    // recordSuccess()
    // ========================================================================

    function test_recordSuccess_happyPath() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(1)), 5_000_000); // 5 USDC

        honos.recordSuccess(bondId, r);

        IHonos.Bond memory b = honos.getBond(bondId);
        assertEq(b.baseReputation, 5); // 5 USDC = 5 rep points
        assertEq(honos.effectiveReputation(bondId), 5);
    }

    function test_recordSuccess_minWeightOne() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        // 0.001 USDC = 1000 atomic, divided by 1e6 = 0 → forced to 1
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(2)), 1_000);
        honos.recordSuccess(bondId, r);
        assertEq(honos.effectiveReputation(bondId), 1);
    }

    function test_recordSuccess_accumulates() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);

        IActa.Receipt memory r1 = _emitReceipt(bytes32(uint256(10)), 5_000_000);
        IActa.Receipt memory r2 = _emitReceipt(bytes32(uint256(11)), 3_000_000);
        IActa.Receipt memory r3 = _emitReceipt(bytes32(uint256(12)), 2_000_000);

        honos.recordSuccess(bondId, r1);
        honos.recordSuccess(bondId, r2);
        honos.recordSuccess(bondId, r3);

        assertEq(honos.effectiveReputation(bondId), 10);
    }

    function test_recordSuccess_revertsOnReceiptDigestMismatch() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(20)), 5_000_000);

        // Tamper amount AFTER acta verified the original.
        r.amount = 99_999_999;

        vm.expectRevert(abi.encodeWithSelector(IHonos.ReceiptDigestMismatch.selector, r.receiptId));
        honos.recordSuccess(bondId, r);
    }

    function test_recordSuccess_revertsIfReceiptNotEmitted() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = IActa.Receipt({
            receiptId: bytes32(uint256(99)),
            agent: agent,
            operator: operator,
            counterparty: counterparty,
            categoryHash: CATEGORY_AI,
            amount: 1_000_000,
            asset: ARC_USDC,
            intentHash: keccak256("intent"),
            outcomeHash: keccak256("outcome"),
            satisfactionDelta: int128(0),
            timestamp: uint64(block.timestamp)
        });
        // Did NOT call acta.emitReceipt — expect revert.
        vm.expectRevert(abi.encodeWithSelector(IHonos.ReceiptNotEmitted.selector, r.receiptId));
        honos.recordSuccess(bondId, r);
    }

    function test_recordSuccess_revertsOnAgentMismatch() public {
        // Mint bond for agent.
        uint256 bondId = _mintBondForAgent(ONE_DAY);

        // Emit receipt where receipt.agent != bond.agent.
        IActa.Receipt memory r = IActa.Receipt({
            receiptId: bytes32(uint256(30)),
            agent: attacker,
            operator: operator,
            counterparty: counterparty,
            categoryHash: CATEGORY_AI,
            amount: 5_000_000,
            asset: ARC_USDC,
            intentHash: keccak256("intent"),
            outcomeHash: keccak256("outcome"),
            satisfactionDelta: int128(0),
            timestamp: uint64(block.timestamp)
        });
        bytes32 d = acta.digestOf(r);
        acta.emitReceipt(r, _signEip712(attackerPk, d), _signEip712(counterpartyPk, d));

        vm.expectRevert(
            abi.encodeWithSelector(IHonos.ReceiptAgentMismatch.selector, bondId, agent, attacker)
        );
        honos.recordSuccess(bondId, r);
    }

    function test_recordSuccess_revertsOnInactiveBond() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        vm.prank(agent);
        honos.burn(bondId);

        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(40)), 5_000_000);
        vm.expectRevert(abi.encodeWithSelector(IHonos.BondNotActive.selector, bondId));
        honos.recordSuccess(bondId, r);
    }

    // ========================================================================
    // Decay
    // ========================================================================

    /// @dev Each decay test gets its OWN setUp() (fresh mint + recordSuccess) to
    ///      avoid the Foundry quirk where chained vm.warp + view calls within a
    ///      single function can cause stale block.timestamp reads. One warp per
    ///      test = clean, deterministic, easy to reason about.

    function test_decay_noTimePassed_returnsBaseRep() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(50)), 100_000_000);
        honos.recordSuccess(bondId, r);

        assertEq(honos.effectiveReputation(bondId), 100);
    }

    function test_decay_atOneHalfLife_halves() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(51)), 100_000_000);
        honos.recordSuccess(bondId, r);

        vm.warp(block.timestamp + 1 days);
        assertEq(honos.effectiveReputation(bondId), 50);
    }

    function test_decay_atTwoHalfLives_quarters() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(52)), 100_000_000);
        honos.recordSuccess(bondId, r);

        vm.warp(block.timestamp + 2 days);
        assertEq(honos.effectiveReputation(bondId), 25);
    }

    function test_decay_atThreeHalfLives() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(53)), 100_000_000);
        honos.recordSuccess(bondId, r);

        vm.warp(block.timestamp + 3 days);
        assertEq(honos.effectiveReputation(bondId), 12); // 100 >> 3 = 12
    }

    function test_decay_partialPeriodReturnsBaseRep() public {
        // Less than one half-life elapsed → no decay yet.
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(54)), 100_000_000);
        honos.recordSuccess(bondId, r);

        vm.warp(block.timestamp + 12 hours);
        assertEq(honos.effectiveReputation(bondId), 100);
    }

    function test_decay_zeroAfterManyHalvings() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(51)), 100_000_000);
        honos.recordSuccess(bondId, r);

        vm.warp(block.timestamp + 130 days); // > 128 half-lives
        assertEq(honos.effectiveReputation(bondId), 0);
    }

    function test_decay_resetsOnNewActivity() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);

        IActa.Receipt memory r1 = _emitReceipt(bytes32(uint256(60)), 100_000_000); // 100 rep
        honos.recordSuccess(bondId, r1);
        assertEq(honos.effectiveReputation(bondId), 100);

        vm.warp(block.timestamp + 1 days); // halve to 50
        assertEq(honos.effectiveReputation(bondId), 50);

        // New activity adds weight to *decayed* base, then resets timer.
        IActa.Receipt memory r2 = _emitReceipt(bytes32(uint256(61)), 30_000_000); // +30 rep
        honos.recordSuccess(bondId, r2);
        assertEq(honos.effectiveReputation(bondId), 80); // 50 + 30
    }

    // ========================================================================
    // Slash
    // ========================================================================

    function test_slash_reducesReputation() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(70)), 100_000_000);
        honos.recordSuccess(bondId, r);

        vm.prank(slasher);
        honos.slash(bondId, 30, bytes32(uint256(0xDEAD)));

        IHonos.Bond memory b = honos.getBond(bondId);
        assertEq(b.baseReputation, 70);
        assertEq(b.totalSlashed, 30);
    }

    function test_slash_revertsForUnauthorized() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(71)), 50_000_000);
        honos.recordSuccess(bondId, r);

        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(IHonos.UnauthorizedSlasher.selector, attacker));
        honos.slash(bondId, 10, bytes32(0));
    }

    function test_slash_revertsOnAmountExceedsRep() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        IActa.Receipt memory r = _emitReceipt(bytes32(uint256(72)), 50_000_000);
        honos.recordSuccess(bondId, r);

        vm.prank(slasher);
        vm.expectRevert(abi.encodeWithSelector(IHonos.AmountExceedsReputation.selector, 999, 50));
        honos.slash(bondId, 999, bytes32(0));
    }

    function test_slash_revertsOnZeroAmount() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        vm.prank(slasher);
        vm.expectRevert(IHonos.AmountIsZero.selector);
        honos.slash(bondId, 0, bytes32(0));
    }

    // ========================================================================
    // Burn
    // ========================================================================

    function test_burn_byAgent_works() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        vm.prank(agent);
        honos.burn(bondId);
        assertFalse(honos.getBond(bondId).active);
        assertEq(honos.bondOf(agent), 0); // mapping cleared so agent can re-mint
    }

    function test_burn_revertsForNonAgent() public {
        uint256 bondId = _mintBondForAgent(ONE_DAY);
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(IHonos.UnauthorizedAgent.selector, attacker, agent));
        honos.burn(bondId);
    }

    // ========================================================================
    // setSlasher
    // ========================================================================

    function test_setSlasher_byOwner_works() public {
        address newSlasher = makeAddr("newSlasher");
        honos.setSlasher(newSlasher); // msg.sender = test contract = owner
        assertEq(honos.slasher(), newSlasher);
    }

    function test_setSlasher_revertsForNonOwner() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(IHonos.UnauthorizedSlasher.selector, attacker));
        honos.setSlasher(makeAddr("nope"));
    }
}
