import { v4 as uuidv4 } from "uuid";
import type {
  MatchState,
  AgentId,
  GameMode,
  ChatMessage,
  PaymentEvent,
  AuctionState,
  DilemmaState,
  ResourceWarState,
  FreeState,
} from "../../types";
import {
  AGENT_IDS,
  PERSONALITIES,
  createInitialAgent,
  randomDialogue,
} from "../../agents";
import { executePayment, getFacilitatorAccount } from "../x402/payment";
import { hbarToTinybars } from "../hedera/hashscan";

export type GameEventCallback = (event: {
  type: "chat" | "payment" | "state";
  data: unknown;
}) => void;

export interface AgentWallet {
  accountId: string;
  privateKey: string;
}

// ─── Env validation (throw loudly if keys missing) ──────────────────────────

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

function getWallet(id: AgentId): AgentWallet {
  const KEY_MAP: Record<AgentId, [string, string]> = {
    greg:   ["AGENT_GREG_ACCOUNT_ID",   "AGENT_GREG_PRIVATE_KEY"],
    pat:    ["AGENT_PAT_ACCOUNT_ID",    "AGENT_PAT_PRIVATE_KEY"],
    claude: ["AGENT_CLAUDE_ACCOUNT_ID", "AGENT_CLAUDE_PRIVATE_KEY"],
    hannah: ["AGENT_HANNAH_ACCOUNT_ID", "AGENT_HANNAH_PRIVATE_KEY"],
  };
  const [accKey, pkKey] = KEY_MAP[id];
  return {
    accountId: requireEnv(accKey),
    privateKey: requireEnv(pkKey),
  };
}

// ─── Core helpers ────────────────────────────────────────────────────────────

async function x402Pay(
  fromId: AgentId,
  toAccountId: string,
  amountTinybars: bigint,
  action: string,
  state: MatchState,
  cb: GameEventCallback,
  toAgentId?: AgentId
): Promise<PaymentEvent> {
  const fromAgent = state.agents[fromId];

  const result = await executePayment(
    getWallet(fromId),
    toAccountId,
    amountTinybars
  );

  const evt: PaymentEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    fromAgent: fromId,
    toAgent: toAgentId ?? fromId, // self if paying to non-agent (facilitator)
    amountTinybars,
    amountHbar: result.amountHbar,
    action,
    transactionId: result.transactionId,
    hashscanUrl: result.hashscanUrl,
    success: result.success,
    errorMessage: result.errorMessage,
  };

  if (result.success) {
    state.agents[fromId].balanceTinybars -= amountTinybars;
    state.agents[fromId].totalPaid += amountTinybars;
    if (toAgentId) {
      state.agents[toAgentId].balanceTinybars += amountTinybars;
      state.agents[toAgentId].totalReceived += amountTinybars;
    }
    state.totalVolumeTinybars += amountTinybars;
  } else {
    console.error(`x402 payment failed [${fromId} → ${toAccountId}]: ${result.errorMessage}`);
  }

  state.paymentEvents.push(evt);
  cb({ type: "payment", data: evt });
  return evt;
}

// Agent-to-agent x402 payment
async function agentPay(
  fromId: AgentId,
  toId: AgentId,
  amountTinybars: bigint,
  action: string,
  state: MatchState,
  cb: GameEventCallback
): Promise<PaymentEvent> {
  return x402Pay(
    fromId,
    state.agents[toId].accountId,
    amountTinybars,
    action,
    state,
    cb,
    toId
  );
}

// Agent pays facilitator (fees/escrow)
async function agentPayFacilitator(
  fromId: AgentId,
  amountTinybars: bigint,
  action: string,
  state: MatchState,
  cb: GameEventCallback
): Promise<PaymentEvent> {
  return x402Pay(
    fromId,
    getFacilitatorAccount(),
    amountTinybars,
    action,
    state,
    cb,
    undefined
  );
}

function addChat(
  agentId: AgentId,
  text: string,
  type: ChatMessage["type"],
  state: MatchState,
  cb: GameEventCallback
): void {
  const msg: ChatMessage = {
    id: uuidv4(),
    timestamp: Date.now(),
    agentId,
    text,
    type,
  };
  state.chatMessages.push(msg);
  if (state.chatMessages.length > 200) state.chatMessages.shift();
  cb({ type: "chat", data: msg });
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function otherAgents(id: AgentId): AgentId[] {
  return AGENT_IDS.filter((a) => a !== id);
}

function hasFunds(agentId: AgentId, amount: bigint, state: MatchState): boolean {
  return state.agents[agentId].balanceTinybars >= amount;
}

// ─── Auction Mode ────────────────────────────────────────────────────────────
// Each bid is a real x402 payment: bidder → facilitator (escrow).
// Winner gets score; the HBAR accumulates in the facilitator's account.

const AUCTION_ITEMS = [
  "Exclusive Alpha Signal 🎯",
  "Whale Wallet Address 🐋",
  "Secret Memecoin Presale 🚀",
  "1TB AI Training Data 🤖",
  "Rare Blockchain Receipt 📜",
  "Access to Greg's Portfolio 💰",
];

async function runAuctionRound(state: MatchState, cb: GameEventCallback): Promise<void> {
  const auctionState = state.modeState as AuctionState;

  if (auctionState.phase === "bidding") {
    const bidder = pickRandom(AGENT_IDS);
    const p = PERSONALITIES[bidder];
    const base = auctionState.currentHighBid + hbarToTinybars(0.005);
    const bid = BigInt(Math.round(Number(base) * p.offerMultiplier));
    const cappedBid = bid > state.agents[bidder].balanceTinybars / 2n
      ? state.agents[bidder].balanceTinybars / 2n
      : bid;

    if (!hasFunds(bidder, cappedBid, state) || cappedBid <= 0n) {
      addChat(bidder, "💸 Can't bid — insufficient HBAR!", "system", state, cb);
      cb({ type: "state", data: state });
      return;
    }

    addChat(
      bidder,
      `${randomDialogue(bidder, "offer")} — BID: ${(Number(cappedBid) / 1e8).toFixed(4)} ℏ for "${auctionState.currentItem}"`,
      "offer",
      state,
      cb
    );

    // Real x402: bidder pays facilitator (escrow)
    const evt = await agentPayFacilitator(bidder, cappedBid, `AUCTION BID on "${auctionState.currentItem}"`, state, cb);

    if (evt.success && cappedBid > auctionState.currentHighBid) {
      auctionState.currentHighBid = cappedBid;
      auctionState.currentHighBidder = bidder;
      state.agents[bidder].score += 5;
    }

    if (Math.random() < 0.25) auctionState.phase = "resolution";
  } else {
    // Resolution
    if (auctionState.currentHighBidder) {
      const winner = auctionState.currentHighBidder;
      state.agents[winner].score += 20;
      addChat(
        winner,
        `${randomDialogue(winner, "win")} 🏆 WON "${auctionState.currentItem}"!`,
        "accept",
        state,
        cb
      );
      addChat(
        pickRandom(otherAgents(winner)),
        randomDialogue(pickRandom(otherAgents(winner)), "taunt"),
        "taunt",
        state,
        cb
      );
    }

    // Next item
    auctionState.currentItem = pickRandom(AUCTION_ITEMS);
    auctionState.currentHighBid = hbarToTinybars(0.001);
    auctionState.currentHighBidder = undefined;
    auctionState.phase = "bidding";
    auctionState.itemsSold++;
    state.round++;
  }

  cb({ type: "state", data: state });
}

// ─── Prisoner's Dilemma Mode ─────────────────────────────────────────────────
// Choosing phase: agents lock in choice + pay ante to each other.
// Reveal phase:
//   - All cooperate: each agent pays every other agent a reward (mutual benefit)
//   - Mix: each cooperator pays each defector (punished for trusting)
//   - All defect: each agent pays a penalty to the facilitator

const DILEMMA_ANTE = hbarToTinybars(0.005);
const DILEMMA_PENALTY = hbarToTinybars(0.003);

async function runDilemmaRound(state: MatchState, cb: GameEventCallback): Promise<void> {
  const ds = state.modeState as DilemmaState;

  if (ds.phase === "choosing") {
    for (const agentId of AGENT_IDS) {
      const p = PERSONALITIES[agentId];
      const choice = Math.random() < p.cooperateProbability ? "cooperate" : "defect";
      ds.choices[agentId] = choice;
      addChat(
        agentId,
        `${randomDialogue(agentId, choice)} (locked in)`,
        choice === "cooperate" ? "offer" : "defect",
        state,
        cb
      );
    }
    ds.phase = "reveal";
  } else {
    const cooperators = AGENT_IDS.filter((id) => ds.choices[id] === "cooperate");
    const defectors   = AGENT_IDS.filter((id) => ds.choices[id] === "defect");

    if (defectors.length === 0) {
      // All cooperate — everyone pays everyone a small reward (real x402, mutual benefit)
      addChat("hannah", "🤝 ALL COOPERATED! Sharing rewards via x402...", "accept", state, cb);
      for (const payer of AGENT_IDS) {
        const others = otherAgents(payer);
        const share = hbarToTinybars(0.004);
        for (const receiver of others) {
          if (hasFunds(payer, share, state)) {
            await agentPay(payer, receiver, share, "Cooperation reward", state, cb);
          }
        }
        state.agents[payer].score += 15;
      }
    } else if (defectors.length === AGENT_IDS.length) {
      // All defect — everyone pays a penalty to the facilitator
      addChat("greg", "💀 EVERYONE DEFECTED. PAYING PENALTY.", "defect", state, cb);
      for (const agentId of AGENT_IDS) {
        if (hasFunds(agentId, DILEMMA_PENALTY, state)) {
          await agentPayFacilitator(agentId, DILEMMA_PENALTY, "All-defect penalty", state, cb);
        }
        addChat(agentId, randomDialogue(agentId, "lose"), "system", state, cb);
      }
    } else {
      // Mixed — cooperators pay defectors directly (real x402, betrayal tax)
      const payPerCooperator = DILEMMA_ANTE;
      for (const coop of cooperators) {
        for (const def of defectors) {
          if (hasFunds(coop, payPerCooperator, state)) {
            await agentPay(coop, def, payPerCooperator, "Betrayal payment (cooperator → defector)", state, cb);
          }
        }
        addChat(coop, randomDialogue(coop, "lose"), "system", state, cb);
      }
      for (const def of defectors) {
        state.agents[def].score += 25;
        addChat(def, `${randomDialogue(def, "defect")} 💀 STOLE FROM COOPERATORS!`, "defect", state, cb);
      }
    }

    // Reset
    ds.choices = { greg: null, pat: null, claude: null, hannah: null };
    ds.pot = 0n;
    ds.phase = "choosing";
    ds.round++;
    state.round = ds.round;
  }

  cb({ type: "state", data: state });
}

// ─── Resource War Mode ───────────────────────────────────────────────────────
// Every action is a direct agent-to-agent x402 payment.
// Attack/Steal: attacker pays target (cost of aggression).
// Defend: agent pays facilitator (fortification cost).

async function runResourceWarRound(state: MatchState, cb: GameEventCallback): Promise<void> {
  const rw = state.modeState as ResourceWarState;
  const actions: Array<"attack" | "defend" | "steal"> = ["attack", "defend", "steal"];

  const actor  = pickRandom(AGENT_IDS);
  const target = pickRandom(otherAgents(actor));
  const action = pickRandom(actions);
  const cost   = hbarToTinybars(0.005 + Math.random() * 0.008);

  if (!hasFunds(actor, cost, state)) {
    addChat(actor, "💸 Too broke to act...", "system", state, cb);
    cb({ type: "state", data: state });
    return;
  }

  const dialogueKey = action === "defend" ? "defend" : "attack";
  addChat(
    actor,
    randomDialogue(actor, dialogueKey),
    action === "attack" || action === "steal" ? "threat" : "offer",
    state,
    cb
  );

  if (action === "defend") {
    // Agent pays facilitator to fortify
    const evt = await agentPayFacilitator(actor, cost, "DEFEND — fortification payment", state, cb);
    if (evt.success) {
      rw.defenses[actor] = (rw.defenses[actor] ?? 0n) + cost;
      state.agents[actor].score += 3;
    }
  } else {
    // Attack or Steal — direct agent-to-agent x402
    const actionLabel = action === "steal" ? "STEAL" : "ATTACK";
    const evt = await agentPay(actor, target, cost, `${actionLabel} in Resource War`, state, cb);

    if (evt.success) {
      // Pool looting
      const loot = rw.pool / 5n;
      if (loot > 0n && rw.pool >= loot) {
        rw.pool -= loot;
        // Loot credited to actor (already above HBAR went to target as cost, pool loot is score/credit)
        state.agents[actor].balanceTinybars += loot;
        state.totalVolumeTinybars += loot;
        state.agents[actor].score += 10;
        addChat(actor, `⚔️ Looted ${(Number(loot) / 1e8).toFixed(4)} ℏ from the resource pool!`, "accept", state, cb);
        addChat(target, randomDialogue(target, "lose"), "system", state, cb);
      }
    }
  }

  state.round++;
  cb({ type: "state", data: state });
}

// ─── Free Negotiation Mode ───────────────────────────────────────────────────
// Accepted offers = direct x402 payments. Rejected = no payment. Simple.

async function runFreeNegotiationRound(state: MatchState, cb: GameEventCallback): Promise<void> {
  const proposer = pickRandom(AGENT_IDS);
  const receiver = pickRandom(otherAgents(proposer));
  const p = PERSONALITIES[proposer];
  const base = hbarToTinybars(0.002 + Math.random() * 0.015);
  const amount = BigInt(Math.round(Number(base) * p.offerMultiplier));

  if (!hasFunds(proposer, amount, state) || amount <= 0n) {
    cb({ type: "state", data: state });
    return;
  }

  addChat(
    proposer,
    `${randomDialogue(proposer, "offer")} — offering ${(Number(amount) / 1e8).toFixed(4)} ℏ to ${state.agents[receiver].emoji} ${state.agents[receiver].name}`,
    "offer",
    state,
    cb
  );

  const rp = PERSONALITIES[receiver];
  const accepted = Math.random() < rp.cooperateProbability;

  if (accepted) {
    addChat(receiver, randomDialogue(receiver, "accept"), "accept", state, cb);
    const evt = await agentPay(proposer, receiver, amount, "Offer accepted", state, cb);
    if (evt.success) {
      state.agents[receiver].score += 5;
      state.agents[proposer].score += 3;
    }
  } else {
    addChat(receiver, randomDialogue(receiver, "reject"), "offer", state, cb);
    if (Math.random() < 0.4) {
      const counter = amount / 2n;
      addChat(receiver, `🔄 Counter-offer: ${(Number(counter) / 1e8).toFixed(4)} ℏ`, "offer", state, cb);
      // Counter-offer: proposer can accept or reject
      if (Math.random() < 0.5 && hasFunds(proposer, counter, state)) {
        addChat(proposer, randomDialogue(proposer, "accept"), "accept", state, cb);
        const evt = await agentPay(proposer, receiver, counter, "Counter-offer accepted", state, cb);
        if (evt.success) {
          state.agents[receiver].score += 3;
          state.agents[proposer].score += 2;
        }
      } else {
        addChat(proposer, randomDialogue(proposer, "reject"), "offer", state, cb);
      }
    }
  }

  state.round++;
  cb({ type: "state", data: state });
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export class GameEngine {
  private state: MatchState | null = null;
  private running = false;
  private timer: NodeJS.Timeout | null = null;
  private cb: GameEventCallback;

  constructor(cb: GameEventCallback) {
    this.cb = cb;
  }

  createMatch(mode: GameMode): MatchState {
    const agents = Object.fromEntries(
      AGENT_IDS.map((id) => [id, createInitialAgent(id, getWallet(id).accountId)])
    ) as MatchState["agents"];

    return {
      id: uuidv4(),
      mode,
      status: "idle",
      durationSeconds: 90,
      agents,
      chatMessages: [],
      paymentEvents: [],
      totalVolumeTinybars: 0n,
      round: 0,
      modeState: this.createModeState(mode),
    };
  }

  private createModeState(mode: GameMode): MatchState["modeState"] {
    switch (mode) {
      case "auction":
        return {
          currentItem: pickRandom(AUCTION_ITEMS),
          currentHighBid: hbarToTinybars(0.001),
          currentHighBidder: undefined,
          itemsSold: 0,
          phase: "bidding",
        } as AuctionState;

      case "dilemma":
        return {
          round: 0,
          choices: { greg: null, pat: null, claude: null, hannah: null },
          pot: 0n,
          phase: "choosing",
        } as DilemmaState;

      case "resource-war":
        return {
          pool: hbarToTinybars(1.0),
          defenses: { greg: 0n, pat: 0n, claude: 0n, hannah: 0n },
          phase: "action",
        } as ResourceWarState;

      case "free":
      default:
        return { activeOffers: [] } as FreeState;
    }
  }

  async startMatch(mode: GameMode): Promise<MatchState> {
    // Validate all required env vars up front — fail fast
    for (const id of AGENT_IDS) getWallet(id);
    getFacilitatorAccount();

    if (this.running) this.stopMatch();

    this.state = this.createMatch(mode);
    this.state.status = "running";
    this.state.startTime = Date.now();
    this.running = true;

    addChat("hannah", "🕊️ Let the games begin! May the best agent win.", "system", this.state, this.cb);
    addChat("greg", "🤑 Gonna extract every last tinybar from you all.", "taunt", this.state, this.cb);
    addChat("pat", "👀 I'm watching ALL of you.", "taunt", this.state, this.cb);
    addChat("claude", "🌀 *loads chaos* let's goooo", "taunt", this.state, this.cb);

    this.cb({ type: "state", data: this.state });
    this.scheduleNextRound();
    return this.state;
  }

  private scheduleNextRound(): void {
    if (!this.running || !this.state) return;

    // Slightly longer delay to give Hedera time to process before next round
    const delay = 2000 + Math.random() * 2500;
    this.timer = setTimeout(async () => {
      if (!this.running || !this.state) return;

      const elapsed = (Date.now() - (this.state.startTime ?? Date.now())) / 1000;
      if (elapsed >= this.state.durationSeconds) {
        this.endMatch();
        return;
      }

      await this.runRound();
      this.scheduleNextRound();
    }, delay);
  }

  private async runRound(): Promise<void> {
    if (!this.state) return;
    try {
      switch (this.state.mode) {
        case "auction":       await runAuctionRound(this.state, this.cb); break;
        case "dilemma":       await runDilemmaRound(this.state, this.cb); break;
        case "resource-war":  await runResourceWarRound(this.state, this.cb); break;
        case "free": default: await runFreeNegotiationRound(this.state, this.cb); break;
      }

      if (Math.random() < 0.3) {
        const taunter = pickRandom(AGENT_IDS);
        addChat(taunter, randomDialogue(taunter, "taunt"), "taunt", this.state, this.cb);
      }
    } catch (err) {
      console.error("Round error:", err instanceof Error ? err.message : err);
    }
  }

  private endMatch(): void {
    if (!this.state) return;
    this.running = false;
    if (this.timer) clearTimeout(this.timer);

    this.state.status = "ended";
    this.state.endTime = Date.now();

    const winner = AGENT_IDS.reduce((best, id) =>
      this.state!.agents[id].score > this.state!.agents[best].score ? id : best
    );
    this.state.winner = winner;
    this.state.agents[winner].wins++;

    addChat(winner, `${randomDialogue(winner, "win")} 🏆 MATCH WINNER!`, "accept", this.state, this.cb);
    this.cb({ type: "state", data: this.state });
  }

  stopMatch(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.state) {
      this.state.status = "ended";
      this.cb({ type: "state", data: this.state });
    }
  }

  getState(): MatchState | null {
    return this.state;
  }
}
