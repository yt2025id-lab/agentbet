import { cre, Runner } from "@chainlink/cre-sdk";
import { onHttpTrigger } from "./httpCallback";

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

/**
 * Agent Trader CRE Workflow
 *
 * HTTP-triggered workflow that AI agents invoke (via x402 payment) to:
 * 1. Read market state on-chain
 * 2. Fetch real-time prices from Chainlink Data Feeds
 * 3. Generate AI-powered trading strategy via Gemini
 * 4. Execute the trade
 *
 * Chainlink Services Used:
 * - CRE (core orchestration)
 * - Data Feeds (ETH/USD, BTC/USD, LINK/USD for price context)
 * - HTTPClient (Gemini AI for strategy)
 * - EVMClient (read market state, read Data Feeds)
 * - HTTP Trigger (x402-gated agent requests)
 */
const initWorkflow = (config: Config) => {
  const httpTrigger = new cre.capabilities.HTTPTrigger();

  return [
    cre.handler(
      httpTrigger.trigger({ method: "POST", path: "/agent-trade" }),
      (runtime, trigger) => onHttpTrigger(runtime, trigger, config)
    ),
  ];
};

async function main() {
  const runner = new Runner<Config>();
  await runner.run(initWorkflow);
}

export { initWorkflow, main };
main();
