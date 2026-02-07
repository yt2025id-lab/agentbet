import { type Address } from "viem";
import { baseSepolia } from "viem/chains";

// Contract addresses - update after deployment
export const CONTRACTS = {
  predictionMarket: (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as Address,
  agentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as Address,
  rewardDistributor: (process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as Address,
};

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const CHAIN = baseSepolia;

// Enums matching Solidity
export const MarketStatus = {
  0: "OPEN",
  1: "SETTLEMENT_REQUESTED",
  2: "SETTLED",
  3: "CANCELLED",
} as const;

export const OutcomeLabel = {
  0: "YES",
  1: "NO",
} as const;

// ABIs
export const PREDICTION_MARKET_ABI = [
  {
    name: "getMarket",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "question", type: "string" },
          { name: "createdAt", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "settlementDeadline", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "outcome", type: "uint8" },
          { name: "confidenceScore", type: "uint16" },
          { name: "yesPool", type: "uint256" },
          { name: "noPool", type: "uint256" },
          { name: "totalBettors", type: "uint256" },
          { name: "isAgentCreated", type: "bool" },
          { name: "creatorAgent", type: "address" },
        ],
      },
    ],
  },
  {
    name: "nextMarketId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "predict",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "choice", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "requestSettlement",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "createMarket",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "question", type: "string" },
      { name: "duration", type: "uint256" },
      { name: "settlementBuffer", type: "uint256" },
      { name: "isAgentCreated", type: "bool" },
      { name: "agentAddress", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getPrediction",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "bettor", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "amount", type: "uint256" },
          { name: "choice", type: "uint8" },
          { name: "claimed", type: "bool" },
          { name: "isAgent", type: "bool" },
          { name: "agentAddress", type: "address" },
        ],
      },
    ],
  },
] as const;

export const AGENT_REGISTRY_ABI = [
  {
    name: "registerAgent",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "name", type: "string" },
      { name: "strategy", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "getAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "name", type: "string" },
          { name: "strategy", type: "string" },
          { name: "stakedAmount", type: "uint256" },
          { name: "totalBets", type: "uint256" },
          { name: "wins", type: "uint256" },
          { name: "losses", type: "uint256" },
          { name: "totalProfit", type: "uint256" },
          { name: "totalLoss", type: "uint256" },
          { name: "marketsCreated", type: "uint256" },
          { name: "registeredAt", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "score", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "agentCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isRegistered",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
