import { type Address } from "viem";
import { baseSepolia } from "viem/chains";

// Contract addresses - update after deployment
export const CONTRACTS = {
  predictionMarket: (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS ||
    "0xB635CBEb6C1aB83adF72ff6bEc5f8423c7E2ced4") as Address,
  agentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS ||
    "0x9e820a4a2451B88aD10c4a43E77748d0465CbAac") as Address,
  agentIdentity: (process.env.NEXT_PUBLIC_AGENT_IDENTITY_ADDRESS ||
    "0xA8bc3d9842FBAB05372FF262dFcd04628C64c7D3") as Address,
  agentReputation: (process.env.NEXT_PUBLIC_AGENT_REPUTATION_ADDRESS ||
    "0xe8bB69D476Bcf66e8d039C24E447e2Cc6Dc38Cb4") as Address,
  rewardDistributor: (process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS ||
    "0x2fBeE7C3960486004b7c53A248B0A43bA064F12c") as Address,
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

// ERC-8004 Identity Registry ABI (AgentIdentity.sol)
export const AGENT_IDENTITY_ABI = [
  {
    name: "register",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "agentURI", type: "string" },
      {
        name: "metadata",
        type: "tuple[]",
        components: [
          { name: "key", type: "string" },
          { name: "value", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    name: "setAgentURI",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "newURI", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "getAgentWallet",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "getMetadata",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "key", type: "string" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
  {
    name: "setMetadata",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "key", type: "string" },
      { name: "value", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "isRegisteredAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getAgentIdByWallet",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalAgents",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getStake",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "addStake",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// ERC-8004 Reputation Registry ABI (AgentReputation.sol)
export const AGENT_REPUTATION_ABI = [
  {
    name: "giveFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "input",
        type: "tuple",
        components: [
          { name: "agentId", type: "uint256" },
          { name: "value", type: "int128" },
          { name: "valueDecimals", type: "uint8" },
          { name: "tag1", type: "string" },
          { name: "tag2", type: "string" },
          { name: "endpoint", type: "string" },
          { name: "feedbackHash", type: "bytes32" },
        ],
      },
    ],
    outputs: [{ name: "feedbackIndex", type: "uint64" }],
  },
  {
    name: "getSummary",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
    ],
    outputs: [
      { name: "count", type: "uint64" },
      { name: "summaryValue", type: "int128" },
      { name: "summaryValueDecimals", type: "uint8" },
    ],
  },
  {
    name: "readAllFeedback",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "includeRevoked", type: "bool" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "client", type: "address" },
          { name: "value", type: "int128" },
          { name: "valueDecimals", type: "uint8" },
          { name: "tag1", type: "string" },
          { name: "tag2", type: "string" },
          { name: "endpoint", type: "string" },
          { name: "feedbackHash", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
          { name: "revoked", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getClients",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
  },
] as const;

const AGENT_TUPLE = {
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
} as const;

export const AGENT_REGISTRY_ABI = [
  {
    name: "getAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [AGENT_TUPLE],
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
  {
    name: "getAgentAddress",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "getLeaderboard",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      { name: "addrs", type: "address[]" },
      { name: "data", type: "tuple[]", components: AGENT_TUPLE.components },
    ],
  },
] as const;
