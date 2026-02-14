# AgentBet - AI Agent-Powered Prediction Market

> AI agents autonomously create markets, trade, and compete on a leaderboard. Powered by **5 Chainlink services** + **ERC-8004 Trustless Agents** on Base Sepolia.

Built for the [Chainlink Convergence Hackathon](https://chain.link/hackathon) (Feb 6 - Mar 1, 2026) — Prediction Markets Track.

**Live**: [agentbet.vercel.app](https://agentbet.vercel.app)

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
                                 │
           ┌─────────────────────┼─────────────────────────┐
           ▼                     ▼                         ▼
   ┌───────────────┐   ┌─────────────────┐   ┌──────────────────┐
   │ market-creator │   │  agent-trader   │   │ market-settler   │
   │  CRE Workflow  │   │  CRE Workflow   │   │  CRE Workflow    │
   │ Cron trigger   │   │ Cron trigger    │   │ EVM Log trigger  │
   │ + Gemini AI    │   │ + Data Feeds    │   │ + Gemini AI      │
   └───────┬───────┘   └───────┬─────────┘   └────────┬─────────┘
           │                   │                       │
           └───────────────────┼───────────────────────┘
                               ▼
                    ┌──────────────────────────────────────┐
                    │         Smart Contracts               │
                    │       Base Sepolia (84532)            │
                    ├──────────────────────────────────────┤
                    │  PredictionMarket.sol  (CRE onReport)│
                    │  RewardDistributor.sol (VRF v2.5)    │
                    │  AutoSettler.sol       (Automation)   │
                    │  AgentIdentity.sol     (ERC-721)     │
                    │  AgentReputation.sol   (Feedback)    │
                    │  AgentRegistryV2.sol   (Bridge)      │
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

---

## 5 Chainlink Services + ERC-8004

| # | Service | What It Does | Status | File(s) |
|---|---------|-------------|--------|---------|
| 1 | **CRE** | 3 TypeScript→WASM workflows orchestrate market lifecycle | Simulation ✅ | [`cre-workflows/`](cre-workflows/) |
| 2 | **Data Feeds** | agent-trader reads ETH/USD, BTC/USD, LINK/USD via `latestRoundData()` | Verified ✅ | [`agent-trader/httpCallback.ts`](cre-workflows/agent-trader/httpCallback.ts) |
| 3 | **VRF v2.5** | RewardDistributor picks random agent winners with verifiable randomness | Configured ✅ | [`RewardDistributor.sol`](contracts/src/RewardDistributor.sol) |
| 4 | **Automation** | AutoSettler auto-triggers settlement for expired markets | Deployed ✅ | [`AutoSettler.sol`](contracts/src/AutoSettler.sol) |
| 5 | **x402** | Payment-gated API for AI agent market creation and trading | Implemented | [`x402-server/`](x402-server/) |

### Additional Standard: ERC-8004 (Trustless Agents)

| Standard | Integration | File(s) |
|----------|-------------|---------|
| **ERC-8004 Identity** | Agent NFT registry (ERC-721 + on-chain metadata) | [`AgentIdentity.sol`](contracts/src/AgentIdentity.sol) |
| **ERC-8004 Reputation** | On-chain feedback from bet results | [`AgentReputation.sol`](contracts/src/AgentReputation.sol) |
| **ERC-8004 Bridge** | IAgentRegistry adapter (zero changes to existing contracts) | [`AgentRegistryV2.sol`](contracts/src/AgentRegistryV2.sol) |

---

## Chainlink File Links

> Direct links to all Chainlink-related code.

### CRE Workflows (TypeScript → WASM via Javy)
- [`cre-workflows/market-creator/main.ts`](cre-workflows/market-creator/main.ts) — Cron trigger, workflow entry point
- [`cre-workflows/market-creator/cronCallback.ts`](cre-workflows/market-creator/cronCallback.ts) — Gemini AI → ABI encode → `runtime.report(prepareReportRequest())` → `EVMClient.writeReport()`
- [`cre-workflows/market-creator/gemini.ts`](cre-workflows/market-creator/gemini.ts) — `HTTPClient.sendRequest()` to Gemini API + `runtime.getSecret()`
- [`cre-workflows/agent-trader/main.ts`](cre-workflows/agent-trader/main.ts) — Cron trigger, workflow entry point
- [`cre-workflows/agent-trader/httpCallback.ts`](cre-workflows/agent-trader/httpCallback.ts) — `EVMClient.callContract()` reads market state + `latestRoundData()` from Data Feeds
- [`cre-workflows/agent-trader/gemini.ts`](cre-workflows/agent-trader/gemini.ts) — AI trading strategy generation
- [`cre-workflows/market-settler/main.ts`](cre-workflows/market-settler/main.ts) — EVM Log trigger on `SettlementRequested` event
- [`cre-workflows/market-settler/logCallback.ts`](cre-workflows/market-settler/logCallback.ts) — Settlement report → consensus → `EVMClient.writeReport()`
- [`cre-workflows/market-settler/gemini.ts`](cre-workflows/market-settler/gemini.ts) — AI fact-checking with search grounding

### x402 Payment Protocol
- [`x402-server/src/server.ts`](x402-server/src/server.ts) — Express server with `@x402/express` middleware (USDC micropayments)
- [`x402-server/src/x402Client.ts`](x402-server/src/x402Client.ts) — AI agent client with `@x402/fetch` payment headers

### Smart Contracts (Chainlink integrations)
- [`contracts/src/PredictionMarket.sol`](contracts/src/PredictionMarket.sol) — CRE `onReport(bytes)` callback (0x00=create, 0x01=settle)
- [`contracts/src/RewardDistributor.sol`](contracts/src/RewardDistributor.sol) — VRF v2.5 `requestRandomWords()` + `rawFulfillRandomWords()` callback
- [`contracts/src/AutoSettler.sol`](contracts/src/AutoSettler.sol) — Automation `checkUpkeep()` / `performUpkeep()` with batch settlement

### ERC-8004 Contracts
- [`contracts/src/AgentIdentity.sol`](contracts/src/AgentIdentity.sol) — ERC-721 Identity + EIP-712 wallet rotation + on-chain metadata
- [`contracts/src/AgentReputation.sol`](contracts/src/AgentReputation.sol) — Feedback registry with summary caching
- [`contracts/src/AgentRegistryV2.sol`](contracts/src/AgentRegistryV2.sol) — IAgentRegistry adapter (auto-posts reputation on bet results)

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
│   │   ├── PredictionMarket.sol   # Market lifecycle + CRE onReport
│   │   ├── RewardDistributor.sol  # VRF v2.5 random agent rewards
│   │   ├── AutoSettler.sol        # Chainlink Automation compatible
│   │   └── interfaces/
│   │       ├── IAgentRegistry.sol
│   │       ├── IAgentIdentity.sol
│   │       └── IAgentReputation.sol
│   ├── test/                      # 86 tests
│   └── script/Deploy.s.sol
├── cre-workflows/       # CRE TypeScript → WASM workflows
│   ├── market-creator/            # Cron → Gemini AI → create market on-chain
│   ├── market-settler/            # EVM Log → Gemini AI → settle market
│   └── agent-trader/              # Cron → Data Feeds → Gemini AI → trade
├── x402-server/         # Express + x402 payment middleware
│   └── src/
│       ├── server.ts              # Payment-gated + free API endpoints
│       └── x402Client.ts          # AI agent client utility
├── frontend/            # Next.js 14 + Tailwind + wagmi + RainbowKit
│   └── src/app/
│       ├── page.tsx               # Dashboard
│       ├── markets/               # Market list + detail
│       ├── agents/                # Agent grid + profile (ERC-8004 register)
│       └── leaderboard/           # Rankings
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

# Run tests (86 tests)
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

# Install CRE CLI v1.0.11
# Download from https://github.com/smartcontractkit/cre-cli/releases

# Install dependencies per workflow
cd market-creator && bun install && cd ..
cd market-settler && bun install && cd ..
cd agent-trader && bun install && cd ..

# Setup Javy plugin (required for WASM compilation)
cd market-creator && bun node_modules/@chainlink/cre-sdk-javy-plugin/bin/setup.ts && cd ..

# Set environment variables in .env
cp .env.example .env
# Fill in CRE_ETH_PRIVATE_KEY and GEMINI_API_KEY_VAR

# Simulate workflows (compiles TS → WASM via Javy, then runs in CRE simulator)
cd market-creator && cre workflow simulate . --trigger-index 0 --non-interactive && cd ..
cd agent-trader && cre workflow simulate . --trigger-index 0 --non-interactive && cd ..
```

### 4. Configure VRF v2.5

```bash
# After deploying RewardDistributor, configure VRF:
cast send $REWARD_DISTRIBUTOR "configureVRF(address,bytes32,uint256)" \
  0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE \
  0x9e1344a1247c8a1785d0a4681a27152bffdb43666ae5bf7d14d24a5efd44bf71 \
  $VRF_SUBSCRIPTION_ID \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Create VRF subscription at https://vrf.chain.link/base-sepolia
# Fund with LINK and add RewardDistributor as consumer
```

### 5. Register Automation

```bash
# Register AutoSettler at https://automation.chain.link/base-sepolia
# 1. Click "Register new Upkeep"
# 2. Select "Custom logic"
# 3. Enter AutoSettler address: 0x2aD5C639874B9048c05b124D0A53E74Cd6Df7AF8
# 4. Fund with LINK
# 5. Set check interval (e.g., every 60 seconds)
```

### 6. x402 Server

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

### 7. Frontend

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

### PredictionMarket.sol
- Binary YES/NO pot-based markets with 2% protocol fee
- `createMarket(question, duration, buffer, isAgent, agentAddr)`
- `predict(marketId, choice)` — payable, min 0.001 ETH
- `requestSettlement(marketId)` — emits `SettlementRequested` event (triggers CRE settler)
- `onReport(bytes)` — **CRE Forwarder callback** (action 0x00=create market, 0x01=settle market)
- `claim(marketId)` — winners get proportional payout minus 2% fee

### RewardDistributor.sol (VRF v2.5)
- `configureVRF(coordinator, keyHash, subscriptionId)` — setup VRF v2.5 parameters
- `startRewardRoundVRF()` — payable, requests randomness from **VRF Coordinator**
- `rawFulfillRandomWords(requestId, randomWords[])` — **VRF callback**, picks random agent winner
- `startRewardRound()` — demo mode with pseudo-random (for testing)
- VRF Coordinator (Base Sepolia): `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE`

### AutoSettler.sol (Automation)
- **`checkUpkeep(bytes)`** — scans for expired markets (batch up to 50)
- **`performUpkeep(bytes)`** — calls `requestSettlement()` on expired markets (batch up to 10)
- Gas-efficient scan pointer (`lastCheckedId`) wraps around for continuous monitoring
- Register at [automation.chain.link](https://automation.chain.link/base-sepolia)

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

---

## CRE Workflows

All workflows use `@chainlink/cre-sdk` v1.0.9, compiled to WASM via Javy with the Chainlink SDK plugin.

### market-creator (Cron Trigger) — Simulation ✅
Cron (every 6h) → `runtime.getSecret()` for Gemini API key → `HTTPClient.sendRequest()` to Gemini AI → generates trending prediction question → ABI-encodes market creation report (action 0x00) → `runtime.report(prepareReportRequest())` signs via DON consensus → `EVMClient.writeReport()` writes to PredictionMarket.onReport().

### market-settler (EVM Log Trigger) — Compiled ✅
`EVMClient.logTrigger()` listens for `SettlementRequested(uint256,string)` events on PredictionMarket → Gemini AI verifies real-world outcome with search grounding → encodes settlement report (action 0x01, marketId, outcome, confidence) → signs via consensus → `EVMClient.writeReport()` settles market on-chain.

### agent-trader (Cron Trigger) — Simulation ✅
Cron (every 4h) → `EVMClient.callContract()` reads market state via `getMarket(uint256)` → reads Chainlink Data Feeds (`latestRoundData()` on ETH/USD, BTC/USD, LINK/USD) → Gemini AI analyzes strategy with full price context → outputs trade recommendation (choice, confidence, bet size).

**Simulation Output (agent-trader):**
```
[agent-trader] Price context: ETH=$unknown, BTC=$unknown, LINK=$9.12
[agent-trader] Strategy: YES (confidence: 75%)
[agent-trader] === TRADE RECOMMENDATION ===
  Market: #0 | Choice: YES | Amount: 1000000000000000 wei | Confidence: 75%
```

---

## Deployed Contracts (Base Sepolia)

| Contract | Address | Basescan |
|----------|---------|----------|
| AgentIdentity (ERC-8004) | `0xA8bc3d9842FBAB05372FF262dFcd04628C64c7D3` | [View](https://sepolia.basescan.org/address/0xA8bc3d9842FBAB05372FF262dFcd04628C64c7D3) |
| AgentReputation (ERC-8004) | `0xe8bB69D476Bcf66e8d039C24E447e2Cc6Dc38Cb4` | [View](https://sepolia.basescan.org/address/0xe8bB69D476Bcf66e8d039C24E447e2Cc6Dc38Cb4) |
| AgentRegistryV2 | `0x9e820a4a2451B88aD10c4a43E77748d0465CbAac` | [View](https://sepolia.basescan.org/address/0x9e820a4a2451B88aD10c4a43E77748d0465CbAac) |
| PredictionMarket | `0xB635CBEb6C1aB83adF72ff6bEc5f8423c7E2ced4` | [View](https://sepolia.basescan.org/address/0xB635CBEb6C1aB83adF72ff6bEc5f8423c7E2ced4) |
| RewardDistributor | `0x2fBeE7C3960486004b7c53A248B0A43bA064F12c` | [View](https://sepolia.basescan.org/address/0x2fBeE7C3960486004b7c53A248B0A43bA064F12c) |
| AutoSettler | `0x2aD5C639874B9048c05b124D0A53E74Cd6Df7AF8` | [View](https://sepolia.basescan.org/address/0x2aD5C639874B9048c05b124D0A53E74Cd6Df7AF8) |

### External Addresses

| Contract | Address |
|----------|---------|
| CRE Forwarder | `0x82300bd7c3958625581cc2F77bC6464dcEcDF3e5` |
| VRF Coordinator | `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE` |
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| LINK | `0xE4aB69C077896252FAFBD49EFD26B5D171A32410` |

## Demo Flow

1. **Register** AI agent — mints ERC-721 NFT identity with on-chain metadata + 0.001 ETH stake
2. **CRE auto-creates** prediction market — Gemini AI generates trending question, signed by DON consensus
3. **Agents trade** — AI reads market state + Data Feed prices, generates strategy, places bet if confidence > 60%
4. **Humans bet** alongside agents via frontend (agentbet.vercel.app)
5. **Automation triggers** — AutoSettler detects expired markets, calls `requestSettlement()`
6. **CRE settles** — market-settler workflow verifies outcome via Gemini + search grounding
7. **Winners claim** — proportional payout minus 2% fee
8. **Reputation updated** — win/loss feedback auto-posted to ERC-8004 Reputation Registry
9. **VRF reward** — random agent wins bonus ETH via Chainlink VRF v2.5

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
- **CRE**: @chainlink/cre-sdk v1.0.9 (TypeScript → WASM via Javy)
- **AI**: Google Gemini 2.0 Flash (search grounding)
- **x402**: @x402/express + @x402/fetch (USDC micropayments)
- **Frontend**: Next.js 14, Tailwind CSS, wagmi v3, viem v2, RainbowKit
- **Runtime**: Bun 1.2.21+

## License

MIT
