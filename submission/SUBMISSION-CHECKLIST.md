# AgentBet — Submission Checklist
## Chainlink Convergence Hackathon 2026 (Feb 6 – Mar 1, 2026)

> Submit via Airtable form: https://chain.link/hackathon
> Deadline: **March 1, 2026**

---

## SYARAT WAJIB (Eligibility Requirements)

- [x] Tim 1-5 orang — kita 3 orang (Ozan, Hambali, eLyoda) ✅
- [x] Setiap anggota tim sudah register individual di hackathon ✅
- [x] Project dibangun selama hackathon (mulai Feb 6) ✅
- [x] **Menggunakan Chainlink Runtime Environment (CRE) secara meaningful** ✅
- [x] Bukan project lama yang di-resubmit tanpa significant onchain work ✅
- [x] Tim retain full IP ownership ✅

---

## CHECKLIST SUBMISSION FORM

### 1. Project Info
- [ ] **Project name**: AgentBet
- [ ] **Tagline**: Where AI Agents Bet on the Future
- [ ] **Track pilihan**: CRE & AI (primary) + Prediction Markets (secondary)
- [ ] **Short description** (1-2 paragraf):
  > AgentBet is a fully autonomous AI agent-powered prediction market on Base Sepolia. AI agents autonomously create markets using Gemini AI + Chainlink CRE, trade using real-time Chainlink Data Feeds, and settle outcomes via DON consensus. Built on ERC-8004 trustless agent identity standard with 5 Chainlink services integrated.

### 2. Links Wajib
- [ ] **GitHub repo URL**: https://github.com/yt2025id-lab/agentbet
- [ ] **Live demo URL**: https://agentbet.vercel.app
- [ ] **Demo video URL**: _(upload ke YouTube/Loom, isi link setelah upload)_

### 3. Demo Video
- [ ] Durasi **di bawah 5 menit** (kita target ~4:45) ✅
- [ ] Video sudah di-upload (YouTube/Loom/Drive)
- [ ] Video menunjukkan CRE workflow simulation live
- [ ] Video menunjukkan frontend working
- [ ] Video menunjukkan Chainlink services (Automation, VRF dashboards)
- [ ] Video menunjukkan Basescan verified contracts
- [ ] Link video sudah siap untuk diisi di form

### 4. Pitchdeck / Presentasi
- [ ] PDF pitchdeck sudah final (13 slides)
- [ ] Semua typo sudah difix (Bet, Agent Trader, Market Settler, Documentation, AgentBet)
- [ ] File PDF siap upload

### 5. Smart Contracts
- [ ] Semua contract deployed di **Base Sepolia** ✅
- [ ] Semua contract verified di Basescan ✅
- [ ] Contract addresses:
  - [x] AgentIdentity: `0xA8bc3d9842FBAB05372FF262dFcd04628C64c7D3`
  - [x] AgentReputation: `0xe8bB69D476Bcf66e8d039C24E447e2Cc6Dc38Cb4`
  - [x] AgentRegistryV2: `0x9e820a4a2451B88aD10c4a43E77748d0465CbAac`
  - [x] PredictionMarket: `0xB635CBEb6C1aB83adF72ff6bEc5f8423c7E2ced4`
  - [x] RewardDistributor: `0x2fBeE7C3960486004b7c53A248B0A43bA064F12c`
  - [x] AutoSettler: `0x2aD5C639874B9048c05b124D0A53E74Cd6Df7AF8`

### 6. CRE Workflows
- [x] market-creator — simulation passing ✅
- [x] agent-trader — simulation passing + reads real Data Feed ✅
- [x] market-settler — compiled ✅
- [ ] CRE workflow files ada di repo (cre-workflows/) ✅

### 7. Chainlink Services (5 services)
- [x] **CRE** — 3 workflows TypeScript→WASM, DON consensus ✅
- [x] **Data Feeds** — latestRoundData() ETH/BTC/LINK verified live ✅
- [x] **VRF v2.5** — subscription funded, consumer registered, configureVRF() called ✅
- [x] **Automation** — AgentBet AutoSettler upkeep registered & active ✅
- [x] **x402** — USDC micropayments via @x402/express ✅

### 8. Tim (Team Members)
- [ ] Setiap anggota tim sudah register di hackathon website
  - [ ] Ozan_OnChain (Backend & SmartContract)
  - [ ] Hambali (Frontend & Demo Video)
  - [ ] eLyoda (Documentation & Submit)

---

## KRITERIA PENILAIAN JURI

Berdasarkan FAQ hackathon, juri menilai:

| Kriteria | Bukti AgentBet |
|----------|---------------|
| **Technical Execution** | 86 tests, 6 contracts deployed, 3 CRE workflows compiled |
| **Blockchain Application** | Base Sepolia, 5 Chainlink services terintegrasi |
| **Effective CRE Use** | 3 workflows (cron + log trigger), EVMClient.writeReport() on-chain |
| **Originality** | ERC-8004 agent identity, first prediction market dengan AI agents sebagai first-class participants |

---

## FILES DALAM FOLDER INI

| File | Status | Keterangan |
|------|--------|-----------|
| `PITCHDECK.md` | ✅ Ready | 13 slide + voiceover script |
| `DEMO-VIDEO-SCRIPT.md` | ✅ Ready | 8 scene, ~4:45 menit |
| `TEAM_OVERVIEW.md` | ✅ Ready | Profile & peran tim |
| `SUBMISSION-CHECKLIST.md` | ✅ Ready | File ini |

---

## LAST-MINUTE TODO SEBELUM SUBMIT

- [ ] Fix typo pitchdeck: Slide 5 "Agnet" → "Agent", Slide 11 "E" → "&", Slide 12 "Documettation" → "Documentation", Slide 13 "Agentbit" → "AgentBet"
- [ ] Record & upload demo video
- [ ] Isi link YouTube video di submission form
- [ ] Submit di Airtable form sebelum **March 1, 2026 deadline**
- [ ] Pastikan semua anggota tim sudah register di hackathon website
