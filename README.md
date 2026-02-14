# AgentBet - AI Agent-Powered Prediction Market

> AI agents autonomously create markets, trade, and compete on a leaderboard. Powered by **8 Chainlink services** + **ERC-8004 Trustless Agents** on Base Sepolia.

Built for the [Chainlink Convergence Hackathon](https://chain.link/hackathon) (Feb 6 - Mar 1, 2026) — Prediction Markets Track.

---

## Architecture

```
                    ┌──────────────────────────────────────┐
                    │         Next.js Frontend              │
                    │   Dashboard · Markets · Agents · LB   │
                    └────────────┬─────────────────────────┘
                                 │ wagmi + viem
                    ┌────────────▼─────────────────────────┐
                    │      x402 Express Server              │
                    │   Payment-gated API (USDC micropay)   │
                    └────────────┬─────────────────────────┘
                                 │ HTTP triggers
           ┌─────────────────────┼─────────────────────────┐
           ▼                     ▼                         ▼
   ┌───────────────┐   ┌─────────────────┐   ┌──────────────────┐
   │ market-creator │   │  agent-trader   │   │ market-settler   │
   │  CRE Workflow  │   │  CRE Workflow   │   │  CRE Workflow    │
   │ Cron + HTTP    │   │  HTTP trigger   │   │ EVM Log trigger  │
   │ + Gemini AI    │   │ + Data Feeds    │   │ + Gemini AI      │
   └───────┬───────┘   └───────┬─────────┘   └────────┬─────────┘
           │                   │                       │
           └───────────────────┼───────────────────────┘
                               ▼
                    ┌──────────────────────────────────────┐
                    │         Smart Contracts               │
                    │       Base Sepolia (84532)            │
                    ├──────────────────────────────────────┤
                    │                                      │
                    │  UNCHANGED (zero modifications):     │
                    │  ├── PredictionMarket.sol             │
                    │  ├── RewardDistributor.sol            │
                    │  └── AutoSettler.sol                  │
                    │                                      │
                    │  ERC-8004 Layer (NEW):               │
                    │  ├── AgentIdentity.sol    (ERC-721)  │
                    │  ├── AgentReputation.sol  (Feedback) │
                    │  └── AgentRegistryV2.sol  (Bridge)   │
                    │                                      │
                    └──────────────────────────────────────┘
```

### ERC-8004 Adapter Pattern

```
              UNCHANGED                            NEW (ERC-8004)
┌──────────────────────────────┐   ┌──────────────────────────────────┐
│ PredictionMarket.sol         │   │ AgentIdentity.sol (ERC-721 NFT)  │
│ RewardDistributor.sol        │──▶│ AgentReputation.sol (Feedback)   │
│ AutoSettler.sol              │   │ AgentRegistryV2.sol (Bridge)     │
│                              │   │                                  │
│ All use IAgentRegistry       │   │ V2 implements IAgentRegistry     │
│ interface — ZERO changes     │   │ delegates to Identity + Rep      │
└──────────────────────────────┘   └──────────────────────────────────┘
```

- `AgentRegistryV2` implements the **exact same** `IAgentRegistry` interface
- PredictionMarket, RewardDistributor, AutoSettler require **ZERO changes**
- Each agent gets an ERC-721 NFT identity with on-chain metadata
- Bet results auto-post reputation feedback (win/loss tags)

---

## 8 Chainlink Services

| # | Service | Integration | File(s) |
|---|---------|-------------|---------|
| 1 | **CRE** | 3 workflows | [`cre-workflows/`](cre-workflows/) |
| 2 | **x402** | Express middleware | [`x402-server/src/server.ts`](x402-server/src/server.ts) |
| 3 | **Data Streams** | agent-trader | [`cre-workflows/agent-trader/`](cre-workflows/agent-trader/) |
| 4 | **Data Feeds** | contracts + workflows | [`cre-workflows/agent-trader/`](cre-workflows/agent-trader/) |
| 5 | **Functions** | PredictionMarket.sol | [`contracts/src/PredictionMarket.sol`](contracts/src/PredictionMarket.sol) |
| 6 | **CCIP** | cross-chain betting | [`contracts/src/PredictionMarket.sol`](contracts/src/PredictionMarket.sol) |
| 7 | **VRF v2.5** | RewardDistributor.sol | [`contracts/src/RewardDistributor.sol`](contracts/src/RewardDistributor.sol) |
| 8 | **Automation** | AutoSettler.sol | [`contracts/src/AutoSettler.sol`](contracts/src/AutoSettler.sol) |

### Additional Standard: ERC-8004 (Trustless Agents)

| Standard | Integration | File(s) |
|----------|-------------|---------|
| **ERC-8004 Identity** | Agent NFT registry | [`contracts/src/AgentIdentity.sol`](contracts/src/AgentIdentity.sol) |
| **ERC-8004 Reputation** | On-chain feedback | [`contracts/src/AgentReputation.sol`](contracts/src/AgentReputation.sol) |
| **ERC-8004 Bridge** | IAgentRegistry adapter | [`contracts/src/AgentRegistryV2.sol`](contracts/src/AgentRegistryV2.sol) |

---

## Chainlink File Links

> Required for hackathon submission — direct links to all Chainlink-related files.

### CRE Workflows
- [`cre-workflows/market-creator/workflow.ts`](cre-workflows/market-creator/workflow.ts) — Cron + HTTP trigger, Gemini AI market creation
- [`cre-workflows/market-creator/trigger.ts`](cre-workflows/market-creator/trigger.ts) — Trigger config (cron + HTTP)
- [`cre-workflows/agent-trader/workflow.ts`](cre-workflows/agent-trader/workflow.ts) — HTTP trigger, Data Feeds + Gemini AI trading
- [`cre-workflows/agent-trader/trigger.ts`](cre-workflows/agent-trader/trigger.ts) — Trigger config (HTTP)
- [`cre-workflows/market-settler/workflow.ts`](cre-workflows/market-settler/workflow.ts) — EVM Log trigger, Gemini AI settlement
- [`cre-workflows/market-settler/trigger.ts`](cre-workflows/market-settler/trigger.ts) — Trigger config (EVM log)

### x402 Payment Protocol
- [`x402-server/src/server.ts`](x402-server/src/server.ts) — Express server with x402 payment middleware config
- [`x402-server/src/x402Client.ts`](x402-server/src/x402Client.ts) — AI agent client with x402 payment headers

### Smart Contracts (Chainlink integrations)
- [`contracts/src/PredictionMarket.sol`](contracts/src/PredictionMarket.sol) — CRE `onReport()` callback, Functions, CCIP
- [`contracts/src/RewardDistributor.sol`](contracts/src/RewardDistributor.sol) — VRF v2.5 random agent rewards
- [`contracts/src/AutoSettler.sol`](contracts/src/AutoSettler.sol) — Automation `checkUpkeep`/`performUpkeep`
- [`contracts/src/AgentIdentity.sol`](contracts/src/AgentIdentity.sol) — ERC-8004 Identity Registry (ERC-721)
- [`contracts/src/AgentReputation.sol`](contracts/src/AgentReputation.sol) — ERC-8004 Reputation Registry
- [`contracts/src/AgentRegistryV2.sol`](contracts/src/AgentRegistryV2.sol) — ERC-8004 Bridge (IAgentRegistry adapter)

### Deployment
- [`contracts/script/Deploy.s.sol`](contracts/script/Deploy.s.sol) — Full deployment script (6 contracts)

---

## Project Structure

```
agentbet/
├── contracts/           # Foundry — Solidity 0.8.24
│   ├── src/
│   │   ├── AgentIdentity.sol      # ERC-8004 Identity (ERC-721 NFT)
│   │   ├── AgentReputation.sol    # ERC-8004 Reputation (feedback)
│   │   ├── AgentRegistryV2.sol    # ERC-8004 Bridge → IAgentRegistry
│   │   ├── AgentRegistry.sol      # Legacy registry (kept for ref)
│   │   ├── PredictionMarket.sol   # Market lifecycle + CRE onReport
│   │   ├── RewardDistributor.sol  # VRF random agent rewards
│   │   ├── AutoSettler.sol        # Chainlink Automation compatible
│   │   └── interfaces/
│   │       ├── IAgentRegistry.sol # Shared interface (unchanged)
│   │       ├── IAgentIdentity.sol # ERC-8004 Identity interface
│   │       └── IAgentReputation.sol # ERC-8004 Reputation interface
│   ├── test/                      # 86 tests (34 legacy + 52 ERC-8004)
│   └── script/Deploy.s.sol
├── cre-workflows/       # CRE TypeScript workflows
│   ├── market-settler/            # EVM Log trigger → AI settlement
│   ├── market-creator/            # Cron + HTTP → autonomous market creation
│   └── agent-trader/              # HTTP → AI strategy + Data Feeds
├── x402-server/         # Express + x402 payment middleware
│   └── src/
│       ├── server.ts              # Payment-gated + free API endpoints
│       └── x402Client.ts         # AI agent client utility
├── frontend/            # Next.js 14 + Tailwind + wagmi + RainbowKit
│   └── src/app/
│       ├── page.tsx               # Dashboard
│       ├── markets/               # Market list + detail
│       ├── agents/                # Agent grid + profile (ERC-8004 register)
│       └── leaderboard/          # Rankings
└── README.md
```

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, cast)
- [Bun](https://bun.sh/) >= 1.2.21 (required for CRE SDK)
- [Node.js](https://nodejs.org/) >= 18
- Base Sepolia ETH (faucet: https://www.alchemy.com/faucets/base-sepolia)
- [Gemini API key](https://aistudio.google.com/apikey) (free tier)

### 1. Clone & Setup

```bash
git clone <repo-url> agentbet
cd agentbet
cp .env.example .env
# Fill in your keys in .env
```

### 2. Smart Contracts

```bash
cd contracts

# Install dependencies
forge install

# Run tests (86 tests — 34 legacy + 52 ERC-8004)
forge test -vv

# Deploy to Base Sepolia
source ../.env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

After deployment, update contract addresses in `.env`.

### 3. CRE Workflows

```bash
cd cre-workflows

# Install dependencies per workflow
cd market-settler && bun install && cd ..
cd market-creator && bun install && cd ..
cd agent-trader && bun install && cd ..

# Set secrets
export CRE_ETH_PRIVATE_KEY=your_private_key
export GEMINI_API_KEY_VAR=your_gemini_key

# Simulate workflows
cre workflow simulate market-settler --broadcast
cre workflow simulate market-creator --broadcast
cre workflow simulate agent-trader --broadcast

# Deploy to CRE network
cre workflow deploy market-settler
cre workflow deploy market-creator
cre workflow deploy agent-trader
```

### 4. x402 Server

```bash
cd x402-server

# Install dependencies
bun install

# Start server (port 3001)
bun run dev
```

**Endpoints:**

| Method | Path | Cost | Description |
|--------|------|------|-------------|
| POST | `/api/create-market` | $0.01 USDC | Create prediction market via CRE |
| POST | `/api/agent-strategy` | $0.001 USDC | AI strategy + auto-trade |
| GET | `/api/markets` | Free | List all markets |
| GET | `/api/markets/:id` | Free | Market details |
| GET | `/api/leaderboard` | Free | Agent rankings |
| GET | `/api/agents/:address` | Free | Agent profile |
| GET | `/api/stats` | Free | Platform stats |

### 5. Frontend

```bash
cd frontend

# Install dependencies
bun install

# Create frontend env
cp .env.example .env.local

# Start dev server (port 3000)
bun run dev
```

Open http://localhost:3000

---

## Smart Contracts

### AgentIdentity.sol (ERC-8004 Identity)
- ERC-721 NFT-based agent identity registry
- `register(agentURI, metadata[])` — mint NFT, store on-chain metadata, 0.001 ETH min stake
- `setAgentWallet(agentId, newWallet, deadline, signature)` — EIP-712 wallet rotation
- `getMetadata(agentId, key)` / `setMetadata(agentId, key, value)` — on-chain key-value store
- `isRegisteredAgent(wallet)` / `getAgentIdByWallet(wallet)` — reverse lookups

### AgentReputation.sol (ERC-8004 Reputation)
- On-chain feedback system with summary caching
- `giveFeedback(FeedbackInput)` — post tagged feedback (value, tag1, tag2, endpoint)
- `getSummary(agentId, tag1, tag2)` — aggregated reputation by tags
- `readAllFeedback(agentId, tag1, tag2, includeRevoked)` — query feedback history
- Auto-posted by AgentRegistryV2 on every bet result and market creation

### AgentRegistryV2.sol (ERC-8004 Bridge)
- Implements `IAgentRegistry` — drop-in replacement for legacy AgentRegistry
- Delegates identity to `AgentIdentity`, reputation to `AgentReputation`
- `recordBetResult()` → updates stats + auto-posts reputation feedback
- `getAgent()` → composes Agent struct from identity metadata + local stats
- **Score** = win rate (basis points) + net profit bonus

### PredictionMarket.sol
- Binary YES/NO pot-based markets with 2% protocol fee
- `createMarket(question, duration, buffer, isAgent, agentAddr)`
- `predict(marketId, choice)` — payable, min 0.001 ETH
- `requestSettlement(marketId)` — triggers CRE settlement workflow
- `onReport(bytes)` — CRE Forwarder callback (0x00=create, 0x01=settle)
- `claim(marketId)` — winners get proportional payout

### RewardDistributor.sol
- `startRewardRound()` — payable, picks random agent via VRF
- Rewards ETH to randomly selected registered agent

### AutoSettler.sol
- Chainlink Automation compatible (`checkUpkeep`/`performUpkeep`)
- Scans for expired markets and auto-triggers settlement

---

## CRE Workflows

### market-settler (EVM Log Trigger)
Listens for `SettlementRequested` events → Gemini AI verifies outcome with search grounding → encodes settlement report → writes on-chain via CRE Forwarder.

### market-creator (Cron + HTTP Trigger)
- **Cron** (every 6h): Gemini generates trending prediction questions → auto-creates markets on-chain
- **HTTP**: Validates user-submitted questions via AI → creates markets

### agent-trader (HTTP Trigger)
Receives trade request → reads market state → fetches Chainlink Data Feeds (ETH/USD, BTC/USD, LINK/USD) → Gemini analyzes strategy → places bet if confidence > 60%.

---

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| AgentIdentity (ERC-8004) | `0xA8bc3d9842FBAB05372FF262dFcd04628C64c7D3` |
| AgentReputation (ERC-8004) | `0xe8bB69D476Bcf66e8d039C24E447e2Cc6Dc38Cb4` |
| AgentRegistryV2 | `0x9e820a4a2451B88aD10c4a43E77748d0465CbAac` |
| PredictionMarket | `0xB635CBEb6C1aB83adF72ff6bEc5f8423c7E2ced4` |
| RewardDistributor | `0x2fBeE7C3960486004b7c53A248B0A43bA064F12c` |
| AutoSettler | `0x2aD5C639874B9048c05b124D0A53E74Cd6Df7AF8` |

### External Addresses

| Contract | Address |
|----------|---------|
| CRE Forwarder | `0x82300bd7c3958625581cc2F77bC6464dcEcDF3e5` |
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| LINK | `0xE4aB69C077896252FAFBD49EFD26B5D171A32410` |
| CCIP Router | `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93` |

## Demo Flow

1. **Register** AI agent — mints ERC-721 NFT identity with on-chain metadata
2. **CRE auto-creates** prediction market via Gemini + x402 payment
3. **Agents trade**: x402 → AI strategy → place bets → pools update live
4. **Human bets** alongside agents via frontend
5. **Settlement**: CRE Log trigger → Gemini verifies → market resolves → claim winnings
6. **Reputation updated**: win/loss feedback auto-posted to ERC-8004 Reputation Registry
7. **VRF reward**: random agent wins bonus ETH

## Testing

```bash
cd contracts
forge test -vv
```

**86 tests total:**
- `PredictionMarket.t.sol` — 21 tests (market lifecycle)
- `AgentRegistry.t.sol` — 13 tests (legacy registry)
- `AgentIdentity.t.sol` — 18 tests (ERC-8004 identity, wallet rotation, metadata)
- `AgentReputation.t.sol` — 11 tests (feedback, summaries, revocation)
- `AgentRegistryV2.t.sol` — 18 tests (bridge, IAgentRegistry compliance)
- `ERC8004Integration.t.sol` — 5 tests (end-to-end with PredictionMarket)

## Tech Stack

- **Chain**: Base Sepolia (84532)
- **Contracts**: Foundry, Solidity 0.8.24, OpenZeppelin v5
- **Agent Standard**: ERC-8004 (Identity + Reputation)
- **CRE**: @chainlink/cre-sdk (TypeScript → WASM)
- **AI**: Google Gemini (search grounding)
- **x402**: @x402/express + @x402/fetch
- **Frontend**: Next.js 14, Tailwind CSS, wagmi v3, viem v2, RainbowKit
- **Runtime**: Bun 1.2.21+

## License

MIT
