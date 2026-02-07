import { cre, type Runtime, getNetwork } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters, decodeAbiParameters } from "viem";
import { askGeminiForSettlement } from "./gemini";

interface Config {
  geminiModel: string;
  evms: {
    marketAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }[];
}

/**
 * EVM Log callback: triggered when SettlementRequested event is emitted.
 * 1. Decodes the event to get marketId and question
 * 2. Calls Gemini AI to determine the factual outcome
 * 3. Encodes and signs a settlement report
 * 4. Writes the report on-chain via CRE Forwarder -> PredictionMarket.onReport()
 */
export function onLogTrigger(
  runtime: Runtime<Config>,
  trigger: any,
  config: Config
) {
  console.log("[market-settler] SettlementRequested event detected!");

  const httpClient = new cre.capabilities.HTTPClient();
  const evmClient = new cre.capabilities.EVMClient();
  const network = getNetwork(config.evms[0].chainSelectorName);

  // Decode the event data
  // SettlementRequested(uint256 indexed marketId, string question)
  // Topic[1] = marketId (indexed), data = question (non-indexed string)
  const marketId = BigInt(trigger.topics[1]);
  const questionData = decodeAbiParameters(
    parseAbiParameters("string"),
    trigger.data
  );
  const question = questionData[0];

  console.log(`[market-settler] Market #${marketId}: "${question}"`);

  // Step 1: Ask Gemini to determine the outcome
  const result = askGeminiForSettlement(
    runtime,
    httpClient,
    config.geminiModel,
    question
  );

  if (!result) {
    console.log("[market-settler] Gemini failed to provide a valid response");
    return;
  }

  console.log(
    `[market-settler] Gemini result: ${result.outcome} (confidence: ${result.confidence}%)`
  );
  console.log(`[market-settler] Reasoning: ${result.reasoning}`);

  // Step 2: Check confidence threshold (50% minimum on-chain)
  if (result.confidence < 50) {
    console.log(
      "[market-settler] Confidence too low, skipping settlement"
    );
    return;
  }

  // Step 3: Encode the settlement report
  // Action 0x01 = settle market
  // Data: (uint256 marketId, uint8 outcome, uint16 confidence)
  const outcomeValue = result.outcome === "YES" ? 0 : 1;
  const confidenceScaled = Math.round(result.confidence * 100); // 0-10000 scale

  const encodedData = encodeAbiParameters(
    parseAbiParameters("uint256, uint8, uint16"),
    [marketId, outcomeValue, confidenceScaled]
  );

  // Prepend action byte 0x01
  const reportData = ("0x01" + encodedData.slice(2)) as `0x${string}`;

  // Step 4: Sign the report
  const signedReport = cre.report
    .sign(runtime, {
      data: reportData,
      signingAlgorithm: "ecdsa_secp256k1_keccak256",
    })
    .result();

  console.log("[market-settler] Report signed, writing to chain...");

  // Step 5: Write report on-chain
  const txResult = evmClient
    .writeReport(runtime, {
      network: network,
      contractAddress: config.evms[0].marketAddress,
      gasLimit: config.evms[0].gasLimit,
      report: signedReport,
    })
    .result();

  console.log(
    `[market-settler] Settlement TX: ${txResult.transactionHash}`
  );
  console.log(
    `[market-settler] Market #${marketId} settled as ${result.outcome} with ${result.confidence}% confidence`
  );
}
