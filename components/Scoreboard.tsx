"use client";
import type { SerializedAgent, AgentId } from "../types";

interface Props {
  agents: Record<AgentId, SerializedAgent>;
  winner?: AgentId;
}

export default function Scoreboard({ agents, winner }: Props) {
  const sorted = Object.values(agents).sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((agent, i) => {
        const isFirst = i === 0;
        const isWinner = winner === agent.id;

        return (
          <div
            key={agent.id}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
              isWinner ? "animate-pop" : ""
            }`}
            style={{
              background: isFirst ? `${agent.bgColor}` : "rgba(255,255,255,0.03)",
              border: `1px solid ${isFirst ? agent.color + "60" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <div className="text-base font-mono font-bold text-white/40 w-5 text-center">
              {i === 0 ? "👑" : `#${i + 1}`}
            </div>
            <span className="text-lg">{agent.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate" style={{ color: agent.color }}>
                {agent.name}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono font-bold text-sm text-white">{agent.score}</div>
              <div className="text-xs text-white/30">pts</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
