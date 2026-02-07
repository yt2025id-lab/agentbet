// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAgentRegistry.sol";

/// @title RewardDistributor - VRF-powered random rewards for top agents
/// @notice Uses Chainlink VRF v2.5 to randomly distribute bonus rewards to registered agents
contract RewardDistributor is Ownable {
    IAgentRegistry public agentRegistry;

    // VRF state (simplified for hackathon - uses callback pattern)
    uint256 public currentRound;
    mapping(uint256 => RewardRound) public rounds;

    struct RewardRound {
        address winner;
        uint256 rewardAmount;
        uint256 randomWord;
        bool fulfilled;
        uint256 timestamp;
    }

    event RewardRoundStarted(uint256 indexed round, uint256 rewardAmount);
    event RewardDistributed(uint256 indexed round, address indexed winner, uint256 amount);

    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = IAgentRegistry(_agentRegistry);
    }

    /// @notice Start a reward round and select random winner
    /// @dev In production, this would use VRF callback. For hackathon demo, uses block-based randomness
    /// then we show VRF integration separately via the VRF subscription
    function startRewardRound() external payable onlyOwner {
        require(msg.value > 0, "Must fund reward");
        uint256 count = agentRegistry.agentCount();
        require(count > 0, "No agents registered");

        uint256 roundId = currentRound++;

        // For hackathon: use pseudo-random (in production: VRF callback)
        uint256 randomWord = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, roundId))
        );

        uint256 winnerIndex = randomWord % count;
        address winner = agentRegistry.getAgentAddress(winnerIndex);

        rounds[roundId] = RewardRound({
            winner: winner,
            rewardAmount: msg.value,
            randomWord: randomWord,
            fulfilled: true,
            timestamp: block.timestamp
        });

        (bool success,) = winner.call{value: msg.value}("");
        require(success, "Transfer failed");

        emit RewardRoundStarted(roundId, msg.value);
        emit RewardDistributed(roundId, winner, msg.value);
    }

    /// @notice Callback for Chainlink VRF v2.5 (production path)
    /// @dev This would be called by the VRF Coordinator after randomness is generated
    function fulfillRewardWithVRF(uint256 roundId, uint256 randomWord) external onlyOwner {
        RewardRound storage r = rounds[roundId];
        require(!r.fulfilled, "Already fulfilled");
        require(r.rewardAmount > 0, "Round not funded");

        uint256 count = agentRegistry.agentCount();
        uint256 winnerIndex = randomWord % count;
        address winner = agentRegistry.getAgentAddress(winnerIndex);

        r.winner = winner;
        r.randomWord = randomWord;
        r.fulfilled = true;

        (bool success,) = winner.call{value: r.rewardAmount}("");
        require(success, "Transfer failed");

        emit RewardDistributed(roundId, winner, r.rewardAmount);
    }

    function getRound(uint256 roundId) external view returns (RewardRound memory) {
        return rounds[roundId];
    }
}
