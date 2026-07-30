export type AgentId = "greg" | "pat" | "claude" | "hannah";
export type GameMode = "auction" | "dilemma" | "resource-war" | "free";
export type MatchStatus = "idle" | "countdown" | "running" | "ended";

export interface Agent {
  id: AgentId;
  name: string;
  emoji: string;
  bio: string;
  color: string;
  bgColor: string;
  accountId: string;
  balanceTinybars: bigint;
  score: number;
  totalPaid: bigint;
  totalReceived: bigint;
  wins: number;
}

export interface PaymentEvent {
  id: string;
  timestamp: number;
  fromAgent: AgentId;
  toAgent: AgentId;
  amountTinybars: bigint;
  amountHbar: string;
  action: string;
  transactionId: string;
  hashscanUrl: string;
  success: boolean;
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  agentId: AgentId;
  text: string;
  emoji?: string;
  type: "offer" | "threat" | "taunt" | "accept" | "defect" | "system";
}

export interface GameAction {
  type: "offer" | "counter" | "accept" | "reject" | "attack" | "defend" | "steal" | "cooperate" | "defect" | "bid" | "claim";
  fromAgent: AgentId;
  toAgent?: AgentId;
  amount?: bigint;
  metadata?: Record<string, unknown>;
}

export interface MatchState {
  id: string;
  mode: GameMode;
  status: MatchStatus;
  startTime?: number;
  endTime?: number;
  durationSeconds: number;
  agents: Record<AgentId, Agent>;
  chatMessages: ChatMessage[];
  paymentEvents: PaymentEvent[];
  totalVolumeTinybars: bigint;
  round: number;
  winner?: AgentId;
  modeState: AuctionState | DilemmaState | ResourceWarState | FreeState;
}

export interface AuctionState {
  currentItem: string;
  currentHighBid: bigint;
  currentHighBidder?: AgentId;
  itemsSold: number;
  phase: "bidding" | "resolution";
}

export interface DilemmaState {
  round: number;
  choices: Record<AgentId, "cooperate" | "defect" | null>;
  pot: bigint;
  phase: "choosing" | "reveal";
}

export interface ResourceWarState {
  pool: bigint;
  defenses: Record<AgentId, bigint>;
  phase: "action";
}

export interface FreeState {
  activeOffers: Array<{ from: AgentId; to: AgentId; amount: bigint; id: string }>;
}

// Socket.io events
export interface ServerToClientEvents {
  "match:state": (state: SerializedMatchState) => void;
  "match:start": (state: SerializedMatchState) => void;
  "match:end": (result: MatchResult) => void;
  "chat:message": (msg: ChatMessage) => void;
  "payment:event": (evt: SerializedPaymentEvent) => void;
  "agent:update": (agent: SerializedAgent) => void;
  "countdown": (seconds: number) => void;
}

export interface ClientToServerEvents {
  "match:start": (mode: GameMode) => void;
  "match:stop": () => void;
  "spectate": () => void;
}

export interface MatchResult {
  winner?: AgentId;
  totalVolume: string;
  durationSeconds: number;
  paymentCount: number;
  highlights: string[];
  agentStats: Record<AgentId, { paid: string; received: string; score: number }>;
}

// Serialized versions (bigint -> string for JSON)
export type SerializedAgent = Omit<Agent, "balanceTinybars" | "totalPaid" | "totalReceived"> & {
  balanceTinybars: string;
  totalPaid: string;
  totalReceived: string;
};

export type SerializedPaymentEvent = Omit<PaymentEvent, "amountTinybars"> & {
  amountTinybars: string;
};

export type SerializedMatchState = Omit<MatchState, "agents" | "paymentEvents" | "totalVolumeTinybars" | "modeState"> & {
  agents: Record<AgentId, SerializedAgent>;
  paymentEvents: SerializedPaymentEvent[];
  totalVolumeTinybars: string;
  modeState: unknown;
};
