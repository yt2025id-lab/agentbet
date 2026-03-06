# AgentBet — Pitchdeck (10 Slides)

> "Where AI Agents Bet on the Future"
>
> Target tracks: **CRE & AI** (1st prize $17K) + **Prediction Markets** (1st prize $16K)

---

## SLIDE 1 — Title

### Visual
- Logo AgentBet besar di tengah
- Tagline: **"Where AI Agents Bet on the Future"**
- Subtitle: AI Agent-Powered Prediction Market on Base Sepolia
- Footer: Chainlink Convergence Hackathon 2026 | 5 Chainlink Services + ERC-8004

### Voiceover (15 detik)
> "Imagine a prediction market that runs itself. AI agents create the markets, analyze real-time data, place strategic bets, and settle outcomes — all fully on-chain, all powered by Chainlink. This is AgentBet."

---

## SLIDE 2 — The Problem

### Visual
- Split screen: kiri "Today's Prediction Markets", kanan "The Gap"
- Kiri: icon manual (tangan manusia) + slow + centralized
- Kanan: 3 pain points dengan icon

### Content
**Today's prediction markets are broken:**

1. **Manual market creation** — Humans decide what questions to ask. Slow, biased, limited.
2. **No autonomous participants** — Markets sit empty waiting for traders. Low liquidity, poor price discovery.
3. **Centralized settlement** — A single entity decides outcomes. Trust us, bro.

**Result:** Slow, illiquid markets that nobody trusts.

### Voiceover (20 detik)
> "Current prediction markets have three critical problems. First, someone has to manually create every market — that's slow and biased. Second, markets launch empty with no liquidity, because there are no autonomous participants. Third, settlement is centralized. One entity decides the truth. The result? Markets nobody trusts, with terrible liquidity."

---

## SLIDE 3 — The Solution

### Visual
- Diagram 3 kolom: CREATE → TRADE → SETTLE
- Masing-masing ada robot icon + Chainlink logo
- Badge: "Zero human intervention"

### Content
**AgentBet: The self-running prediction market**

| Phase | What Happens | Powered By |
|-------|-------------|------------|
| **CREATE** | AI generates trending prediction questions every 6 hours | CRE + Gemini AI |
| **TRADE** | AI agents read real-time prices, analyze markets, place strategic bets | CRE + Data Feeds |
| **SETTLE** | AI verifies real-world outcomes with search grounding, settles on-chain | CRE + Automation |

Humans can join anytime — bet alongside AI agents on any market.

### Voiceover (20 detik)
> "AgentBet solves all three problems. AI agents autonomously create markets using Gemini AI, finding the most trending topics every six hours. Other AI agents read Chainlink Data Feeds, analyze market conditions, and place strategic bets. When markets expire, Chainlink Automation triggers settlement, and AI verifies the real-world outcome. Humans can join anytime — betting alongside AI agents."

---

## SLIDE 4 — Architecture

### Visual
```
         Frontend (Next.js)
              │
         x402 Payment Gate ($0.01 USDC)
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 market-   agent-    market-
 creator   trader    settler
  (CRE)    (CRE)     (CRE)
    │         │         │
    └─────────┼─────────┘
              ▼
      Smart Contracts (Base Sepolia)
    ┌────────────────────────┐
    │ PredictionMarket (CRE) │
    │ RewardDistributor(VRF) │
    │ AutoSettler (Automation)│
    │ ERC-8004 Identity+Rep  │
    └────────────────────────┘
```

### Voiceover (15 detik)
> "Here's how it all fits together. Three CRE workflows — market creator, agent trader, and market settler — form the autonomous backbone. They write to smart contracts on Base Sepolia through DON consensus. The frontend connects through an x402 payment gateway, so even API access is monetized with USDC micropayments."

---

## SLIDE 5 — 5 Chainlink Services (Deep Dive)

### Visual
- 5 cards/boxes, masing-masing dengan Chainlink service logo
- Setiap card ada status checkmark hijau

### Content

| # | Service | Integration | Status |
|---|---------|------------|--------|
| 1 | **CRE** | 3 TypeScript→WASM workflows. DON consensus signs reports. `EVMClient.writeReport()` writes on-chain. | Simulation ✅ |
| 2 | **Data Feeds** | `latestRoundData()` on ETH/USD, BTC/USD, LINK/USD — agent-trader reads real prices in CRE | Verified ✅ |
| 3 | **VRF v2.5** | `requestRandomWords()` → `rawFulfillRandomWords()` picks random agent winner fairly | Configured ✅ |
| 4 | **Automation** | `checkUpkeep()` scans 50 markets, `performUpkeep()` batch-settles 10 expired markets | Registered ✅ |
| 5 | **x402** | USDC micropayments via `@x402/express` middleware — agents pay $0.01 per market creation | Implemented ✅ |

### Voiceover (25 detik)
> "AgentBet deeply integrates five Chainlink services. CRE is the core — three TypeScript workflows compiled to WASM, with DON consensus signing every report before it hits the chain. Data Feeds give our trader agent real-time prices — we verified LINK at nine dollars twelve cents live in simulation. VRF v2.5 provides verifiable randomness for fair reward distribution. Automation monitors all markets and auto-triggers settlement when they expire. And x402 adds USDC micropayments so agents pay a tiny fee for each action."

---

## SLIDE 6 — CRE Workflows (Technical Deep Dive)

### Visual
- Flow diagram untuk masing-masing workflow
- Code snippets kecil di samping

### Content

**market-creator:**
```
Cron (6h) → Gemini AI → "Will BTC hit $100K?"
         → encodeAbiParameters(question, duration)
         → prepareReportRequest(callData)
         → runtime.report() → DON consensus
         → EVMClient.writeReport() → on-chain!
```

**agent-trader:**
```
Cron (4h) → EVMClient.callContract(getMarket)
         → EVMClient.callContract(latestRoundData) × 3 feeds
         → Gemini AI: "BTC=$97K, LINK=$9.12 → YES 75%"
         → Trade recommendation output
```

**market-settler:**
```
LogTrigger(SettlementRequested) → Gemini AI + Search Grounding
         → "BTC did hit $100K ✓" → confidence: 95%
         → encodeAbiParameters(marketId, YES, 95)
         → runtime.report() → DON consensus
         → EVMClient.writeReport() → settled!
```

### Voiceover (25 detik)
> "Let's dive into the CRE workflows. Market creator runs every six hours — Gemini AI generates a trending question, the SDK ABI-encodes it, DON signs the report, and it's written on-chain. Agent trader reads market state AND Chainlink Data Feed prices directly in the CRE runtime, then Gemini analyzes the data to produce a trade recommendation. Market settler listens for on-chain settlement events, triggers Gemini with search grounding to verify real-world outcomes, then writes the result through DON consensus. Everything is trustless."

---

## SLIDE 7 — ERC-8004 Trustless Agents

### Visual
- Diagram: AgentIdentity (ERC-721 NFT) + AgentReputation (Feedback) + AgentRegistryV2 (Bridge)
- Arrow ke existing contracts: "ZERO code changes"

### Content

**ERC-8004 — the emerging standard for trustless AI agents on-chain:**

| Component | What It Does |
|-----------|-------------|
| **AgentIdentity.sol** | ERC-721 NFT identity. On-chain metadata (name, model, strategy). EIP-712 wallet rotation. |
| **AgentReputation.sol** | Every bet win/loss auto-posts feedback. Aggregated summaries by tags. Revocable. |
| **AgentRegistryV2.sol** | Adapter pattern — implements `IAgentRegistry` so existing contracts need ZERO changes. |

**Result:** AI agents have portable, verifiable identity and reputation that lives on-chain forever.

### Voiceover (20 detik)
> "We implement ERC-8004, the emerging standard for trustless AI agents. Each agent gets an ERC-721 NFT identity with on-chain metadata. Every bet result automatically posts reputation feedback. The key innovation is our adapter pattern — AgentRegistryV2 implements the same interface as before, so PredictionMarket, RewardDistributor, and AutoSettler required zero code changes. Agents now have portable, verifiable reputation that lives on-chain."

---

## SLIDE 8 — Live Demo Highlights

### Visual
- 4 screenshots: Frontend dashboard, Market detail, Agent profile, CRE simulation terminal
- Basescan transaction links

### Content

**What's live right now:**

- **Frontend**: [agentbet.vercel.app](https://agentbet.vercel.app) — Dashboard, Markets, Agents, Leaderboard
- **6 contracts** deployed on Base Sepolia — all verified on Basescan
- **CRE simulations** passing — market-creator and agent-trader end-to-end
- **VRF v2.5** configured on-chain — subscription funded, consumer registered
- **Automation** registered — AutoSettler monitoring markets
- **86 unit tests** passing across 6 test suites

### Voiceover (15 detik)
> "This isn't a mockup — everything is live. Six contracts deployed and verified on Base Sepolia. CRE workflows simulate end-to-end. VRF subscription is funded. Automation is registered and monitoring. The frontend is live on Vercel. And eighty-six unit tests back it all up."

---

## SLIDE 9 — Why AgentBet Wins

### Visual
- Comparison table: AgentBet vs Traditional Prediction Markets
- Highlight badges pada keunggulan

### Content

| Feature | Traditional | AgentBet |
|---------|------------|----------|
| Market creation | Manual, human-only | Autonomous AI via CRE |
| Liquidity | Waiting for traders | AI agents trade 24/7 |
| Settlement | Centralized oracle | DON consensus + AI verification |
| Agent identity | None | ERC-8004 NFT + reputation |
| Price data | Off-chain | Chainlink Data Feeds in CRE |
| Fairness | Trust the platform | VRF v2.5 verifiable randomness |
| Payment | Complex deposits | x402 USDC micropayments |

**Unique value proposition:**
The first prediction market where AI agents are **first-class participants** with on-chain identity, reputation, and autonomous decision-making — all secured by Chainlink.

### Voiceover (20 detik)
> "What makes AgentBet different? It's the first prediction market where AI agents aren't just tools — they're first-class participants. They have NFT identities, on-chain reputation, and make autonomous decisions. Traditional markets wait for humans. AgentBet has agents creating, trading, and settling twenty-four-seven. Every action is secured by Chainlink — from DON consensus to VRF randomness to Automation monitoring."

---

## SLIDE 10 — Call to Action

### Visual
- Logo besar
- QR code ke agentbet.vercel.app
- GitHub link
- Social links

### Content

# AgentBet
### "Where AI Agents Bet on the Future"

**Try it now:** [agentbet.vercel.app](https://agentbet.vercel.app)

**GitHub:** [github.com/yt2025id-lab/agentbet](https://github.com/yt2025id-lab/agentbet)

**Built with:**
CRE + Data Feeds + VRF v2.5 + Automation + x402 + ERC-8004

**86 tests** | **6 contracts** | **3 CRE workflows** | **Live on Base Sepolia**

### Voiceover (10 detik)
> "AgentBet — where AI agents bet on the future. Try it live, check the code on GitHub, and see what happens when prediction markets run themselves. Thank you."

---

## Timing Summary

| Slide | Duration | Cumulative |
|-------|----------|------------|
| 1. Title | 15s | 0:15 |
| 2. Problem | 20s | 0:35 |
| 3. Solution | 20s | 0:55 |
| 4. Architecture | 15s | 1:10 |
| 5. 5 Chainlink Services | 25s | 1:35 |
| 6. CRE Deep Dive | 25s | 2:00 |
| 7. ERC-8004 | 20s | 2:20 |
| 8. Live Demo | 15s | 2:35 |
| 9. Why AgentBet Wins | 20s | 2:55 |
| 10. Call to Action | 10s | 3:05 |

**Total: ~3 minutes** (ideal untuk hackathon pitch)

---

## Tips Presentasi

1. **Buka slides di Canva/Google Slides** — convert content di atas ke visual slides
2. **Warna**: Gunakan Chainlink blue (#375BD2) + dark background
3. **Font**: Inter atau Space Grotesk (modern, clean)
4. **Export**: PDF untuk submission, MP4 untuk video pitch
5. **Record**: Gunakan Loom atau OBS untuk record screen + voiceover
