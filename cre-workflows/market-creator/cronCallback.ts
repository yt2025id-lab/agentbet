import { cre, type Runtime, type CronPayload, getNetwork } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { askGeminiForMarketIdea } from "./gemini";

interface Config {
  geminiModel: string;
  schedule: string;
  evms: {
    marketAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }[];
}

/**
 * Cron Callback: Autonomous Market Creation
 *
 * This is the "wow factor" of AgentBet. Every 6 hours, the AI:
 * 1. Searches the web for trending events via Gemini search grounding
 * 2. Generates a compelling prediction market question
 * 3. Creates the market on-chain via CRE Forwarder
 *
 * No human intervention required - fully autonomous market creation.
 */
export function onCronTrigger(
  runtime: Runtime<Config>,
  trigger: CronPayload,
  config: Config
) {
  console.log("[market-creator] Cron triggered - searching for market ideas...");

  const httpClient = new cre.capabilities.HTTPClient();
  const evmClient = new cre.capabilities.EVMClient();
  const network = getNetwork(config.evms[0].chainSelectorName);

  // Step 1: Ask Gemini for a trending event to create a market about
  const idea = askGeminiForMarketIdea(
    runtime,
    httpClient,
    config.geminiModel
  );

  if (!idea) {
    console.log("[market-creator] No suitable market idea found, skipping");
    return;
  }

  console.log(`[market-creator] Creating market: "${idea.question}"`);
  console.log(`[market-creator] Category: ${idea.category}, Duration: ${idea.duration}s`);

  // Step 2: Encode market creation data
  // Action 0x00 = create market
  // Data: (string question, uint256 duration, uint256 settlementBuffer, bool isAgentCreated, address agentAddress)
  const encodedData = encodeAbiParameters(
    parseAbiParameters("string, uint256, uint256, bool, address"),
    [
      idea.question,
      BigInt(idea.duration),
      BigInt(43200), // 12h settlement buffer
      true, // isAgentCreated
      "0x0000000000000000000000000000000000000000", // system agent (autonomous)
    ]
  );

  // Prepend action byte 0x00
  const reportData = ("0x00" + encodedData.slice(2)) as `0x${string}`;

  // Step 3: Sign the report
  const signedReport = cre.report
    .sign(runtime, {
      data: reportData,
      signingAlgorithm: "ecdsa_secp256k1_keccak256",
    })
    .result();

  console.log("[market-creator] Report signed, creating market on-chain...");

  // Step 4: Write to chain
  const txResult = evmClient
    .writeReport(runtime, {
      network: network,
      contractAddress: config.evms[0].marketAddress,
      gasLimit: config.evms[0].gasLimit,
      report: signedReport,
    })
    .result();

  console.log(`[market-creator] Market created! TX: ${txResult.transactionHash}`);
  console.log(`[market-creator] Question: "${idea.question}"`);
}
