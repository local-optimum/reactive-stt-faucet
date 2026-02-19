// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract FaucetRequest {
    event FaucetRequested(address indexed requester);

    function request() external {
        emit FaucetRequested(msg.sender);
    }
}
