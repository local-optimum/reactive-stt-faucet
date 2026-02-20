// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FaucetHandler is SomniaEventHandler, ReentrancyGuard {
    event FaucetGranted(address indexed requester, uint256 amount);
    event FaucetDenied(address indexed requester, string reason);

    mapping(address => uint256) public lastGrant;

    uint256 public totalGranted;
    uint256 public totalClaimers;

    uint256 public cooldown = 24 hours;
    uint256 public dripAmount = 0.5 ether;
    uint256 public maxBalance = 1 ether;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setCooldown(uint256 _cooldown) external onlyOwner {
        cooldown = _cooldown;
    }

    function setDripAmount(uint256 _dripAmount) external onlyOwner {
        dripAmount = _dripAmount;
    }

    function setMaxBalance(uint256 _maxBalance) external onlyOwner {
        maxBalance = _maxBalance;
    }

    function _onEvent(address, bytes32[] calldata eventTopics, bytes calldata) internal override nonReentrant {
        address requester = address(uint160(uint256(eventTopics[1])));

        (bool eligible, string memory reason) = _isEligible(requester);
        if (!eligible) {
            emit FaucetDenied(requester, reason);
            return;
        }

        if (lastGrant[requester] == 0) {
            totalClaimers++;
        }
        lastGrant[requester] = block.timestamp;
        totalGranted += dripAmount;

        (bool sent,) = payable(requester).call{value: dripAmount}("");
        require(sent, "Transfer failed");

        emit FaucetGranted(requester, dripAmount);
    }

    function _isEligible(address requester) internal view returns (bool, string memory) {
        uint256 last = lastGrant[requester];
        if (last != 0 && block.timestamp - last < cooldown) {
            return (false, "cooldown");
        }
        if (requester.balance >= maxBalance) {
            return (false, "balance_too_high");
        }
        if (address(this).balance < dripAmount) {
            return (false, "faucet_empty");
        }
        return (true, "");
    }

    function withdraw() external onlyOwner {
        (bool sent,) = payable(owner).call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }

    receive() external payable {}
}
