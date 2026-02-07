import { cre, type Runtime, getNetwork } from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { validateMarketQuestion } from "./gemini";

interface Config {
  geminiModel: string;
  schedule: string;
  evms: {
    marketAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }[];
}

interface CreateMarketRequest {
  question: string;
  duration?: number;
  agentAddress?: string;
}

/**
 * HTTP Callback: Agent/User-initiated Market Creation via x402
 *
 * An AI agent (or human) pays via x402 and submits a market question.
 * The workflow:
 * 1. Validates the question via Gemini AI
 * 2. Creates the market on-chain via CRE Forwarder
 */
export function onHttpTrigger(
  runtime: Runtime<Config>,
  trigger: any,
  config: Config
) {
  console.log("[market-creator] HTTP trigger - market creation request received");

  const httpClient = new cre.capabilities.HTTPClient();
  const evmClient = new cre.capabilities.EVMClient();
  const network = getNetwork(config.evms[0].chainSelectorName);

  // Parse the request body
  let request: CreateMarketRequest;
  try {
    request = JSON.parse(trigger.body);
  } catch {
    console.log("[market-creator] Invalid request body");
    return;
  }

  if (!request.question) {
    console.log("[market-creator] Missing question field");
    return;
  }

  console.log(`[market-creator] Validating question: "${request.question}"`);

  // Step 1: Validate the question via Gemini
  const validation = validateMarketQuestion(
    runtime,
    httpClient,
    config.geminiModel,
    request.question
  );

  if (!validation.valid) {
    console.log(`[market-creator] Question rejected: ${validation.reason}`);
    return;
  }

  console.log("[market-creator] Question validated, creating market...");

  // Step 2: Encode market creation data
  const duration = request.duration || 86400; // default 24h
  const agentAddress =
    request.agentAddress || "0x0000000000000000000000000000000000000000";
  const isAgentCreated = agentAddress !== "0x0000000000000000000000000000000000000000";

  const encodedData = encodeAbiParameters(
    parseAbiParameters("string, uint256, uint256, bool, address"),
    [
      request.question,
      BigInt(duration),
      BigInt(43200), // 12h settlement buffer
      isAgentCreated,
      agentAddress as `0x${string}`,
    ]
  );

  const reportData = ("0x00" + encodedData.slice(2)) as `0x${string}`;

  // Step 3: Sign and write report
  const signedReport = cre.report
    .sign(runtime, {
      data: reportData,
      signingAlgorithm: "ecdsa_secp256k1_keccak256",
    })
    .result();

  const txResult = evmClient
    .writeReport(runtime, {
      network: network,
      contractAddress: config.evms[0].marketAddress,
      gasLimit: config.evms[0].gasLimit,
      report: signedReport,
    })
    .result();

  console.log(`[market-creator] Market created! TX: ${txResult.transactionHash}`);
}
