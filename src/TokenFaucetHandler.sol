// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenFaucetHandler is SomniaEventHandler, ReentrancyGuard {
    event TokenFaucetGranted(address indexed requester, uint256 amount);
    event TokenFaucetDenied(address indexed requester, string reason);

    IERC20 public token;

    mapping(address => uint256) public lastGrant;

    uint256 public totalGranted;
    uint256 public totalClaimers;

    uint256 public cooldown = 24 hours;
    uint256 public dripAmount = 1000 * 1e6; // 1000 SOMUSD (6 decimals)

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _token) {
        owner = msg.sender;
        token = IERC20(_token);
    }

    function setCooldown(uint256 _cooldown) external onlyOwner {
        cooldown = _cooldown;
    }

    function setDripAmount(uint256 _dripAmount) external onlyOwner {
        dripAmount = _dripAmount;
    }

    function setToken(address _token) external onlyOwner {
        token = IERC20(_token);
    }

    function _onEvent(address, bytes32[] calldata eventTopics, bytes calldata) internal override nonReentrant {
        address requester = address(uint160(uint256(eventTopics[1])));

        (bool eligible, string memory reason) = _isEligible(requester);
        if (!eligible) {
            emit TokenFaucetDenied(requester, reason);
            return;
        }

        if (lastGrant[requester] == 0) {
            totalClaimers++;
        }
        lastGrant[requester] = block.timestamp;
        totalGranted += dripAmount;

        bool sent = token.transfer(requester, dripAmount);
        require(sent, "Transfer failed");

        emit TokenFaucetGranted(requester, dripAmount);
    }

    function _isEligible(address requester) internal view returns (bool, string memory) {
        uint256 last = lastGrant[requester];
        if (last != 0 && block.timestamp - last < cooldown) {
            return (false, "cooldown");
        }
        if (token.balanceOf(address(this)) < dripAmount) {
            return (false, "faucet_empty");
        }
        return (true, "");
    }

    function withdraw() external onlyOwner {
        uint256 bal = token.balanceOf(address(this));
        if (bal > 0) {
            token.transfer(owner, bal);
        }
    }
}
