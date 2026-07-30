import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  MatchState,
  SerializedMatchState,
  SerializedAgent,
  SerializedPaymentEvent,
  AgentId,
  PaymentEvent,
  Agent,
} from "../types";
import { GameEngine } from "../lib/games/engine";
import { initFacilitator } from "../lib/x402/payment";

function serializeAgent(a: Agent): SerializedAgent {
  return {
    ...a,
    balanceTinybars: a.balanceTinybars.toString(),
    totalPaid: a.totalPaid.toString(),
    totalReceived: a.totalReceived.toString(),
  };
}

function serializePaymentEvent(e: PaymentEvent): SerializedPaymentEvent {
  return {
    ...e,
    amountTinybars: e.amountTinybars.toString(),
  };
}

function serializeState(state: MatchState): SerializedMatchState {
  const agents = Object.fromEntries(
    Object.entries(state.agents).map(([id, agent]) => [id, serializeAgent(agent)])
  ) as Record<AgentId, SerializedAgent>;

  return {
    ...state,
    agents,
    paymentEvents: state.paymentEvents.slice(-50).map(serializePaymentEvent),
    totalVolumeTinybars: state.totalVolumeTinybars.toString(),
    modeState: JSON.parse(
      JSON.stringify(state.modeState, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    ),
  };
}

export function createSocketServer(httpServer: HTTPServer): void {
  const facilitatorId  = process.env.FACILITATOR_ACCOUNT_ID;
  const facilitatorKey = process.env.FACILITATOR_PRIVATE_KEY;

  if (!facilitatorId || !facilitatorKey) {
    throw new Error(
      "FACILITATOR_ACCOUNT_ID and FACILITATOR_PRIVATE_KEY are required.\n" +
      "Copy .env.example → .env and fill in your Hedera Testnet account details."
    );
  }

  initFacilitator(facilitatorId, facilitatorKey);

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: "*" },
  });

  const engine = new GameEngine((event) => {
    const state = engine.getState();
    if (!state) return;

    switch (event.type) {
      case "chat":
        io.emit("chat:message", event.data as never);
        break;
      case "payment": {
        const e = event.data as PaymentEvent;
        io.emit("payment:event", serializePaymentEvent(e));
        break;
      }
      case "state":
        io.emit("match:state", serializeState(state));
        break;
    }
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    const currentState = engine.getState();
    if (currentState) socket.emit("match:state", serializeState(currentState));

    socket.on("match:start", async (mode) => {
      console.log(`Starting match: mode=${mode}`);
      try {
        const state = await engine.startMatch(mode);
        io.emit("match:start", serializeState(state));
      } catch (err) {
        console.error("match:start failed:", err instanceof Error ? err.message : err);
      }
    });

    socket.on("match:stop", () => engine.stopMatch());

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  console.log("🔌 Socket.io server ready");
}
