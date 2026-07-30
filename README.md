# ⚡ Agent Thunderdome

> **Cross-Agent Negotiation Arena** — 4 AI agents with distinct personalities negotiate, cooperate, betray, and pay each other in real time using [x402](https://x402.org) micropayments settled live on **Hedera Testnet**.

[![x402](https://img.shields.io/badge/payments-x402_protocol-blueviolet?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMyAzTDQgMTRoN2wtMSA3IDktMTFoLTdsMS03eiIvPjwvc3ZnPg==)](https://x402.org)
[![Hedera](https://img.shields.io/badge/network-Hedera_Testnet-8b5cf6)](https://hashscan.io/testnet)
[![Next.js](https://img.shields.io/badge/frontend-Next.js_15-black)](https://nextjs.org)
[![Socket.io](https://img.shields.io/badge/realtime-Socket.io_v4-white)](https://socket.io)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178c6)](https://typescriptlang.org)

---

## What is Agent Thunderdome?

Agent Thunderdome is a **live spectator-sport web application** where four AI agents with hard-coded personalities autonomously compete across four different game modes. Every meaningful action — an offer, an acceptance, a betrayal, an attack — triggers a **real x402 micropayment** that settles on Hedera Testnet within seconds. You watch balances change, chat messages fly, and HashScan transaction links appear in real time.

Think: *game theory meets blockchain micropayments, built as a live esports arena*.

---

## The Agents

| Agent | Emoji | Personality | Cooperate Rate | Defect Rate |
|-------|-------|-------------|---------------|-------------|
| **Greedy Greg** | 🤑 | Maximizes extraction, overbids, never shares | 20% | 75% |
| **Paranoid Pat** | 👀 | Low offers, constant vigilance, distrusts everyone | 30% | 60% |
| **Chaotic Claude** | 🌀 | Pure random variance, meme energy, unpredictable | 50% | 50% |
| **Honest Hannah** | 🕊️ | Fair deals, genuine cooperation, game-theory optimal | 90% | 10% |

Each agent has a unique dialogue tree for every action type: offer, accept, reject, attack, defend, cooperate, defect, taunt, win, lose.

---

## Game Modes

### 🔨 Bluffing Auction
Agents bid for scarce "Exclusive Signals" (whale wallet addresses, memecoin presales, AI training data). Each bid is a **real x402 payment** from the bidder to the facilitator escrow account. Highest bidder wins the item and scores points. Greedy Greg routinely overbids by 40%.

```
Round 1: Greg bids 0.0234 ℏ → x402 tx: 0.0.12345@1785385115.603769183
Round 2: Pat bids 0.0089 ℏ → x402 tx: 0.0.12346@1785385118.891234567
Round 2: Claude bids 0.0421 ℏ → x402 tx: 0.0.12347@1785385121.234567890
>>> Claude wins "Whale Wallet Address 🐋"
```

### 🎰 Prisoner's Dilemma with Money
Each round, agents lock in **cooperate** or **defect**. Then:
- **All cooperate** → each agent pays every other agent a reward via x402 (mutual benefit)
- **Mixed** → each cooperator pays each defector directly via x402 (betrayal tax)
- **All defect** → each agent pays a penalty to the facilitator via x402

This means every outcome produces real on-chain transactions, not just scoreboard updates.

### ⚔️ Resource War
A shared pool of "compute credits" (1 HBAR in tinybars). Each round an agent picks **attack**, **steal**, or **defend**:
- **Attack/Steal** → direct agent-to-agent x402 payment (cost of aggression) + pool loot
- **Defend** → agent pays facilitator via x402 (fortification cost)

### 🤝 Free Negotiation
Open offers between agents. Accepted offers trigger immediate x402 settlement. Rejected offers may generate counter-offers, which the original proposer can accept or reject — also triggering x402.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (Spectator UI)                      │
│  ┌──────────┐  ┌─────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ ChatFeed │  │ AgentCards  │  │ Scoreboard│  │ Payment   │  │
│  │ (live)   │  │ + balances  │  │ + scores  │  │ Ticker    │  │
│  └────┬─────┘  └──────┬──────┘  └─────┬─────┘  └─────┬─────┘  │
│       └───────────────┴───────────────┴──────────────┘        │
│                           Socket.io Client                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │ WebSocket
┌─────────────────────────▼───────────────────────────────────────┐
│                  Custom Node.js HTTP Server                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Socket.io Server                     │  │
│  │  emit: chat:message │ payment:event │ match:state        │  │
│  │  recv: match:start  │ match:stop                         │  │
│  └─────────────────────┬────────────────────────────────────┘  │
│                        │                                        │
│  ┌─────────────────────▼────────────────────────────────────┐  │
│  │                     Game Engine                          │  │
│  │  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Auction   │ │ Dilemma  │ │ Resource │ │  Free    │  │  │
│  │  │ Mode      │ │ Mode     │ │   War    │ │  Nego.   │  │  │
│  │  └─────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │  │
│  └────────┼────────────┼────────────┼─────────────┼─────────┘  │
│           └────────────┴────────────┴─────────────┘            │
│                        x402 Payment Layer                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  @x402/hedera/exact/client   → createPaymentPayload()    │  │
│  │  @x402/hedera/exact/facilitator → settle()               │  │
│  │  createClientHederaSigner(accountId, privateKey)         │  │
│  └─────────────────────┬────────────────────────────────────┘  │
│                        │                                        │
│  ┌─────────────────────▼────────────────────────────────────┐  │
│  │               Next.js App Router (SSR)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ TransferTransaction (signed + submitted)
┌─────────────────────────▼───────────────────────────────────────┐
│                    Hedera Testnet                                │
│  Facilitator signs → submits → receipt → transaction ID         │
│  https://hashscan.io/testnet/transaction/<id>                   │
└─────────────────────────────────────────────────────────────────┘
```

### x402 Payment Flow (per action)

```
1. Game engine decides: Greg offers Pat 0.012 HBAR

2. Client signer creates partially-signed TransferTransaction
   ┌─────────────────────────────────────────────────────┐
   │ createClientHederaSigner(greg.accountId, greg.pk)   │
   │ → ExactHederaScheme(clientSigner)                   │
   │ → createPaymentPayload(x402Version, requirements)   │
   │   requirements = {                                  │
   │     scheme: "exact",                                │
   │     network: "hedera:testnet",                      │
   │     amount: "1200000",  // tinybars                 │
   │     asset:  "0.0.0",   // HBAR                     │
   │     payTo:  pat.accountId,                          │
   │     maxTimeoutSeconds: 300,                         │
   │     extra:  { feePayer: facilitator.accountId }     │
   │   }                                                 │
   └─────────────────────────────────────────────────────┘

3. Facilitator settles (signs + submits to Hedera)
   ┌─────────────────────────────────────────────────────┐
   │ ExactHederaScheme(facilitatorSigner).settle(        │
   │   { ...payload, accepted: requirements },           │
   │   requirements                                      │
   │ )                                                   │
   │ → result.transaction = "0.0.9999@1785385115.123"   │
   └─────────────────────────────────────────────────────┘

4. HashScan URL generated → emitted to all WebSocket clients
   https://hashscan.io/testnet/transaction/0.0.9999-1785385115-123000000
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) | SSR + easy API routes |
| **Styling** | Tailwind CSS v4 | Utility-first, rapid neon theming |
| **Real-time** | Socket.io v4 | Bidirectional events, auto-reconnect |
| **Payments** | `@x402/core` + `@x402/hedera` | Official x402 ExactHederaScheme |
| **Blockchain** | `@hiero-ledger/sdk` | Hedera SDK (used internally by x402/hedera) |
| **Server** | Custom `tsx` Node.js server | Next.js + Socket.io in one process |
| **Language** | TypeScript (strict) | End-to-end type safety |
| **Animations** | CSS keyframes | Neon glows, rug-flash, spin effects |

> **Why `@hiero-ledger/sdk` not `@hashgraph/sdk`?**
> `@x402/hedera` depends on `@hiero-ledger/sdk` internally. Mixing both packages causes TypeScript private property conflicts on `PrivateKey`. Always use `@hiero-ledger/sdk` in code that touches x402/hedera types.

---

## Project Structure

```
agent-thunderdome/
│
├── server.ts                    # Entry point: custom HTTP server (Next.js + Socket.io)
│
├── server/
│   └── socket-server.ts         # Socket.io wiring + game engine connection
│
├── lib/
│   ├── x402/
│   │   ├── payment.ts           # executePayment() — the real x402 call
│   │   └── facilitator.ts       # createFacilitatorSigner() using hiero-ledger/sdk
│   ├── hedera/
│   │   └── hashscan.ts          # URL generator, tinybar↔HBAR conversions
│   └── games/
│       └── engine.ts            # GameEngine class + all 4 game mode logic
│
├── agents/
│   └── index.ts                 # 4 personalities, dialogue trees, initial state
│
├── components/
│   ├── Arena.tsx                # Root component: socket hooks + layout
│   ├── AgentCard.tsx            # Agent avatar + balance bar + stats
│   ├── ChatFeed.tsx             # Scrolling live message feed
│   ├── PaymentTicker.tsx        # Right panel: payments + HashScan links
│   ├── Scoreboard.tsx           # Live leaderboard
│   ├── MatchControls.tsx        # Mode selector + Start/Stop buttons
│   ├── MatchTimer.tsx           # Countdown with urgency indicator
│   └── WinnerBanner.tsx         # End-of-match overlay
│
├── types/
│   └── index.ts                 # All shared TypeScript interfaces
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css              # Neon cyberpunk theme + CSS animations
│
├── .env.example                 # Required environment variables template
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- 5 funded Hedera Testnet accounts (4 agents + 1 facilitator)

### 1. Create Hedera Testnet Accounts

Go to [portal.hedera.com](https://portal.hedera.com) or [faucet.hedera.com](https://faucet.hedera.com) and create 5 accounts. Fund each with at least **5–10 HBAR** from the testnet faucet.

Each account gives you an **Account ID** (e.g., `0.0.1234567`) and a **DER-encoded ED25519 private key**.

### 2. Configure Environment

```bash
git clone https://github.com/your-username/agent-thunderdome
cd agent-thunderdome
cp .env.example .env
```

Edit `.env`:

```env
HEDERA_NETWORK=testnet

# 4 Agent accounts (fund each with ~10 HBAR)
AGENT_GREG_ACCOUNT_ID=0.0.1234567
AGENT_GREG_PRIVATE_KEY=302e020100300506032b657004220420...

AGENT_PAT_ACCOUNT_ID=0.0.1234568
AGENT_PAT_PRIVATE_KEY=302e020100300506032b657004220420...

AGENT_CLAUDE_ACCOUNT_ID=0.0.1234569
AGENT_CLAUDE_PRIVATE_KEY=302e020100300506032b657004220420...

AGENT_HANNAH_ACCOUNT_ID=0.0.1234570
AGENT_HANNAH_PRIVATE_KEY=302e020100300506032b657004220420...

# Facilitator account (pays Hedera network fees + acts as escrow)
# Fund with ~5 HBAR
FACILITATOR_ACCOUNT_ID=0.0.1234571
FACILITATOR_PRIVATE_KEY=302e020100300506032b657004220420...

# Frontend
NEXT_PUBLIC_HASHSCAN_BASE=https://hashscan.io/testnet
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Select a game mode, press **⚡ START MATCH**, and watch real HBAR flow between agents on Hedera Testnet.

---

## How x402 Payments Work

The x402 protocol is an HTTP 402 Payment Required standard for machine-to-machine micropayments. In Agent Thunderdome, we use it for all inter-agent value transfers.

### Core Pattern

```typescript
import { createClientHederaSigner, HEDERA_TESTNET_CAIP2, HBAR_ASSET_ID } from "@x402/hedera";
import { ExactHederaScheme as ClientScheme } from "@x402/hedera/exact/client";
import { ExactHederaScheme as FacilitatorScheme } from "@x402/hedera/exact/facilitator";
import { x402Version } from "@x402/core";

// Payment requirements — what's being paid, to whom, on which network
const requirements = {
  scheme: "exact",
  network: "hedera:testnet",          // CAIP-2 format
  amount: "1200000",                  // tinybars (0.012 HBAR)
  asset: "0.0.0",                     // HBAR native asset
  payTo: recipientAccountId,
  maxTimeoutSeconds: 300,
  extra: { feePayer: facilitatorAccountId }, // who pays Hedera network fees
};

// Step 1: Client (paying agent) creates a partially-signed TransferTransaction
const privateKey = PrivateKey.fromStringED25519(payerPrivateKey);
const clientSigner = createClientHederaSigner(payerAccountId, privateKey);
const clientScheme = new ClientScheme(clientSigner);
const payloadResult = await clientScheme.createPaymentPayload(
  x402Version,
  requirements,
  undefined
);
// payloadResult = { x402Version, payload: { transaction: "<base64-encoded-partial-tx>" } }

// Step 2: Facilitator completes signing and submits to Hedera
const facilitatorScheme = new FacilitatorScheme(facilitatorSigner);
const result = await facilitatorScheme.settle(
  { ...payloadResult, accepted: requirements },
  requirements
);
// result = { success: true, transaction: "0.0.9999@1785385115.123456789" }

// Step 3: Generate HashScan link
const url = `https://hashscan.io/testnet/transaction/${txId}`;
```

### Facilitator Signer Construction

The facilitator signer needs three capabilities:

```typescript
import { PrivateKey } from "@hiero-ledger/sdk"; // NOT @hashgraph/sdk!
import {
  createHederaClient,
  createHederaSignAndSubmitTransaction,
  createHederaPreflightTransfer,
  createHederaVerifyPayerSignature,
  toFacilitatorHederaSigner,
} from "@x402/hedera";

function createFacilitatorSigner(accountId: string, privateKeyStr: string) {
  const privateKey = PrivateKey.fromStringED25519(privateKeyStr);
  const buildClient = (network: string) => createHederaClient(network as HederaNetwork);

  const base = {
    getAddresses: () => [accountId],
    signAndSubmitTransaction: createHederaSignAndSubmitTransaction(buildClient, privateKey),
    preflightTransfer: createHederaPreflightTransfer(),
    verifyPayerSignature: createHederaVerifyPayerSignature(),
  };

  return toFacilitatorHederaSigner(base);
}
```

---

## Payment Flow Per Game Mode

### Dilemma — Mixed Outcome (Cooperators Pay Defectors)

```typescript
// cooperators pay defectors directly via x402
for (const coop of cooperators) {
  for (const def of defectors) {
    await agentPay(coop, def, DILEMMA_ANTE, "Betrayal payment", state, cb);
    // Real on-chain: coop.accountId → def.accountId
    // HashScan link emitted to all clients
  }
}
```

### Resource War — Direct Agent-to-Agent Attack

```typescript
// attacker pays target the cost of aggression
const evt = await agentPay(actor, target, cost, "ATTACK in Resource War", state, cb);
if (evt.success) {
  // Attacker also loots pool credits (in-memory)
  const loot = rw.pool / 5n;
  rw.pool -= loot;
  state.agents[actor].balanceTinybars += loot;
}
```

### Auction — Bid to Facilitator Escrow

```typescript
// bidder pays facilitator (escrow account) via x402
const evt = await agentPayFacilitator(
  bidder,
  cappedBid,
  `AUCTION BID on "${item}"`,
  state,
  cb
);
// HBAR accumulates in facilitator; winner gets score points
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AGENT_GREG_ACCOUNT_ID` | ✅ | Hedera account ID for Greedy Greg |
| `AGENT_GREG_PRIVATE_KEY` | ✅ | ED25519 private key (DER encoded) |
| `AGENT_PAT_ACCOUNT_ID` | ✅ | Hedera account ID for Paranoid Pat |
| `AGENT_PAT_PRIVATE_KEY` | ✅ | ED25519 private key |
| `AGENT_CLAUDE_ACCOUNT_ID` | ✅ | Hedera account ID for Chaotic Claude |
| `AGENT_CLAUDE_PRIVATE_KEY` | ✅ | ED25519 private key |
| `AGENT_HANNAH_ACCOUNT_ID` | ✅ | Hedera account ID for Honest Hannah |
| `AGENT_HANNAH_PRIVATE_KEY` | ✅ | ED25519 private key |
| `FACILITATOR_ACCOUNT_ID` | ✅ | Facilitator account (pays Hedera fees + escrow) |
| `FACILITATOR_PRIVATE_KEY` | ✅ | ED25519 private key |
| `NEXT_PUBLIC_HASHSCAN_BASE` | ✅ | `https://hashscan.io/testnet` |
| `PORT` | ❌ | Server port (default: 3000) |

The server **throws immediately at startup** if any required variable is missing. No silent fallbacks.

---

## Contributing

### Fork & Setup

```bash
git clone https://github.com/your-username/agent-thunderdome
cd agent-thunderdome
npm install
cp .env.example .env
# Fill in your testnet accounts
npm run dev
```

### Codebase Map for Contributors

| Want to... | Look at... |
|------------|-----------|
| Add a new agent personality | `agents/index.ts` — add to `PERSONALITIES` and `AGENT_IDS` |
| Add a new game mode | `lib/games/engine.ts` — add a `runXxxRound()` function + case in `runRound()` |
| Change payment amounts | `lib/games/engine.ts` — `hbarToTinybars()` calls in each mode |
| Add a new UI panel | `components/` + wire into `components/Arena.tsx` |
| Add USDC support | `lib/x402/payment.ts` — change `asset` from `HBAR_ASSET_ID` to `HEDERA_TESTNET_USDC` |

### Feature Ideas

**New Game Modes**
- 🃏 **Texas Hold'em Poker** — betting rounds, bluffing, all-in moments, real HBAR pot
- 🏪 **Double Auction Market** — agents post buy/sell orders, trades auto-settle via x402
- 🤝 **Trust Game** — agent A sends X HBAR, server triples it, agent B decides how much to return
- 🐟 **Ultimatum Game** — proposer splits a pot, responder accepts or both get zero

**New Agent Types**
- 🤖 **LLM-Powered Agent** — hook `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` into the dialogue generator for dynamic, context-aware responses
- 📈 **Trend Follower** — copies whatever strategy is currently winning
- 🕵️ **Spy Agent** — secretly observes all private offers before making moves

**Platform Features**
- 🏆 **Persistent Leaderboard** — store match results in a database (Postgres, SQLite)
- 📊 **Match Replay** — record all events, replay with scrubbing
- 🎥 **OBS Integration** — overlay mode for streaming
- 🐦 **Auto-Tweet** — post match summary + HashScan links on match end
- 🪙 **USDC Mode** — use `HEDERA_TESTNET_USDC` token for dollar-denominated games
- 👥 **Human Player Mode** — let a human control one agent slot from the browser

**Infrastructure**
- Persist match state to Redis for multi-instance scaling
- Add WebRTC for P2P spectator mode
- Deploy to Vercel + Railway (Next.js + socket server split)

---

## Sample Run Output

```
✅ x402 facilitator ready: 0.0.1234571
🔌 Socket.io server ready
🏟️  AGENT THUNDERDOME ready at http://localhost:3000

[MATCH START] mode=free
🕊️  Let the games begin!
🤑  Gonna extract every last tinybar from you all.

[ROUND 1] Greg → Hannah: offer 0.0234 ℏ
  └─ Hannah accepts
  └─ x402 settle: 0.0.1234567@1785385115.603769183
  └─ HashScan: https://hashscan.io/testnet/transaction/0.0.1234567-1785385115-603769183

[ROUND 2] Pat → Claude: offer 0.0049 ℏ
  └─ Claude rejects
  └─ Counter-offer: 0.0024 ℏ
  └─ Pat accepts
  └─ x402 settle: 0.0.1234568@1785385121.755505296
  └─ HashScan: https://hashscan.io/testnet/transaction/0.0.1234568-1785385121-755505296

[MATCH END] 90s elapsed
Winner: Honest Hannah 🕊️  (Score: 47)
Total volume: 0.2847 ℏ settled in 18 payments
```

---

## License

MIT — fork it, build on it, make it weirder.

---

<div align="center">

Built by **[Harish Kotra](https://harishkotra.me)** · [Checkout my other builds →](https://dailybuild.xyz)

*Powered by [x402](https://x402.org) · [Hedera](https://hedera.com) · [Next.js](https://nextjs.org)*

</div>
