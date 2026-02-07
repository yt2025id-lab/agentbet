import { cre, Runner, getNetwork } from "@chainlink/cre-sdk";
import { keccak256, toHex } from "viem";
import { onLogTrigger } from "./logCallback";

interface Config {
  geminiModel: string;
  evms: {
    marketAddress: string;
    chainSelectorName: string;
    gasLimit: string;
  }[];
}

/**
 * Market Settler CRE Workflow
 *
 * Listens for SettlementRequested events on the PredictionMarket contract.
 * When triggered, asks Gemini AI to determine the real-world outcome,
 * then writes the settlement report on-chain via CRE Forwarder.
 *
 * Chainlink Services Used:
 * - CRE (core orchestration)
 * - HTTPClient (Gemini API call)
 * - EVMClient (write settlement report)
 * - EVM Log Trigger (listen for events)
 */
const initWorkflow = (config: Config) => {
  const logTrigger = new cre.capabilities.EVMLogTrigger();
  const network = getNetwork(config.evms[0].chainSelectorName);

  // SettlementRequested(uint256 indexed marketId, string question)
  const eventSignature = keccak256(
    toHex("SettlementRequested(uint256,string)")
  );

  return [
    cre.handler(
      logTrigger.trigger({
        network: network,
        addresses: [config.evms[0].marketAddress],
        eventSignatures: [eventSignature],
        confidence: "finalized",
      }),
      (runtime, trigger) => onLogTrigger(runtime, trigger, config)
    ),
  ];
};

async function main() {
  const runner = new Runner<Config>();
  await runner.run(initWorkflow);
}

export { initWorkflow, main };
main();
