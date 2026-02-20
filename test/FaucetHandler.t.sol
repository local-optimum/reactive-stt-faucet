// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {FaucetHandler} from "../src/FaucetHandler.sol";

contract FaucetHandlerTest is Test {
    FaucetHandler public handler;

    address constant PRECOMPILE = address(0x0100);
    address requester = makeAddr("requester");

    event FaucetGranted(address indexed requester, uint256 amount);
    event FaucetDenied(address indexed requester, string reason);

    function setUp() public {
        handler = new FaucetHandler();
        vm.deal(address(handler), 10 ether);
    }

    function _buildTopics(address addr) internal pure returns (bytes32[] memory) {
        bytes32[] memory topics = new bytes32[](2);
        topics[0] = keccak256("FaucetRequested(address)");
        topics[1] = bytes32(uint256(uint160(addr)));
        return topics;
    }

    function _callOnEvent(address addr) internal {
        vm.prank(PRECOMPILE);
        handler.onEvent(address(0), _buildTopics(addr), "");
    }

    function test_GrantEligibleRequester() public {
        vm.deal(requester, 0);

        vm.expectEmit(true, false, false, true);
        emit FaucetGranted(requester, 0.5 ether);

        _callOnEvent(requester);

        assertEq(requester.balance, 0.5 ether);
        assertEq(handler.lastGrant(requester), block.timestamp);
        assertEq(handler.totalGranted(), 0.5 ether);
        assertEq(handler.totalClaimers(), 1);
    }

    function test_DenyCooldown() public {
        vm.deal(requester, 0);
        _callOnEvent(requester);

        vm.expectEmit(true, false, false, true);
        emit FaucetDenied(requester, "cooldown");

        _callOnEvent(requester);

        assertEq(requester.balance, 0.5 ether);
        assertEq(handler.totalGranted(), 0.5 ether);
    }

    function test_GrantAfterCooldown() public {
        vm.deal(requester, 0);
        _callOnEvent(requester);

        vm.warp(block.timestamp + 24 hours);

        _callOnEvent(requester);

        assertEq(requester.balance, 1 ether);
        assertEq(handler.totalGranted(), 1 ether);
        // totalClaimers should still be 1 (same address)
        assertEq(handler.totalClaimers(), 1);
    }

    function test_DenyBalanceTooHigh() public {
        vm.deal(requester, 1 ether);

        vm.expectEmit(true, false, false, true);
        emit FaucetDenied(requester, "balance_too_high");

        _callOnEvent(requester);

        assertEq(requester.balance, 1 ether);
        assertEq(handler.totalGranted(), 0);
    }

    function test_DenyFaucetEmpty() public {
        vm.deal(address(handler), 0);
        vm.deal(requester, 0);

        vm.expectEmit(true, false, false, true);
        emit FaucetDenied(requester, "faucet_empty");

        _callOnEvent(requester);
    }

    function test_UniqueClaimerCounting() public {
        address alice = makeAddr("alice");
        address bob = makeAddr("bob");
        vm.deal(alice, 0);
        vm.deal(bob, 0);

        _callOnEvent(alice);
        assertEq(handler.totalClaimers(), 1);

        _callOnEvent(bob);
        assertEq(handler.totalClaimers(), 2);

        // Alice claims again after cooldown — totalClaimers stays 2
        vm.warp(block.timestamp + 24 hours);
        _callOnEvent(alice);
        assertEq(handler.totalClaimers(), 2);
    }

    function test_OwnerWithdraw() public {
        uint256 handlerBalance = address(handler).balance;
        uint256 ownerBefore = address(this).balance;

        handler.withdraw();

        assertEq(address(handler).balance, 0);
        assertEq(address(this).balance, ownerBefore + handlerBalance);
    }

    function test_NonOwnerWithdrawReverts() public {
        vm.prank(requester);
        vm.expectRevert("Not owner");
        handler.withdraw();
    }

    function test_ReceiveAcceptsFunds() public {
        uint256 before = address(handler).balance;
        (bool sent,) = address(handler).call{value: 1 ether}("");
        assertTrue(sent);
        assertEq(address(handler).balance, before + 1 ether);
    }

    function test_OnlyPrecompileCanCallOnEvent() public {
        vm.prank(requester);
        vm.expectRevert();
        handler.onEvent(address(0), _buildTopics(requester), "");
    }

    function test_OwnerCanSetParams() public {
        handler.setCooldown(1 hours);
        handler.setDripAmount(1 ether);
        handler.setMaxBalance(5 ether);

        assertEq(handler.cooldown(), 1 hours);
        assertEq(handler.dripAmount(), 1 ether);
        assertEq(handler.maxBalance(), 5 ether);
    }

    function test_NonOwnerCannotSetParams() public {
        vm.startPrank(requester);
        vm.expectRevert("Not owner");
        handler.setCooldown(1 hours);
        vm.expectRevert("Not owner");
        handler.setDripAmount(1 ether);
        vm.expectRevert("Not owner");
        handler.setMaxBalance(5 ether);
        vm.stopPrank();
    }

    receive() external payable {}
}
