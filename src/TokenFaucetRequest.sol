// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract TokenFaucetRequest {
    event TokenFaucetRequested(address indexed requester);

    function request() external {
        emit TokenFaucetRequested(msg.sender);
    }
}
