// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/PredictionMarket.sol";
import "../src/RewardDistributor.sol";
import "../src/AutoSettler.sol";

contract Deploy is Script {
    // Base Sepolia CRE Forwarder
    address constant CRE_FORWARDER = 0x82300bd7c3958625581cc2F77bC6464dcEcDF3e5;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy AgentRegistry
        AgentRegistry agentRegistry = new AgentRegistry(CRE_FORWARDER);
        console.log("AgentRegistry deployed at:", address(agentRegistry));

        // 2. Deploy PredictionMarket
        PredictionMarket predictionMarket = new PredictionMarket(
            CRE_FORWARDER,
            address(agentRegistry)
        );
        console.log("PredictionMarket deployed at:", address(predictionMarket));

        // 3. Link AgentRegistry to PredictionMarket
        agentRegistry.setPredictionMarket(address(predictionMarket));
        console.log("AgentRegistry linked to PredictionMarket");

        // 4. Deploy RewardDistributor
        RewardDistributor rewardDistributor = new RewardDistributor(
            address(agentRegistry)
        );
        console.log("RewardDistributor deployed at:", address(rewardDistributor));

        // 5. Deploy AutoSettler
        AutoSettler autoSettler = new AutoSettler(address(predictionMarket));
        console.log("AutoSettler deployed at:", address(autoSettler));

        vm.stopBroadcast();

        // Summary
        console.log("\n=== Deployment Summary ===");
        console.log("AgentRegistry:      ", address(agentRegistry));
        console.log("PredictionMarket:   ", address(predictionMarket));
        console.log("RewardDistributor:  ", address(rewardDistributor));
        console.log("AutoSettler:        ", address(autoSettler));
        console.log("CRE Forwarder:      ", CRE_FORWARDER);
    }
}
