"use client";
import { useEffect, useState, useCallback } from "react";
import type {
  SerializedMatchState,
  SerializedPaymentEvent,
  ChatMessage,
  AgentId,
  MatchStatus,
  GameMode,
} from "../types";
import { getSocket } from "../lib/socket-client";
import AgentCard from "./AgentCard";
import ChatFeed from "./ChatFeed";
import PaymentTicker from "./PaymentTicker";
import Scoreboard from "./Scoreboard";
import MatchControls from "./MatchControls";
import MatchTimer from "./MatchTimer";
import WinnerBanner from "./WinnerBanner";

const INITIAL_STATE: SerializedMatchState = {
  id: "",
  mode: "free" as GameMode,
  status: "idle" as MatchStatus,
  durationSeconds: 90,
  agents: {
    greg: {
      id: "greg", name: "Greedy Greg", emoji: "🤑", bio: "Maximizes extraction at all costs",
      color: "#f59e0b", bgColor: "rgba(245,158,11,0.15)", accountId: "",
      balanceTinybars: "500000000", score: 0, totalPaid: "0", totalReceived: "0", wins: 0,
    },
    pat: {
      id: "pat", name: "Paranoid Pat", emoji: "👀", bio: "Trusts nobody",
      color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)", accountId: "",
      balanceTinybars: "500000000", score: 0, totalPaid: "0", totalReceived: "0", wins: 0,
    },
    claude: {
      id: "claude", name: "Chaotic Claude", emoji: "🌀", bio: "Pure chaos energy",
      color: "#ec4899", bgColor: "rgba(236,72,153,0.15)", accountId: "",
      balanceTinybars: "500000000", score: 0, totalPaid: "0", totalReceived: "0", wins: 0,
    },
    hannah: {
      id: "hannah", name: "Honest Hannah", emoji: "🕊️", bio: "Fair deals, genuine cooperation",
      color: "#10b981", bgColor: "rgba(16,185,129,0.15)", accountId: "",
      balanceTinybars: "500000000", score: 0, totalPaid: "0", totalReceived: "0", wins: 0,
    },
  },
  chatMessages: [],
  paymentEvents: [],
  totalVolumeTinybars: "0",
  round: 0,
  modeState: {},
};

const LOADING_MESSAGES = [
  "Agents are sharpening their knives…",
  "Greedy Greg is calculating how to rug you…",
  "Paranoid Pat is scanning for betrayal…",
  "Chaotic Claude is loading the chaos…",
  "Honest Hannah is preparing fair offers nobody will accept…",
];

export default function Arena() {
  const [state, setState] = useState<SerializedMatchState>(INITIAL_STATE);
  const [recentEvents, setRecentEvents] = useState<SerializedPaymentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [rugFlash, setRugFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePaymentEvent = useCallback((evt: SerializedPaymentEvent) => {
    setRecentEvents((prev) => {
      const next = [...prev, evt];
      return next.slice(-100);
    });
    // RUG flash on defect events
    if (evt.action.toLowerCase().includes("defect") || evt.action.toLowerCase().includes("steal")) {
      setRugFlash(true);
      setTimeout(() => setRugFlash(false), 600);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("match:state", (s) => {
      setState(s);
      setRecentEvents(s.paymentEvents);
    });

    socket.on("match:start", (s) => {
      setState(s);
      setRecentEvents([]);
    });

    socket.on("payment:event", handlePaymentEvent);

    socket.on("chat:message", (msg: ChatMessage) => {
      setState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages.slice(-199), msg],
      }));
    });

    socket.on("agent:update", (agent) => {
      setState((prev) => ({
        ...prev,
        agents: { ...prev.agents, [agent.id]: agent },
      }));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("match:state");
      socket.off("match:start");
      socket.off("payment:event");
      socket.off("chat:message");
      socket.off("agent:update");
    };
  }, [handlePaymentEvent]);

  const maxBalance = Math.max(
    ...Object.values(state.agents).map((a) => Number(a.balanceTinybars))
  );

  const totalHbar = (Number(state.totalVolumeTinybars) / 1e8).toFixed(4);
  const paymentCount = recentEvents.filter((e) => e.success).length;

  return (
    <div
      className={`min-h-screen flex flex-col relative ${rugFlash ? "animate-rug-flash" : ""}`}
      style={{ background: "#0a0a0f" }}
    >
      <WinnerBanner
        winner={state.winner}
        agents={state.agents}
        totalVolume={state.totalVolumeTinybars}
      />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-sm px-4 py-2">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-2xl animate-flicker">⚡</div>
            <div>
              <div className="font-black text-lg leading-none tracking-tight text-white">
                AGENT <span className="glow-cyan text-[#00ffff]">THUNDERDOME</span>
              </div>
              <div className="text-xs text-white/30">Cross-Agent Negotiation Arena</div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-xs text-white/30 uppercase tracking-wider">Mode</div>
              <div className="font-bold text-sm text-white uppercase">{state.mode.replace("-", " ")}</div>
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-wider">Volume</div>
              <div className="font-mono font-bold text-sm text-[#00ff9d]">{totalHbar} ℏ</div>
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-wider">Payments</div>
              <div className="font-bold text-sm text-[#00b3ff]">{paymentCount}</div>
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-wider">Round</div>
              <div className="font-bold text-sm text-white">{state.round}</div>
            </div>
          </div>

          {/* Timer + status */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`text-xs font-bold px-2 py-0.5 rounded-full border uppercase ${
                state.status === "running"
                  ? "border-[#00ff9d]/50 text-[#00ff9d] bg-[rgba(0,255,157,0.1)]"
                  : state.status === "ended"
                  ? "border-red-500/50 text-red-400 bg-red-500/10"
                  : "border-white/20 text-white/40"
              }`}
            >
              {state.status === "running" ? "🔴 LIVE" : state.status === "ended" ? "ENDED" : "IDLE"}
            </div>
            <MatchTimer
              status={state.status}
              startTime={state.startTime}
              durationSeconds={state.durationSeconds}
            />
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-[#00ff9d]" : "bg-red-500 animate-pulse"}`}
              title={connected ? "Connected" : "Disconnected"}
            />
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="relative z-10 flex-1 flex gap-0 max-w-[1600px] mx-auto w-full">

        {/* Left panel: Chat */}
        <div className="w-[320px] shrink-0 flex flex-col border-r border-white/5">
          <div className="p-3 border-b border-white/5">
            <div className="text-xs font-bold text-white/40 uppercase tracking-wider">
              🗨 Agent Chat
            </div>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            <ChatFeed messages={state.chatMessages} agents={state.agents} />
          </div>
        </div>

        {/* Center: Arena */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
          {/* Agent grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {(Object.values(state.agents) as Parameters<typeof AgentCard>[0]["agent"][]).map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isWinner={state.winner === agent.id}
                maxBalance={maxBalance}
              />
            ))}
          </div>

          {/* Arena visualizer */}
          <div className="flex-1 px-4 pb-4">
            <div className="h-full min-h-[200px] rounded-xl border border-white/5 bg-black/20 relative overflow-hidden flex items-center justify-center">
              {/* Arena background effects */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-48 h-48 rounded-full opacity-10 animate-spin-slow"
                  style={{
                    background: "conic-gradient(from 0deg, #00ff9d, #00b3ff, #8b5cf6, #ec4899, #00ff9d)",
                  }}
                />
              </div>

              {state.status === "idle" ? (
                <div className="text-center z-10">
                  <div className="text-4xl mb-3">🏟</div>
                  <div className="text-white/50 text-sm">{loadingMsg}</div>
                  <div className="text-white/20 text-xs mt-1">Select a mode and press START MATCH</div>
                </div>
              ) : state.status === "ended" && state.winner ? (
                <div className="text-center z-10 animate-pop">
                  <div className="text-5xl mb-2">{state.agents[state.winner]?.emoji}</div>
                  <div
                    className="text-2xl font-black"
                    style={{ color: state.agents[state.winner]?.color }}
                  >
                    {state.agents[state.winner]?.name}
                  </div>
                  <div className="text-white font-bold">WINS! 🏆</div>
                  <div className="text-white/40 text-xs mt-2">
                    {totalHbar} ℏ settled in {paymentCount} payments
                  </div>
                </div>
              ) : (
                /* Running state — show active animation */
                <div className="z-10 w-full h-full flex items-center justify-center relative">
                  {/* Agent icons orbiting */}
                  {Object.values(state.agents).map((agent, i) => {
                    const angle = (i / 4) * 2 * Math.PI;
                    const r = 80;
                    const x = 50 + (r * Math.cos(angle)) / 2;
                    const y = 50 + (r * Math.sin(angle)) / 2;
                    return (
                      <div
                        key={agent.id}
                        className="absolute text-3xl transition-all duration-1000 cursor-default select-none"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: "translate(-50%, -50%)",
                          filter: `drop-shadow(0 0 8px ${agent.color})`,
                          fontSize: state.winner === agent.id ? "48px" : "32px",
                        }}
                        title={`${agent.name} — Score: ${agent.score}`}
                      >
                        {agent.emoji}
                      </div>
                    );
                  })}

                  {/* Center pulse */}
                  <div className="text-xs text-white/30 text-center">
                    <div className="text-2xl mb-1 animate-heartbeat">⚡</div>
                    <div>Round {state.round}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-[280px] shrink-0 flex flex-col">
          {/* Scoreboard */}
          <div className="p-3 border-b border-white/5">
            <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
              🏆 Scoreboard
            </div>
            <Scoreboard agents={state.agents} winner={state.winner} />
          </div>

          {/* Controls */}
          <div className="p-3 border-b border-white/5">
            <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
              🎮 Match Controls
            </div>
            <MatchControls status={state.status} />
          </div>

          {/* Payment ticker */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
              💸 Payment Feed
            </div>
            <div className="flex-1 overflow-hidden">
              <PaymentTicker
                events={recentEvents}
                agents={state.agents}
                totalVolume={state.totalVolumeTinybars}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-4 py-2 text-xs text-white/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span>Built with x402 + Hedera Testnet ⚡</span>
          <span className="text-white/10">·</span>
          <span>
            Built by{" "}
            <a
              href="https://harishkotra.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-[#00ff9d] transition-colors underline underline-offset-2"
            >
              Harish Kotra
            </a>
          </span>
          <span className="text-white/10">·</span>
          <a
            href="https://dailybuild.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-[#00b3ff] transition-colors underline underline-offset-2"
          >
            More builds →
          </a>
        </div>
        <a
          href="https://hashscan.io/testnet"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/50 transition-colors shrink-0"
        >
          HashScan ↗
        </a>
      </footer>
    </div>
  );
}
