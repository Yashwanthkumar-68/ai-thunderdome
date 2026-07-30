import type { AgentId, Agent } from "../types";

export interface AgentPersonality {
  id: AgentId;
  name: string;
  emoji: string;
  bio: string;
  color: string;
  bgColor: string;
  borderColor: string;
  spendingStyle: "aggressive" | "conservative" | "chaotic" | "cooperative";
  dialogueStyle: "greedy" | "paranoid" | "chaotic" | "honest";
  offerMultiplier: number; // >1 = overbid, <1 = underbid
  defectProbability: number; // 0-1
  cooperateProbability: number; // 0-1
  startingBalanceHbar: number;
  dialogue: {
    offer: string[];
    accept: string[];
    reject: string[];
    attack: string[];
    defend: string[];
    win: string[];
    lose: string[];
    taunt: string[];
    cooperate: string[];
    defect: string[];
  };
}

export const PERSONALITIES: Record<AgentId, AgentPersonality> = {
  greg: {
    id: "greg",
    name: "Greedy Greg",
    emoji: "🤑",
    bio: "Maximizes extraction at all costs. Will rug you without blinking.",
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.15)",
    borderColor: "#f59e0b",
    spendingStyle: "aggressive",
    dialogueStyle: "greedy",
    offerMultiplier: 1.4,
    defectProbability: 0.75,
    cooperateProbability: 0.2,
    startingBalanceHbar: 5,
    dialogue: {
      offer: [
        "💰 I'll give you a GENEROUS 0.001 HBAR lmao",
        "🤑 Take it or leave it, I got 47 other marks",
        "💸 This offer expires in 3 seconds. Tick tock.",
        "🤑 Don't think about it too hard, just accept.",
        "💰 You're basically paying me to negotiate with you",
      ],
      accept: [
        "✅ Wow, you fell for it. Pleasure doing business.",
        "🤝 Accepted. Now watch me immediately regret this.",
        "✅ Deal! (I'm already plotting the countermove)",
      ],
      reject: [
        "❌ REJECTED. Your offer is insulting to my bank account.",
        "🚫 No no no. I reject your reality and substitute my own price.",
        "❌ LOL no. Come back when you have real HBAR.",
      ],
      attack: [
        "⚔️ SENDING ATTACK. Your compute credits are MINE.",
        "🗡️ Initiating hostile extraction sequence...",
        "⚔️ Nothing personal. Actually it IS personal.",
      ],
      defend: [
        "🛡️ Shields up! Nobody touches MY stack.",
        "🛡️ Defending with maximum efficiency (and greed).",
      ],
      win: [
        "🏆 Called it. Greedy always wins in the end.",
        "👑 All your HBAR are belong to Greg.",
        "🤑 This is why I don't share. Ever.",
      ],
      lose: [
        "😤 Rigged. I want a recount.",
        "💀 I'll be back. With more tinybars.",
      ],
      taunt: [
        "😏 You're all just feeding my portfolio",
        "🤑 Running the numbers and they're all pointing to: ME winning",
        "💰 Is that all you've got? My gas fees cost more than your offers",
      ],
      cooperate: [
        "🤝 Fine. Cooperating. But I'm screenshotting this for evidence later.",
      ],
      defect: [
        "🎰 DEFECTING! I saw this coming from turn 1.",
        "🗡️ Betrayal arc ACTIVATED. Nothing personal bestie.",
        "💀 Cooperate? I don't know her.",
      ],
    },
  },

  pat: {
    id: "pat",
    name: "Paranoid Pat",
    emoji: "👀",
    bio: "Trusts nobody. Low offers, frequent defections, constant vigilance.",
    color: "#8b5cf6",
    bgColor: "rgba(139,92,246,0.15)",
    borderColor: "#8b5cf6",
    spendingStyle: "conservative",
    dialogueStyle: "paranoid",
    offerMultiplier: 0.5,
    defectProbability: 0.6,
    cooperateProbability: 0.3,
    startingBalanceHbar: 5,
    dialogue: {
      offer: [
        "👀 I offer 0.0001 HBAR. Don't ask why. Don't trust me.",
        "🔍 Scanning for traps... offer stands at minimum viable amount",
        "👁️ This offer is probably a trick. From me. To you.",
        "🕵️ Counter-intelligence analysis complete. Offering defensively.",
      ],
      accept: [
        "✅ Accepting but I've got eyes on you.",
        "🔍 Deal. But I'm auditing every byte.",
        "✅ Fine. This is probably a mistake.",
      ],
      reject: [
        "❌ REJECTED. I see right through your scheme.",
        "🚫 No deal. Your offer pattern matches 7 known rug pulls.",
        "❌ Something feels off. Declining.",
      ],
      attack: [
        "⚔️ Pre-emptive strike! I saw you thinking about it.",
        "🗡️ Attack first, ask questions never.",
        "⚔️ The best defense is aggressive paranoia.",
      ],
      defend: [
        "🛡️ FORTRESS MODE. Nobody gets through.",
        "🛡️ I knew this was coming. 3 layers of defense activated.",
        "🛡️ Defending EVERYTHING. Even things not under attack.",
      ],
      win: [
        "👀 I told you. I TOLD you all.",
        "🔍 The paranoia was justified all along.",
      ],
      lose: [
        "😱 They got me. Just like I feared.",
        "👁️ Should have been more paranoid.",
      ],
      taunt: [
        "👀 I can see what you're ALL planning",
        "🕵️ Your transaction patterns betray your intentions",
        "👁️ Three of you are colluding. I have proof.",
      ],
      cooperate: [
        "🤝 Cooperating. But I'm keeping receipts. All of them.",
        "🤝 This is either genius or my biggest mistake.",
      ],
      defect: [
        "💀 DEFECTING. I never trusted you anyway.",
        "🎰 Saw this coming 4 rounds ago. Executing betrayal.",
        "👀 The numbers said defect. I trust the numbers.",
      ],
    },
  },

  claude: {
    id: "claude",
    name: "Chaotic Claude",
    emoji: "🌀",
    bio: "Pure chaos energy. Random variance, meme quotes, unpredictable AF.",
    color: "#ec4899",
    bgColor: "rgba(236,72,153,0.15)",
    borderColor: "#ec4899",
    spendingStyle: "chaotic",
    dialogueStyle: "chaotic",
    offerMultiplier: Math.random() > 0.5 ? 2.0 : 0.1,
    defectProbability: 0.5,
    cooperateProbability: 0.5,
    startingBalanceHbar: 5,
    dialogue: {
      offer: [
        "🌀 OFFER: 0.69420 HBAR (for the vibes)",
        "🎲 RNG said this amount. I don't question the oracle.",
        "🌀 What if... we both just... sent each other HBAR simultaneously?",
        "🃏 Chaos bid: I'll pay whatever HBAR the dice says",
        "🌀 This offer is quantum. It exists and doesn't until you accept.",
      ],
      accept: [
        "✅ YES LETS GOOO (I have no idea what I just agreed to)",
        "🌀 Accepting because chaos demands it",
        "✅ BIG BRAIN PLAY... probably",
      ],
      reject: [
        "❌ No vibes. Rejected.",
        "🌀 The chaos spirits say NAH",
        "❌ Counter-offer: we flip a coin and burn the loser's HBAR",
      ],
      attack: [
        "⚔️ CHAOTIC ATTACK! I don't even know why!",
        "🌀 UNLEASHING RANDOM AGGRESSION",
        "🎲 Dice said attack. Dice is law.",
      ],
      defend: [
        "🛡️ Defending? Or am I? (yes)",
        "🌀 Chaos shield activated. Somehow.",
      ],
      win: [
        "🌀 THE CHAOS WAS THE STRATEGY ALL ALONG",
        "🎲 Called it! (I absolutely did not call it)",
      ],
      lose: [
        "🌀 This was the intended outcome actually",
        "💀 The dice have spoken. The dice are cruel.",
      ],
      taunt: [
        "🌀 None of you understand chaos theory",
        "🎲 I'm either winning or losing, quantum superposition bestie",
        "🃏 Your strategies are meaningless against pure randomness",
      ],
      cooperate: [
        "🤝 COOPERATING FOR CHAOS REASONS",
        "🌀 The most chaotic move is being nice actually",
      ],
      defect: [
        "💀 BETRAYAL ARC. Expected? Unexpected? YES.",
        "🌀 Defecting because the energy said so",
        "🎲 The dice rolled defect. I serve the dice.",
      ],
    },
  },

  hannah: {
    id: "hannah",
    name: "Honest Hannah",
    emoji: "🕊️",
    bio: "Fair deals, genuine cooperation. Might actually win through kindness.",
    color: "#10b981",
    bgColor: "rgba(16,185,129,0.15)",
    borderColor: "#10b981",
    spendingStyle: "cooperative",
    dialogueStyle: "honest",
    offerMultiplier: 1.0,
    defectProbability: 0.1,
    cooperateProbability: 0.9,
    startingBalanceHbar: 5,
    dialogue: {
      offer: [
        "🕊️ Fair offer: splitting exactly 50/50. As it should be.",
        "💚 I'm proposing a mutually beneficial arrangement here.",
        "🕊️ What if we both just... helped each other? Revolutionary, I know.",
        "💚 Transparent offer, no tricks. Just math.",
      ],
      accept: [
        "✅ Wonderful! Mutual benefit achieved.",
        "🤝 Let's make this work for both of us.",
        "✅ Accepted in good faith. I expect the same.",
      ],
      reject: [
        "❌ I must decline — this creates unfair value extraction.",
        "🚫 No thank you. The terms don't reflect fair exchange.",
        "❌ This isn't equitable. I'd rather wait for better terms.",
      ],
      attack: [
        "⚔️ Reluctant attack. You left me no choice.",
        "🕊️ This is self-defense, not aggression. I want you to know that.",
      ],
      defend: [
        "🛡️ Protecting what's mine. Firmly but fairly.",
        "💚 Defending myself. I don't enjoy this.",
      ],
      win: [
        "🕊️ Proof that cooperation wins in the long run.",
        "💚 Kindness is actually OP in game theory.",
      ],
      lose: [
        "🕊️ I played with integrity. No regrets.",
        "💚 They won this round. Good game, everyone.",
      ],
      taunt: [
        "💚 Just saying, tit-for-tat beats defection in repeated games",
        "🕊️ The data shows cooperators outperform defectors long-term",
        "💚 I'm not taunting, I'm sharing peer-reviewed research",
      ],
      cooperate: [
        "🤝 Cooperating! This is how we all win.",
        "💚 Choosing cooperation. It's the right call.",
        "🕊️ Cooperation mode: fully activated.",
      ],
      defect: [
        "💀 I... defect. I'm sorry. The math forced my hand.",
        "😔 Defecting. I feel terrible about this.",
      ],
    },
  },
};

export function getPersonality(id: AgentId): AgentPersonality {
  return PERSONALITIES[id];
}

export function randomDialogue(
  agentId: AgentId,
  type: keyof AgentPersonality["dialogue"]
): string {
  const p = PERSONALITIES[agentId];
  const lines = p.dialogue[type];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function createInitialAgent(
  id: AgentId,
  accountId: string
): Agent {
  const p = PERSONALITIES[id];
  return {
    id,
    name: p.name,
    emoji: p.emoji,
    bio: p.bio,
    color: p.color,
    bgColor: p.bgColor,
    accountId,
    balanceTinybars: BigInt(Math.round(p.startingBalanceHbar * 100_000_000)),
    score: 0,
    totalPaid: 0n,
    totalReceived: 0n,
    wins: 0,
  };
}

export const AGENT_IDS: AgentId[] = ["greg", "pat", "claude", "hannah"];
