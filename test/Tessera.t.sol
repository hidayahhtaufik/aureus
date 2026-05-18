// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Tessera, ITessera, MerkleProofLib, IERC20} from "../src/Tessera.sol";

/**
 * @notice Minimal USDC mock with the methods Tessera needs.
 *         Behaves like a 6-decimal ERC-20.
 */
contract MockUSDC {
    string public constant name = "USD Coin";
    string public constant symbol = "USDC";
    uint8 public constant decimals = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "MockUSDC: insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "MockUSDC: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "MockUSDC: insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}

contract TesseraTest is Test {
    Tessera tessera;
    MockUSDC usdc;

    address operator = makeAddr("operator");
    address holder = makeAddr("holder");
    address recipient = makeAddr("recipient");
    address attacker = makeAddr("attacker");

    bytes32 constant CATEGORY_AI = keccak256("AI_COMPUTE");
    bytes32 constant CATEGORY_DATA = keccak256("DATA_API");

    // Set in setUp:
    bytes32 root_recipient_AI;       // single-leaf root (just (recipient, CATEGORY_AI))
    bytes32 root_recipient_DATA;     // single-leaf root for DATA category

    function setUp() public {
        usdc = new MockUSDC();
        tessera = new Tessera(address(usdc));

        // Fund operator with 1000 USDC
        usdc.mint(operator, 1_000_000_000); // 1000 * 1e6

        // Single-leaf Merkle "tree" — root == leaf when there's 1 entry.
        root_recipient_AI = keccak256(abi.encodePacked(recipient, CATEGORY_AI));
        root_recipient_DATA = keccak256(abi.encodePacked(recipient, CATEGORY_DATA));
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    function _defaultPolicy(address op, address kill) internal view returns (ITessera.Policy memory) {
        return ITessera.Policy({
            categoryRoot: root_recipient_AI,
            perTxCap: 50_000_000,         // 50 USDC
            dailyCap: 100_000_000,        // 100 USDC
            expiresAt: uint64(block.timestamp + 7 days),
            operator: op,
            killKey: kill,
            active: true
        });
    }

    function _wrapDefault(uint128 amount) internal returns (uint256 policyId) {
        ITessera.Policy memory p = _defaultPolicy(operator, operator);
        vm.startPrank(operator);
        usdc.approve(address(tessera), amount);
        policyId = tessera.wrap(holder, amount, p);
        vm.stopPrank();
    }

    // ========================================================================
    // wrap()
    // ========================================================================

    function test_wrap_happyPath() public {
        ITessera.Policy memory p = _defaultPolicy(operator, operator);

        vm.startPrank(operator);
        usdc.approve(address(tessera), 100_000_000);
        uint256 policyId = tessera.wrap(holder, 100_000_000, p);
        vm.stopPrank();

        assertEq(policyId, 1);
        assertEq(tessera.getRemainingBalance(policyId), 100_000_000);
        assertEq(tessera.holderOf(policyId), holder);
        assertEq(usdc.balanceOf(address(tessera)), 100_000_000);
        assertEq(usdc.balanceOf(operator), 900_000_000);

        ITessera.Policy memory stored = tessera.getPolicy(policyId);
        assertTrue(stored.active);
        assertEq(stored.operator, operator);
    }

    function test_wrap_revertsOnZeroAmount() public {
        ITessera.Policy memory p = _defaultPolicy(operator, operator);
        vm.prank(operator);
        vm.expectRevert(ITessera.AmountIsZero.selector);
        tessera.wrap(holder, 0, p);
    }

    function test_wrap_revertsOnZeroHolder() public {
        ITessera.Policy memory p = _defaultPolicy(operator, operator);
        vm.startPrank(operator);
        usdc.approve(address(tessera), 100);
        vm.expectRevert(abi.encodeWithSelector(ITessera.InvalidPolicy.selector, "holder is zero"));
        tessera.wrap(address(0), 100, p);
        vm.stopPrank();
    }

    function test_wrap_revertsOnZeroOperator() public {
        ITessera.Policy memory p = _defaultPolicy(address(0), operator);
        vm.startPrank(operator);
        usdc.approve(address(tessera), 100);
        vm.expectRevert(abi.encodeWithSelector(ITessera.InvalidPolicy.selector, "operator is zero"));
        tessera.wrap(holder, 100, p);
        vm.stopPrank();
    }

    function test_wrap_revertsOnPerTxCapAboveDailyCap() public {
        ITessera.Policy memory p = _defaultPolicy(operator, operator);
        p.perTxCap = 200_000_000;
        p.dailyCap = 100_000_000;
        vm.startPrank(operator);
        usdc.approve(address(tessera), 100);
        vm.expectRevert(abi.encodeWithSelector(ITessera.InvalidPolicy.selector, "perTxCap > dailyCap"));
        tessera.wrap(holder, 100, p);
        vm.stopPrank();
    }

    function test_wrap_revertsOnPastExpiry() public {
        ITessera.Policy memory p = _defaultPolicy(operator, operator);
        p.expiresAt = uint64(block.timestamp); // not strictly future
        vm.startPrank(operator);
        usdc.approve(address(tessera), 100);
        vm.expectRevert(abi.encodeWithSelector(ITessera.InvalidPolicy.selector, "expiresAt in past"));
        tessera.wrap(holder, 100, p);
        vm.stopPrank();
    }

    function test_wrap_revertsOnInactivePolicy() public {
        ITessera.Policy memory p = _defaultPolicy(operator, operator);
        p.active = false;
        vm.startPrank(operator);
        usdc.approve(address(tessera), 100);
        vm.expectRevert(abi.encodeWithSelector(ITessera.InvalidPolicy.selector, "active must be true"));
        tessera.wrap(holder, 100, p);
        vm.stopPrank();
    }

    // ========================================================================
    // spend()
    // ========================================================================

    function test_spend_happyPath() public {
        uint256 policyId = _wrapDefault(100_000_000);

        bytes32[] memory proof = new bytes32[](0); // single-leaf, empty proof

        vm.prank(holder);
        tessera.spend(policyId, recipient, 10_000_000, CATEGORY_AI, proof);

        assertEq(tessera.getRemainingBalance(policyId), 90_000_000);
        assertEq(usdc.balanceOf(recipient), 10_000_000);
        assertEq(tessera.getRemainingDailyCap(policyId), 90_000_000);
    }

    function test_spend_revertsIfCallerNotHolder() public {
        uint256 policyId = _wrapDefault(100_000_000);
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(ITessera.UnauthorizedOperator.selector, attacker));
        tessera.spend(policyId, recipient, 10_000_000, CATEGORY_AI, proof);
    }

    function test_spend_revertsIfAmountZero() public {
        uint256 policyId = _wrapDefault(100_000_000);
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(holder);
        vm.expectRevert(ITessera.AmountIsZero.selector);
        tessera.spend(policyId, recipient, 0, CATEGORY_AI, proof);
    }

    function test_spend_revertsIfAmountExceedsBalance() public {
        uint256 policyId = _wrapDefault(20_000_000);
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(holder);
        vm.expectRevert(abi.encodeWithSelector(ITessera.AmountExceedsBalance.selector, 30_000_000, 20_000_000));
        tessera.spend(policyId, recipient, 30_000_000, CATEGORY_AI, proof);
    }

    function test_spend_revertsIfAmountExceedsPerTxCap() public {
        uint256 policyId = _wrapDefault(200_000_000);
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(holder);
        vm.expectRevert(abi.encodeWithSelector(ITessera.AmountExceedsPerTxCap.selector, 80_000_000, 50_000_000));
        tessera.spend(policyId, recipient, 80_000_000, CATEGORY_AI, proof);
    }

    function test_spend_revertsIfAmountExceedsDailyCap() public {
        uint256 policyId = _wrapDefault(200_000_000);
        bytes32[] memory proof = new bytes32[](0);

        // Spend 50 + 50 = 100 (== cap). Now any further spend overflows.
        vm.startPrank(holder);
        tessera.spend(policyId, recipient, 50_000_000, CATEGORY_AI, proof);
        tessera.spend(policyId, recipient, 50_000_000, CATEGORY_AI, proof);

        vm.expectRevert(
            abi.encodeWithSelector(ITessera.AmountExceedsDailyCap.selector, 110_000_000, 100_000_000)
        );
        tessera.spend(policyId, recipient, 10_000_000, CATEGORY_AI, proof);
        vm.stopPrank();
    }

    function test_spend_dailyCap_resetsNextDay() public {
        uint256 policyId = _wrapDefault(300_000_000);
        bytes32[] memory proof = new bytes32[](0);

        vm.startPrank(holder);
        tessera.spend(policyId, recipient, 50_000_000, CATEGORY_AI, proof);
        tessera.spend(policyId, recipient, 50_000_000, CATEGORY_AI, proof);
        // Daily cap exhausted.

        // Advance one day.
        vm.warp(block.timestamp + 1 days);

        // Should succeed again.
        tessera.spend(policyId, recipient, 50_000_000, CATEGORY_AI, proof);
        vm.stopPrank();

        assertEq(tessera.getRemainingBalance(policyId), 150_000_000);
    }

    function test_spend_revertsOnWrongCategory() public {
        uint256 policyId = _wrapDefault(100_000_000);
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(holder);
        vm.expectRevert(ITessera.InvalidCategoryProof.selector);
        // Policy categoryRoot = (recipient, CATEGORY_AI). Trying CATEGORY_DATA fails.
        tessera.spend(policyId, recipient, 10_000_000, CATEGORY_DATA, proof);
    }

    function test_spend_revertsOnWrongRecipient() public {
        uint256 policyId = _wrapDefault(100_000_000);
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(holder);
        vm.expectRevert(ITessera.InvalidCategoryProof.selector);
        tessera.spend(policyId, attacker, 10_000_000, CATEGORY_AI, proof);
    }

    function test_spend_revertsAfterExpiry() public {
        uint256 policyId = _wrapDefault(100_000_000);
        bytes32[] memory proof = new bytes32[](0);

        vm.warp(block.timestamp + 8 days); // policy expires at +7 days

        vm.prank(holder);
        vm.expectRevert(abi.encodeWithSelector(ITessera.PolicyExpiredErr.selector, policyId));
        tessera.spend(policyId, recipient, 10_000_000, CATEGORY_AI, proof);
    }

    // ========================================================================
    // revokeAndRecover()
    // ========================================================================

    function test_revoke_byOperator_returnsRemainingFunds() public {
        uint256 policyId = _wrapDefault(100_000_000);

        bytes32[] memory proof = new bytes32[](0);
        vm.prank(holder);
        tessera.spend(policyId, recipient, 30_000_000, CATEGORY_AI, proof);

        uint256 operatorBalanceBefore = usdc.balanceOf(operator);

        vm.prank(operator);
        tessera.revokeAndRecover(policyId);

        uint256 operatorBalanceAfter = usdc.balanceOf(operator);
        assertEq(operatorBalanceAfter - operatorBalanceBefore, 70_000_000);
        assertEq(tessera.getRemainingBalance(policyId), 0);
        assertFalse(tessera.getPolicy(policyId).active);
    }

    function test_revoke_byKillKey_works() public {
        address killKey = makeAddr("killKey");
        ITessera.Policy memory p = _defaultPolicy(operator, killKey);

        vm.startPrank(operator);
        usdc.approve(address(tessera), 100_000_000);
        uint256 policyId = tessera.wrap(holder, 100_000_000, p);
        vm.stopPrank();

        vm.prank(killKey);
        tessera.revokeAndRecover(policyId);

        assertFalse(tessera.getPolicy(policyId).active);
        // Funds go to operator (not killKey).
        assertEq(usdc.balanceOf(operator), 1_000_000_000);
        assertEq(usdc.balanceOf(killKey), 0);
    }

    function test_revoke_revertsForUnauthorized() public {
        uint256 policyId = _wrapDefault(100_000_000);

        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(ITessera.UnauthorizedOperator.selector, attacker));
        tessera.revokeAndRecover(policyId);
    }

    function test_revoke_revertsIfAlreadyInactive() public {
        uint256 policyId = _wrapDefault(100_000_000);

        vm.prank(operator);
        tessera.revokeAndRecover(policyId);

        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(ITessera.PolicyNotActive.selector, policyId));
        tessera.revokeAndRecover(policyId);
    }

    function test_revoke_blocksFurtherSpend() public {
        uint256 policyId = _wrapDefault(100_000_000);

        vm.prank(operator);
        tessera.revokeAndRecover(policyId);

        bytes32[] memory proof = new bytes32[](0);
        vm.prank(holder);
        vm.expectRevert(abi.encodeWithSelector(ITessera.PolicyNotActive.selector, policyId));
        tessera.spend(policyId, recipient, 10_000_000, CATEGORY_AI, proof);
    }

    // ========================================================================
    // expire()
    // ========================================================================

    function test_expire_anyoneCanCallAfterDeadline() public {
        uint256 policyId = _wrapDefault(100_000_000);

        vm.warp(block.timestamp + 8 days); // policy expires at +7 days

        // Funds always go back to operator regardless of caller.
        uint256 opBefore = usdc.balanceOf(operator);
        vm.prank(attacker);
        tessera.expire(policyId);
        uint256 opAfter = usdc.balanceOf(operator);

        assertEq(opAfter - opBefore, 100_000_000);
        assertFalse(tessera.getPolicy(policyId).active);
    }

    function test_expire_revertsIfNotYetExpired() public {
        uint256 policyId = _wrapDefault(100_000_000);

        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(ITessera.PolicyNotYetExpired.selector, policyId));
        tessera.expire(policyId);
    }

    function test_expire_revertsIfNoExpirySet() public {
        ITessera.Policy memory p = _defaultPolicy(operator, operator);
        p.expiresAt = 0;

        vm.startPrank(operator);
        usdc.approve(address(tessera), 100_000_000);
        uint256 policyId = tessera.wrap(holder, 100_000_000, p);
        vm.stopPrank();

        vm.warp(block.timestamp + 365 days);

        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(ITessera.PolicyNotYetExpired.selector, policyId));
        tessera.expire(policyId);
    }

    // ========================================================================
    // Multi-policy scenarios
    // ========================================================================

    function test_multiplePolicies_independentAccounting() public {
        uint256 p1 = _wrapDefault(100_000_000);
        uint256 p2 = _wrapDefault(200_000_000);

        assertEq(p1, 1);
        assertEq(p2, 2);

        bytes32[] memory proof = new bytes32[](0);

        vm.startPrank(holder);
        tessera.spend(p1, recipient, 10_000_000, CATEGORY_AI, proof);
        tessera.spend(p2, recipient, 20_000_000, CATEGORY_AI, proof);
        vm.stopPrank();

        assertEq(tessera.getRemainingBalance(p1), 90_000_000);
        assertEq(tessera.getRemainingBalance(p2), 180_000_000);
        // p1's daily cap is independent from p2's
        assertEq(tessera.getRemainingDailyCap(p1), 90_000_000);
        assertEq(tessera.getRemainingDailyCap(p2), 80_000_000);
    }
}
