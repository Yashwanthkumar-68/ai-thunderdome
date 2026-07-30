"use client";
import { useEffect, useState } from "react";
import type { AgentId, SerializedAgent } from "../types";

interface Props {
  winner?: AgentId;
  agents: Record<AgentId, SerializedAgent>;
  totalVolume: string;
}

export default function WinnerBanner({ winner, agents, totalVolume }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (winner) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 8000);
      return () => clearTimeout(t);
    }
  }, [winner]);

  if (!show || !winner) return null;

  const agent = agents[winner];
  if (!agent) return null;

  const totalHbar = (Number(totalVolume) / 1e8).toFixed(4);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className="animate-pop text-center p-8 rounded-2xl border-2"
        style={{
          background: `radial-gradient(ellipse at center, ${agent.bgColor} 0%, rgba(10,10,15,0.95) 70%)`,
          borderColor: agent.color,
          boxShadow: `0 0 60px ${agent.color}60, 0 0 120px ${agent.color}20`,
        }}
      >
        <div className="text-6xl mb-2">{agent.emoji}</div>
        <div className="text-4xl font-black mb-1" style={{ color: agent.color }}>
          {agent.name}
        </div>
        <div className="text-2xl font-bold text-white mb-3">WINS THE MATCH 🏆</div>
        <div className="text-sm text-white/50">
          Total volume settled:{" "}
          <span className="text-[#00ff9d] font-mono font-bold">{totalHbar} ℏ</span>
        </div>
      </div>
    </div>
  );
}
