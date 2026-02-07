import { cre, Runner, getNetwork } from "@chainlink/cre-sdk";
import { onCronTrigger } from "./cronCallback";
import { onHttpTrigger } from "./httpCallback";

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
 * Market Creator CRE Workflow
 *
 * Two triggers:
 * 1. Cron (every 6h): AI autonomously scans for trending events and creates markets
 * 2. HTTP (x402-gated): Agents/users pay to submit custom market questions
 *
 * Chainlink Services Used:
 * - CRE (core orchestration)
 * - HTTPClient (Gemini API for question generation/validation)
 * - EVMClient (write market creation report on-chain)
 * - Cron Trigger (autonomous scheduled creation)
 * - HTTP Trigger (on-demand creation via x402)
 */
const initWorkflow = (config: Config) => {
  const cronTrigger = new cre.capabilities.CronCapability();
  const httpTrigger = new cre.capabilities.HTTPTrigger();

  return [
    // Autonomous market creation every 6 hours
    cre.handler(
      cronTrigger.trigger({ schedule: config.schedule }),
      (runtime, trigger) => onCronTrigger(runtime, trigger, config)
    ),
    // On-demand market creation via HTTP (x402-gated)
    cre.handler(
      httpTrigger.trigger({ method: "POST", path: "/create-market" }),
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
