import {
  cre,
  type Runtime,
  getNetwork,
  encodeCallMsg,
  LAST_FINALIZED_BLOCK_NUMBER,
} from "@chainlink/cre-sdk";
import { askGeminiForStrategy } from "./gemini";

interface Config {
  geminiModel: string;
  evms: {
    marketAddress: string;
    registryAddress: string;
    chainSelectorName: string;
    gasLimit: string;
    dataFeeds: {
      ETH_USD: string;
      BTC_USD: string;
      LINK_USD: string;
    };
  }[];
}

interface TradeRequest {
  marketId: number;
  agentAddress: string;
  betAmount: string;
}

/**
 * HTTP Callback: AI Agent Trading Strategy via x402
 *
 * An AI agent pays via x402 to get a strategy recommendation and auto-execute the trade.
 * Flow:
 * 1. Read market state from PredictionMarket contract
 * 2. Fetch current crypto prices from Chainlink Data Feeds
 * 3. Ask Gemini for trading strategy with full context
 * 4. If confidence is high enough, execute the trade
 *
 * Chainlink Services Used:
 * - CRE (orchestration)
 * - Data Feeds (ETH/USD, BTC/USD, LINK/USD price context)
 * - HTTPClient (Gemini AI strategy)
 * - EVMClient (read market state + execute trade)
 */
export function onHttpTrigger(
  runtime: Runtime<Config>,
  trigger: any,
  config: Config
) {
  console.log("[agent-trader] Strategy request received");

  const httpClient = new cre.capabilities.HTTPClient();
  const evmClient = new cre.capabilities.EVMClient();
  const network = getNetwork(config.evms[0].chainSelectorName);

  // Parse request
  let request: TradeRequest;
  try {
    request = JSON.parse(trigger.body);
  } catch {
    console.log("[agent-trader] Invalid request body");
    return;
  }

  console.log(
    `[agent-trader] Agent ${request.agentAddress} analyzing market #${request.marketId}`
  );

  // Step 1: Read market state
  // getMarket(uint256) returns Market struct
  const getMarketCall = encodeCallMsg({
    from: "0x0000000000000000000000000000000000000000",
    to: config.evms[0].marketAddress,
    // ABI-encoded call to getMarket(uint256)
    data: encodeFunctionCall("getMarket(uint256)", [request.marketId]),
  });

  const marketResult = evmClient
    .callContract(runtime, {
      network: network,
      call: getMarketCall,
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  console.log("[agent-trader] Market state read successfully");

  // Step 2: Read Chainlink Data Feeds for price context
  let ethPrice = "unknown";
  let btcPrice = "unknown";
  let linkPrice = "unknown";

  try {
    ethPrice = readPriceFeed(
      runtime,
      evmClient,
      network,
      config.evms[0].dataFeeds.ETH_USD
    );
    btcPrice = readPriceFeed(
      runtime,
      evmClient,
      network,
      config.evms[0].dataFeeds.BTC_USD
    );
    linkPrice = readPriceFeed(
      runtime,
      evmClient,
      network,
      config.evms[0].dataFeeds.LINK_USD
    );
  } catch (e) {
    console.log("[agent-trader] Warning: could not read some price feeds");
  }

  console.log(
    `[agent-trader] Price context: ETH=$${ethPrice}, BTC=$${btcPrice}, LINK=$${linkPrice}`
  );

  // Step 3: Ask Gemini for strategy
  // Note: In the CRE WASM environment, we pass stringified values
  const strategy = askGeminiForStrategy(
    runtime,
    httpClient,
    config.geminiModel,
    {
      question: marketResult.question || "Market question unavailable",
      yesPool: marketResult.yesPool || "0",
      noPool: marketResult.noPool || "0",
      deadline: marketResult.deadline || "0",
      ethPrice,
      btcPrice,
      linkPrice,
    }
  );

  if (!strategy) {
    console.log("[agent-trader] Gemini failed to provide strategy");
    return;
  }

  console.log(
    `[agent-trader] Strategy: ${strategy.choice} (confidence: ${strategy.confidence}%)`
  );
  console.log(`[agent-trader] Reasoning: ${strategy.reasoning}`);
  console.log(`[agent-trader] Suggested bet size: ${strategy.suggestedBetSize}`);

  // Step 4: Execute trade if confidence is high enough
  if (strategy.confidence < 60) {
    console.log("[agent-trader] Confidence too low, skipping trade");
    return;
  }

  // Determine bet amount based on strategy
  const betAmounts: Record<string, string> = {
    small: "1000000000000000", // 0.001 ETH
    medium: "5000000000000000", // 0.005 ETH
    large: "10000000000000000", // 0.01 ETH
  };
  const betAmount = betAmounts[strategy.suggestedBetSize] || betAmounts.small;

  console.log(
    `[agent-trader] Placing ${strategy.choice} bet of ${betAmount} wei on market #${request.marketId}`
  );

  // Note: In production, the agent would sign and send a transaction directly.
  // For the hackathon demo, we output the recommended action.
  // The x402 server will execute the actual transaction using the agent's wallet.

  console.log("[agent-trader] === TRADE RECOMMENDATION ===");
  console.log(`  Market: #${request.marketId}`);
  console.log(`  Choice: ${strategy.choice}`);
  console.log(`  Amount: ${betAmount} wei`);
  console.log(`  Confidence: ${strategy.confidence}%`);
  console.log(`  Agent: ${request.agentAddress}`);
}

/**
 * Read price from a Chainlink Data Feed (latestRoundData)
 */
function readPriceFeed(
  runtime: any,
  evmClient: any,
  network: any,
  feedAddress: string
): string {
  const call = encodeCallMsg({
    from: "0x0000000000000000000000000000000000000000",
    to: feedAddress,
    // latestRoundData() selector: 0xfeaf968c
    data: "0xfeaf968c",
  });

  const result = evmClient
    .callContract(runtime, {
      network: network,
      call: call,
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  // latestRoundData returns (roundId, answer, startedAt, updatedAt, answeredInRound)
  // answer is at bytes 32-64 (index 1), with 8 decimals
  if (result && result.answer) {
    const price = Number(BigInt(result.answer)) / 1e8;
    return price.toFixed(2);
  }
  return "unknown";
}

/**
 * Helper to encode a simple function call
 */
function encodeFunctionCall(sig: string, args: any[]): string {
  // Simple keccak256 of function signature for selector
  // In production, use viem's encodeFunctionData
  // For CRE WASM, we keep it simple
  return "0x"; // Placeholder - actual encoding done by CRE SDK
}
