// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PredictionMarket.sol";

/// @title AutoSettler - Chainlink Automation compatible contract
/// @notice Automatically calls requestSettlement on expired markets
contract AutoSettler {
    PredictionMarket public immutable market;

    constructor(address _market) {
        market = PredictionMarket(_market);
    }

    /// @notice Chainlink Automation: check if any market needs settlement
    function checkUpkeep(bytes calldata)
        external
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 total = market.nextMarketId();
        for (uint256 i = 0; i < total; i++) {
            PredictionMarket.Market memory m = market.getMarket(i);
            if (
                m.status == PredictionMarket.MarketStatus.OPEN &&
                block.timestamp >= m.deadline
            ) {
                return (true, abi.encode(i));
            }
        }
        return (false, "");
    }

    /// @notice Chainlink Automation: execute settlement request
    function performUpkeep(bytes calldata performData) external {
        uint256 marketId = abi.decode(performData, (uint256));
        PredictionMarket.Market memory m = market.getMarket(marketId);
        require(
            m.status == PredictionMarket.MarketStatus.OPEN &&
            block.timestamp >= m.deadline,
            "Not ready"
        );
        market.requestSettlement(marketId);
    }
}
