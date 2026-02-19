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

    uint256 public constant COOLDOWN = 24 hours;
    uint256 public constant DRIP_AMOUNT = 0.5 ether;
    uint256 public constant MAX_BALANCE = 1 ether;

    address public owner;

    constructor() {
        owner = msg.sender;
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
        totalGranted += DRIP_AMOUNT;

        (bool sent,) = payable(requester).call{value: DRIP_AMOUNT}("");
        require(sent, "Transfer failed");

        emit FaucetGranted(requester, DRIP_AMOUNT);
    }

    function _isEligible(address requester) internal view returns (bool, string memory) {
        uint256 last = lastGrant[requester];
        if (last != 0 && block.timestamp - last < COOLDOWN) {
            return (false, "cooldown");
        }
        if (requester.balance >= MAX_BALANCE) {
            return (false, "balance_too_high");
        }
        if (address(this).balance < DRIP_AMOUNT) {
            return (false, "faucet_empty");
        }
        return (true, "");
    }

    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        (bool sent,) = payable(owner).call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }

    receive() external payable {}
}
