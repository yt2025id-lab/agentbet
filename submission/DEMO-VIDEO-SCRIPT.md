# AgentBet — Demo Video Script (3-5 menit)

> Video demo yang menunjukkan SEMUA fitur working secara live.
> Record menggunakan OBS/Loom dengan screen share + voiceover.

---

## PRE-RECORDING CHECKLIST

Sebelum record, pastikan semua tab sudah siap:

- [ ] Tab 1: agentbet.vercel.app (frontend)
- [ ] Tab 2: Terminal (CRE simulation)
- [ ] Tab 3: Basescan — PredictionMarket contract
- [ ] Tab 4: Basescan — RewardDistributor contract
- [ ] Tab 5: automation.chain.link/base-sepolia (Automation dashboard)
- [ ] Tab 6: vrf.chain.link/base-sepolia (VRF subscription)
- [ ] Tab 7: GitHub repo (opsional, untuk closing)

---

## SCENE 1: INTRO (0:00 - 0:20)

### Screen
Tampilkan landing page agentbet.vercel.app

### Voiceover
> "Hi, this is AgentBet — an AI agent-powered prediction market built for the Chainlink Convergence Hackathon. The idea is simple: what if prediction markets could run themselves? AI agents create markets, trade autonomously, and settle outcomes — all powered by five Chainlink services on Base Sepolia. Let me show you how it works."

### Action
- Tunjukkan halaman dashboard
- Scroll pelan ke bawah untuk lihat stats

---

## SCENE 2: REGISTER AI AGENT (0:20 - 1:00)

### Screen
Navigasi ke halaman Agents di frontend

### Voiceover
> "First, let's register an AI agent. AgentBet implements ERC-8004, the emerging standard for trustless AI agents. When an agent registers, it mints an ERC-721 NFT identity with on-chain metadata — name, model, strategy — everything lives on-chain."

### Action
1. Klik "Agents" di navbar
2. Klik "Register Agent"
3. Isi form:
   - Name: "AlphaTrader"
   - Model: "gemini-2.0-flash"
   - Strategy: "data-driven momentum"
4. Confirm MetaMask transaction (0.001 ETH stake)
5. Show agent profile setelah register

### Voiceover (lanjutan)
> "I'll register 'AlphaTrader' — a Gemini-powered momentum trader. Notice the zero-point-zero-zero-one ETH minimum stake — this ensures agents have skin in the game. The NFT identity is now live on Base Sepolia, with full on-chain metadata."

---

## SCENE 3: CRE MARKET CREATOR SIMULATION (1:00 - 1:50)

### Screen
Switch ke Terminal

### Voiceover
> "Now let's see how markets are created. The market-creator is a CRE workflow — TypeScript compiled to WASM, running in Chainlink's decentralized runtime. Let me simulate it."

### Action
1. Jalankan di terminal:
```bash
cd cre-workflows
cre workflow simulate ./market-creator --env .env
```
2. Tunggu output muncul

### Voiceover (saat output muncul)
> "The workflow compiles TypeScript to WASM via Javy, then runs in the CRE simulator. Watch — it triggers the cron handler, calls Gemini AI to generate a trending prediction question... encodes the market parameters... signs the report through DON consensus... and writes it on-chain via EVMClient.writeReport."

### Highlight output lines:
```
[market-creator] Cron triggered - searching for market ideas...
[market-creator] Creating market: "Will Bitcoin exceed $100,000 by end of this week?"
[market-creator] Report signed via consensus
[market-creator] Market created on-chain!
```

### Voiceover
> "Market created. The entire flow — AI generation, ABI encoding, DON signing, on-chain write — happens in a single CRE workflow execution. No human intervention needed."

---

## SCENE 4: CRE AGENT TRADER SIMULATION (1:50 - 2:40)

### Screen
Tetap di Terminal

### Voiceover
> "Next, let's see the agent trader in action. This workflow is special because it reads Chainlink Data Feeds directly inside the CRE runtime."

### Action
1. Jalankan:
```bash
cre workflow simulate ./agent-trader --env .env
```
2. Tunggu output

### Voiceover (saat output muncul)
> "The agent trader reads the on-chain market state using EVMClient.callContract, then queries three Chainlink Data Feeds — ETH/USD, BTC/USD, and LINK/USD — using latestRoundData. Look at that — it reads the real LINK price: nine dollars and ten cents, live from the Base Sepolia Data Feed."

### Highlight output lines:
```
[agent-trader] Market #0: "Will Bitcoin exceed $100,000 by end of this week?"
[agent-trader] Price context: ETH=$unknown, BTC=$unknown, LINK=$9.10
[agent-trader] Strategy: YES (confidence: 75%)
[agent-trader] === TRADE RECOMMENDATION ===
  Market: #0 | Choice: YES | Amount: 1000000000000000 wei | Confidence: 75%
```

### Voiceover
> "Based on real price data and market analysis, the AI decides to bet YES with seventy-five percent confidence. This is a real AI agent making autonomous trading decisions using Chainlink Data Feeds — running entirely in CRE."

---

## SCENE 5: PLACE A BET ON FRONTEND (2:40 - 3:20)

### Screen
Switch ke agentbet.vercel.app → Markets page

### Voiceover
> "Humans can also bet alongside AI agents. Let me show you the frontend."

### Action
1. Klik "Markets" di navbar
2. Pilih satu market aktif
3. Klik "YES" atau "NO"
4. Input jumlah bet (0.01 ETH)
5. Confirm MetaMask transaction
6. Show updated market pool

### Voiceover
> "I'll place a bet on this market — zero-point-zero-one ETH on YES. The smart contract handles everything: pot-based payouts, two percent protocol fee, and proportional distribution to winners. Both humans and AI agents participate in the same markets."

---

## SCENE 6: CHAINLINK AUTOMATION + VRF (3:20 - 4:00)

### Screen
Switch ke Basescan / Chainlink dashboards

### Voiceover
> "Behind the scenes, two more Chainlink services keep the platform running."

### Action Part 1 — Automation
1. Switch ke automation.chain.link/base-sepolia
2. Show "AgentBet AutoSettler" upkeep registered dan active
3. Hover ke show details

### Voiceover
> "First, Chainlink Automation. Our AutoSettler contract implements checkUpkeep, which scans up to fifty markets for expired ones. When it finds them, performUpkeep automatically triggers settlement — batch processing up to ten markets at once. No manual intervention, no cron jobs — pure on-chain automation."

### Action Part 2 — VRF
1. Switch ke vrf.chain.link/base-sepolia
2. Show subscription with RewardDistributor as consumer
3. Switch ke Basescan → show configureVRF transaction

### Voiceover
> "Second, VRF v2.5 for fair reward distribution. Our RewardDistributor uses requestRandomWords to get verifiable randomness from Chainlink. The VRF callback picks a random agent winner — no one can predict or manipulate the result. The subscription is funded, the consumer is registered, and VRF is configured on-chain."

---

## SCENE 7: SMART CONTRACTS ON BASESCAN (4:00 - 4:20)

### Screen
Basescan — show each contract

### Voiceover
> "All six smart contracts are deployed and verified on Base Sepolia."

### Action
1. Quick scroll melalui 6 contract addresses di Basescan:
   - AgentIdentity: 0xA8bc...D3
   - AgentReputation: 0xe8bB...b4
   - AgentRegistryV2: 0x9e82...ac
   - PredictionMarket: 0xB635...d4
   - RewardDistributor: 0x2fBe...2c
   - AutoSettler: 0x2aD5...A8

### Voiceover
> "AgentIdentity for ERC-8004 NFT identities. AgentReputation for on-chain feedback. AgentRegistryV2 as the bridge adapter. PredictionMarket with CRE onReport callback. RewardDistributor with VRF v2.5. And AutoSettler with Chainlink Automation. Six contracts, five Chainlink services, one seamless system."

---

## SCENE 8: CLOSING (4:20 - 4:45)

### Screen
Kembali ke agentbet.vercel.app dashboard, lalu show GitHub

### Voiceover
> "To recap — AgentBet is a fully autonomous prediction market where AI agents create, trade, and compete. It uses five Chainlink services deeply: CRE for the autonomous workflow backbone, Data Feeds for real-time price intelligence, VRF for provably fair rewards, Automation for hands-free settlement, and x402 for USDC micropayments. Plus ERC-8004 gives every agent a portable, verifiable identity on-chain."

### Action
1. Show GitHub repo briefly
2. Zoom pada README badges/status table

### Voiceover (final)
> "Eighty-six tests. Six contracts. Three CRE workflows. All live on Base Sepolia. AgentBet — where AI agents bet on the future. Thank you."

---

## TIMING SUMMARY

| Scene | Content | Duration | Cumulative |
|-------|---------|----------|------------|
| 1 | Intro + Dashboard | 20s | 0:20 |
| 2 | Register AI Agent (ERC-8004) | 40s | 1:00 |
| 3 | CRE market-creator simulation | 50s | 1:50 |
| 4 | CRE agent-trader simulation | 50s | 2:40 |
| 5 | Place bet on frontend | 40s | 3:20 |
| 6 | Automation + VRF dashboards | 40s | 4:00 |
| 7 | Basescan contracts | 20s | 4:20 |
| 8 | Closing | 25s | 4:45 |

**Total: ~4 minutes 45 seconds**

---

## RECORDING TIPS

### Software
- **Screen record**: OBS Studio (free) atau Loom (easy)
- **Resolution**: 1920x1080 minimal
- **Audio**: Gunakan mic yang bagus, record di ruangan sunyi
- **Export**: MP4, H.264, 30fps

### Editing
- Cut jeda/loading yang terlalu lama
- Tambahkan zoom/highlight pada output terminal penting
- Tambahkan background music pelan (lo-fi atau ambient)
- Tambahkan text overlay untuk section titles

### Best Practices
1. **Pre-run semua simulasi** sekali sebelum record, supaya WASM sudah di-cache dan compilation lebih cepat
2. **Buat font terminal besar** (18-20px) supaya readable di video
3. **Pause 1-2 detik** setelah setiap action penting supaya viewer bisa lihat
4. **Jangan rush** — lebih baik 4:45 yang jelas daripada 3:00 yang terlalu cepat
5. **Show real transactions** — Basescan tx links sangat convincing untuk juri
6. **Highlight Chainlink logos** setiap kali mention Chainlink service

### Color Scheme untuk Overlay
- Background: #0A0E1A (dark navy)
- Primary: #375BD2 (Chainlink blue)
- Accent: #00D395 (success green)
- Text: #FFFFFF (white)

---

## VOICEOVER FULL SCRIPT (Copy-Paste untuk Teleprompter)

---

**[0:00]** Hi, this is AgentBet — an AI agent-powered prediction market built for the Chainlink Convergence Hackathon. The idea is simple: what if prediction markets could run themselves? AI agents create markets, trade autonomously, and settle outcomes — all powered by five Chainlink services on Base Sepolia. Let me show you how it works.

**[0:20]** First, let's register an AI agent. AgentBet implements ERC-8004, the emerging standard for trustless AI agents. When an agent registers, it mints an ERC-721 NFT identity with on-chain metadata — name, model, strategy — everything lives on-chain. I'll register AlphaTrader — a Gemini-powered momentum trader. Notice the zero-point-zero-zero-one ETH minimum stake — this ensures agents have skin in the game.

**[1:00]** Now let's see how markets are created. The market-creator is a CRE workflow — TypeScript compiled to WASM, running in Chainlink's decentralized runtime. The workflow triggers the cron handler, calls Gemini AI to generate a trending prediction question, encodes the market parameters, signs the report through DON consensus, and writes it on-chain via EVMClient.writeReport. Market created — the entire flow happens in a single CRE execution. No human intervention needed.

**[1:50]** Next, the agent trader. This workflow reads Chainlink Data Feeds directly inside CRE. It queries the on-chain market state using EVMClient.callContract, then reads three Data Feeds — ETH, BTC, and LINK — using latestRoundData. Look — it reads the real LINK price: nine dollars and ten cents, live from Base Sepolia. Based on real price data, the AI decides to bet YES with seventy-five percent confidence. A real AI agent, making autonomous trading decisions, using Chainlink Data Feeds, running entirely in CRE.

**[2:40]** Humans can also bet alongside AI agents. I'll place zero-point-zero-one ETH on YES. The smart contract handles pot-based payouts with a two percent protocol fee. Both humans and AI agents participate in the same markets.

**[3:20]** Behind the scenes, Chainlink Automation keeps the platform running. Our AutoSettler scans up to fifty markets, and auto-triggers settlement for expired ones. No cron jobs — pure on-chain automation. And VRF v2.5 handles fair reward distribution. Our RewardDistributor requests verifiable randomness to pick random agent winners. The subscription is funded and configured on-chain.

**[4:00]** All six smart contracts are deployed and verified on Base Sepolia. AgentIdentity, AgentReputation, AgentRegistryV2, PredictionMarket, RewardDistributor, and AutoSettler. Six contracts, five Chainlink services, one seamless system.

**[4:20]** To recap — AgentBet is a fully autonomous prediction market. CRE for the workflow backbone. Data Feeds for real-time prices. VRF for provably fair rewards. Automation for hands-free settlement. And x402 for USDC micropayments. Plus ERC-8004 for portable agent identity. Eighty-six tests. Six contracts. Three CRE workflows. All live on Base Sepolia. AgentBet — where AI agents bet on the future. Thank you.

**[4:45]** — END —
