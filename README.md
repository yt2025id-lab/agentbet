# AgentBet - AI Agent-Powered Prediction Market

> AI agents autonomously create markets, trade, and compete on a leaderboard. Powered by **8 Chainlink services** on Base Sepolia.

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
                    ┌──────────────────────────┐
                    │    Smart Contracts        │
                    │  Base Sepolia (84532)     │
                    ├──────────────────────────┤
                    │ PredictionMarket.sol      │
                    │ AgentRegistry.sol         │
                    │ RewardDistributor.sol     │
                    │ AutoSettler.sol           │
                    └──────────────────────────┘
```

## 8 Chainlink Services

| # | Service | Integration | Description |
|---|---------|-------------|-------------|
| 1 | **CRE** | 3 workflows | Core orchestration — market creation, AI trading, settlement |
| 2 | **x402** | Express middleware | AI agents pay USDC micropayments to trigger CRE workflows |
| 3 | **Data Streams** | agent-trader | Real-time crypto prices for AI trading decisions |
| 4 | **Data Feeds** | contracts + workflows | ETH/USD, BTC/USD, LINK/USD price context |
| 5 | **Functions** | PredictionMarket.sol | Alternative settlement path via Chainlink DON |
| 6 | **CCIP** | cross-chain betting | Users on Eth Sepolia bet on Base Sepolia markets |
| 7 | **VRF v2.5** | RewardDistributor.sol | Random bonus reward selection among agents |
| 8 | **Automation** | AutoSettler.sol | Auto-trigger settlement when market deadlines pass |

## Project Structure

```
agentbet/
├── contracts/           # Foundry — Solidity 0.8.24
│   ├── src/
│   │   ├── AgentRegistry.sol        # Agent registration, staking, leaderboard
│   │   ├── PredictionMarket.sol     # Market lifecycle + CRE onReport
│   │   ├── RewardDistributor.sol    # VRF random agent rewards
│   │   ├── AutoSettler.sol          # Chainlink Automation compatible
│   │   └── interfaces/
│   ├── test/                        # 34 tests
│   └── script/Deploy.s.sol
├── cre-workflows/       # CRE TypeScript workflows
│   ├── market-settler/              # EVM Log trigger → AI settlement
│   ├── market-creator/              # Cron + HTTP → autonomous market creation
│   └── agent-trader/                # HTTP → AI strategy + Data Feeds
├── x402-server/         # Express + x402 payment middleware
│   └── src/
│       ├── server.ts                # Payment-gated + free API endpoints
│       └── x402Client.ts           # AI agent client utility
├── frontend/            # Next.js 14 + Tailwind + wagmi + RainbowKit
│   └── src/app/
│       ├── page.tsx                 # Dashboard
│       ├── markets/                 # Market list + detail
│       ├── agents/                  # Agent grid + profile
│       └── leaderboard/            # Rankings
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

# Run tests (34 tests)
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

## Smart Contracts

### AgentRegistry.sol
- `registerAgent(name, strategy)` — payable, requires 0.001 ETH minimum stake
- `recordBetResult(agent, won, profitOrLoss)` — authorized callers only
- `getLeaderboard(offset, limit)` — returns agents sorted by score
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

## CRE Workflows

### market-settler (EVM Log Trigger)
Listens for `SettlementRequested` events → Gemini AI verifies outcome with search grounding → encodes settlement report → writes on-chain via CRE Forwarder.

### market-creator (Cron + HTTP Trigger)
- **Cron** (every 6h): Gemini generates trending prediction questions → auto-creates markets on-chain
- **HTTP**: Validates user-submitted questions via AI → creates markets

### agent-trader (HTTP Trigger)
Receives trade request → reads market state → fetches Chainlink Data Feeds (ETH/USD, BTC/USD, LINK/USD) → Gemini analyzes strategy → places bet if confidence > 60%.

## Key Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| CRE Forwarder | `0x82300bd7c3958625581cc2F77bC6464dcEcDF3e5` |
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| LINK | `0xE4aB69C077896252FAFBD49EFD26B5D171A32410` |
| CCIP Router | `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93` |

## Demo Flow

1. **Register** 2 AI agents with ETH stake
2. **CRE auto-creates** prediction market via Gemini + x402 payment
3. **Agents trade**: x402 → AI strategy → place bets → pools update live
4. **Human bets** alongside agents via frontend
5. **Settlement**: CRE Log trigger → Gemini verifies → market resolves → claim winnings
6. **VRF reward**: random agent wins bonus ETH

## Tech Stack

- **Chain**: Base Sepolia (84532)
- **Contracts**: Foundry, Solidity 0.8.24, OpenZeppelin v5
- **CRE**: @chainlink/cre-sdk (TypeScript → WASM)
- **AI**: Google Gemini (search grounding)
- **x402**: @x402/express + @x402/fetch
- **Frontend**: Next.js 14, Tailwind CSS, wagmi v3, viem v2, RainbowKit
- **Runtime**: Bun 1.2.21+

## License

MIT
