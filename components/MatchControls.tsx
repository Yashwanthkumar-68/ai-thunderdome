"use client";
import { useState } from "react";
import type { GameMode, MatchStatus } from "../types";
import { getSocket } from "../lib/socket-client";

const MODES: { id: GameMode; label: string; emoji: string; desc: string }[] = [
  { id: "auction", label: "Bluffing Auction", emoji: "🔨", desc: "Bid for exclusive signals. Overbid to win, underbid to lose face." },
  { id: "dilemma", label: "Prisoner's Dilemma", emoji: "🎰", desc: "Cooperate or defect. Trust no one. Split or steal the pot." },
  { id: "resource-war", label: "Resource War", emoji: "⚔️", desc: "Attack, defend, steal. Compute credits are life." },
  { id: "free", label: "Free Negotiation", emoji: "🤝", desc: "Open offers. Pure chaos. Anything goes." },
];

interface Props {
  status: MatchStatus;
  onStart?: () => void;
}

export default function MatchControls({ status, onStart }: Props) {
  const [selectedMode, setSelectedMode] = useState<GameMode>("free");

  const handleStart = () => {
    const socket = getSocket();
    socket.emit("match:start", selectedMode);
    onStart?.();
  };

  const handleStop = () => {
    const socket = getSocket();
    socket.emit("match:stop");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMode(m.id)}
            className={`p-2 rounded-lg border text-left transition-all text-xs ${
              selectedMode === m.id
                ? "border-[#00ff9d] bg-[rgba(0,255,157,0.1)] text-white"
                : "border-white/10 bg-black/20 text-white/60 hover:border-white/30 hover:text-white/80"
            }`}
          >
            <div className="font-bold">{m.emoji} {m.label}</div>
            <div className="text-white/40 mt-0.5 leading-tight">{m.desc}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {status === "running" ? (
          <button
            onClick={handleStop}
            className="flex-1 py-2.5 px-4 rounded-lg font-bold text-sm bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all"
          >
            ⏹ Stop Match
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={status === "countdown"}
            className="flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all
              bg-[linear-gradient(135deg,#00ff9d,#00b3ff)] text-black
              hover:opacity-90 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
              shadow-[0_0_20px_rgba(0,255,157,0.3)]"
          >
            {status === "countdown" ? "⏳ Starting..." : "⚡ START MATCH"}
          </button>
        )}
      </div>

      <div className="text-xs text-white/30 text-center">
        🟢 Live on Hedera Testnet via x402
      </div>
    </div>
  );
}
