// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {TokenFaucetHandler} from "../src/TokenFaucetHandler.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("SOM USD", "SOMUSD") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TokenFaucetHandlerTest is Test {
    TokenFaucetHandler public handler;
    MockERC20 public token;

    address constant PRECOMPILE = address(0x0100);
    address requester = makeAddr("requester");

    event TokenFaucetGranted(address indexed requester, uint256 amount);
    event TokenFaucetDenied(address indexed requester, string reason);

    function setUp() public {
        token = new MockERC20();
        handler = new TokenFaucetHandler(address(token));
        // Fund handler with 100,000 SOMUSD
        token.mint(address(handler), 100_000 * 1e6);
    }

    function _buildTopics(address addr) internal pure returns (bytes32[] memory) {
        bytes32[] memory topics = new bytes32[](2);
        topics[0] = keccak256("TokenFaucetRequested(address)");
        topics[1] = bytes32(uint256(uint160(addr)));
        return topics;
    }

    function _callOnEvent(address addr) internal {
        vm.prank(PRECOMPILE);
        handler.onEvent(address(0), _buildTopics(addr), "");
    }

    function test_GrantEligibleRequester() public {
        vm.expectEmit(true, false, false, true);
        emit TokenFaucetGranted(requester, 1000 * 1e6);

        _callOnEvent(requester);

        assertEq(token.balanceOf(requester), 1000 * 1e6);
        assertEq(handler.lastGrant(requester), block.timestamp);
        assertEq(handler.totalGranted(), 1000 * 1e6);
        assertEq(handler.totalClaimers(), 1);
    }

    function test_DenyCooldown() public {
        _callOnEvent(requester);

        vm.expectEmit(true, false, false, true);
        emit TokenFaucetDenied(requester, "cooldown");

        _callOnEvent(requester);

        assertEq(token.balanceOf(requester), 1000 * 1e6);
        assertEq(handler.totalGranted(), 1000 * 1e6);
    }

    function test_GrantAfterCooldown() public {
        _callOnEvent(requester);

        vm.warp(block.timestamp + 24 hours);

        _callOnEvent(requester);

        assertEq(token.balanceOf(requester), 2000 * 1e6);
        assertEq(handler.totalGranted(), 2000 * 1e6);
        // totalClaimers should still be 1 (same address)
        assertEq(handler.totalClaimers(), 1);
    }

    function test_DenyBalanceTooHigh() public {
        // Give requester tokens at the maxBalance threshold
        token.mint(requester, handler.maxBalance());

        vm.expectEmit(true, false, false, true);
        emit TokenFaucetDenied(requester, "balance_too_high");

        _callOnEvent(requester);

        assertEq(handler.totalGranted(), 0);
    }

    function test_DenyFaucetEmpty() public {
        // Deploy a new handler with no token balance
        TokenFaucetHandler emptyHandler = new TokenFaucetHandler(address(token));

        vm.expectEmit(true, false, false, true);
        emit TokenFaucetDenied(requester, "faucet_empty");

        bytes32[] memory topics = _buildTopics(requester);
        vm.prank(PRECOMPILE);
        emptyHandler.onEvent(address(0), topics, "");
    }

    function test_UniqueClaimerCounting() public {
        address alice = makeAddr("alice");
        address bob = makeAddr("bob");

        _callOnEvent(alice);
        assertEq(handler.totalClaimers(), 1);

        _callOnEvent(bob);
        assertEq(handler.totalClaimers(), 2);

        // Alice claims again after cooldown — totalClaimers stays 2
        vm.warp(block.timestamp + 24 hours);
        _callOnEvent(alice);
        assertEq(handler.totalClaimers(), 2);
    }

    function test_OwnerCanSetCooldown() public {
        handler.setCooldown(1 hours);
        assertEq(handler.cooldown(), 1 hours);
    }

    function test_OwnerCanSetDripAmount() public {
        handler.setDripAmount(500 * 1e6);
        assertEq(handler.dripAmount(), 500 * 1e6);
    }

    function test_OwnerCanSetMaxBalance() public {
        handler.setMaxBalance(5000 * 1e6);
        assertEq(handler.maxBalance(), 5000 * 1e6);
    }

    function test_OwnerCanSetToken() public {
        MockERC20 newToken = new MockERC20();
        handler.setToken(address(newToken));
        assertEq(address(handler.token()), address(newToken));
    }

    function test_NonOwnerCannotSetParams() public {
        vm.startPrank(requester);
        vm.expectRevert("Not owner");
        handler.setCooldown(1 hours);
        vm.expectRevert("Not owner");
        handler.setDripAmount(500 * 1e6);
        vm.expectRevert("Not owner");
        handler.setMaxBalance(500 * 1e6);
        vm.expectRevert("Not owner");
        handler.setToken(address(0));
        vm.stopPrank();
    }

    function test_OwnerWithdraw() public {
        uint256 handlerBal = token.balanceOf(address(handler));
        uint256 ownerBefore = token.balanceOf(address(this));

        handler.withdraw();

        assertEq(token.balanceOf(address(handler)), 0);
        assertEq(token.balanceOf(address(this)), ownerBefore + handlerBal);
    }

    function test_NonOwnerWithdrawReverts() public {
        vm.prank(requester);
        vm.expectRevert("Not owner");
        handler.withdraw();
    }

    function test_OnlyPrecompileCanCallOnEvent() public {
        vm.prank(requester);
        vm.expectRevert();
        handler.onEvent(address(0), _buildTopics(requester), "");
    }
}
