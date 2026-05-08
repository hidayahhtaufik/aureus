// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";

interface IUSDC {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function version() external view returns (string memory);
    function authorizationState(address authorizer, bytes32 nonce) external view returns (bool);
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

interface IPermit2 {
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

contract USDCTest is Test {
    address constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    function setUp() public {
        vm.createSelectFork(vm.rpcUrl("arc-testnet"));
    }

    function test_01_USDC_HasCode() public view {
        uint256 size = ARC_USDC.code.length;
        console2.log("USDC code size:", size);
        if (size == 0) {
            console2.log("USDC has NO bytecode -- precompile or system contract");
        } else {
            console2.log("USDC has bytecode -- standard ERC-20 contract");
        }
    }

    function test_02_USDC_StandardERC20() public {
        IUSDC usdc = IUSDC(ARC_USDC);

        try usdc.name() returns (string memory n) {
            console2.log("name() =", n);
        } catch {
            console2.log("name() REVERTED");
        }

        try usdc.symbol() returns (string memory s) {
            console2.log("symbol() =", s);
        } catch {
            console2.log("symbol() REVERTED");
        }

        try usdc.decimals() returns (uint8 d) {
            console2.log("decimals() =", uint256(d));
        } catch {
            console2.log("decimals() REVERTED");
        }

        try usdc.totalSupply() returns (uint256 t) {
            console2.log("totalSupply() =", t);
        } catch {
            console2.log("totalSupply() REVERTED");
        }
    }

    function test_03_USDC_EIP712Domain() public {
        IUSDC usdc = IUSDC(ARC_USDC);

        try usdc.DOMAIN_SEPARATOR() returns (bytes32 sep) {
            console2.log("DOMAIN_SEPARATOR exists -- EIP-712 SUPPORTED");
            console2.logBytes32(sep);
        } catch {
            console2.log("DOMAIN_SEPARATOR REVERTED -- EIP-712 NOT detected");
        }

        try usdc.version() returns (string memory v) {
            console2.log("version() =", v);
        } catch {
            console2.log("version() REVERTED");
        }
    }

    function test_04_USDC_EIP3009Support() public {
        IUSDC usdc = IUSDC(ARC_USDC);
        bytes32 fakeNonce = keccak256("aureus_eip3009_probe");

        try usdc.authorizationState(address(this), fakeNonce) returns (bool used) {
            console2.log("authorizationState() works -- EIP-3009 SUPPORTED");
            console2.log("Nonce used flag:", used);
        } catch {
            console2.log("authorizationState() REVERTED -- EIP-3009 NOT supported");
        }
    }

    function test_05_Permit2_Deployed() public view {
        uint256 size = PERMIT2.code.length;
        console2.log("Permit2 code size:", size);
        require(size > 0, "Permit2 NOT deployed on Arc testnet");
        console2.log("Permit2 IS deployed at canonical address");
    }

    function test_06_Permit2_Domain() public view {
        IPermit2 permit2 = IPermit2(PERMIT2);
        bytes32 sep = permit2.DOMAIN_SEPARATOR();
        console2.log("Permit2 DOMAIN_SEPARATOR:");
        console2.logBytes32(sep);
    }
}
