// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {FaucetRequest} from "../src/FaucetRequest.sol";
import {FaucetHandler} from "../src/FaucetHandler.sol";

contract DeployScript is Script {
    function run() public {
        vm.startBroadcast();

        FaucetRequest faucetRequest = new FaucetRequest();
        console.log("FaucetRequest deployed at:", address(faucetRequest));

        FaucetHandler faucetHandler = new FaucetHandler();
        console.log("FaucetHandler deployed at:", address(faucetHandler));

        vm.stopBroadcast();
    }
}
