// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {TokenFaucetRequest} from "../src/TokenFaucetRequest.sol";
import {TokenFaucetHandler} from "../src/TokenFaucetHandler.sol";

contract DeployTokenFaucetScript is Script {
    function run() public {
        address somusdAddress = vm.envAddress("SOMUSD_ADDRESS");

        vm.startBroadcast();

        TokenFaucetRequest tokenFaucetRequest = new TokenFaucetRequest();
        console.log("TokenFaucetRequest deployed at:", address(tokenFaucetRequest));

        TokenFaucetHandler tokenFaucetHandler = new TokenFaucetHandler(somusdAddress);
        console.log("TokenFaucetHandler deployed at:", address(tokenFaucetHandler));

        vm.stopBroadcast();
    }
}
