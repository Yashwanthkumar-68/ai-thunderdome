"use client";
import type { SerializedAgent } from "../types";

function formatHbar(tinybars: string): string {
  const n = Number(tinybars) / 1e8;
  return n.toFixed(4);
}

interface Props {
  agent: SerializedAgent;
  isWinner?: boolean;
  maxBalance: number;
}

export default function AgentCard({ agent, isWinner, maxBalance }: Props) {
  const balanceNum = Number(agent.balanceTinybars);
  const pct = maxBalance > 0 ? Math.min(100, (balanceNum / maxBalance) * 100) : 0;
  const paid = formatHbar(agent.totalPaid);
  const received = formatHbar(agent.totalReceived);

  return (
    <div
      className={`relative p-3 rounded-xl border transition-all duration-300 ${isWinner ? "scale-[1.02]" : ""}`}
      style={{
        background: agent.bgColor,
        borderColor: agent.color,
        boxShadow: isWinner ? `0 0 20px ${agent.color}60` : `0 0 8px ${agent.color}20`,
      }}
    >
      {isWinner && (
        <div className="absolute -top-2 -right-2 text-lg">🏆</div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{agent.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ color: agent.color }}>
            {agent.name}
          </div>
          <div className="text-xs text-white/40 truncate">{agent.bio}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono font-bold text-sm text-white">
            {formatHbar(agent.balanceTinybars)} ℏ
          </div>
          <div className="text-xs font-bold" style={{ color: agent.color }}>
            Score: {agent.score}
          </div>
        </div>
      </div>

      {/* Balance bar */}
      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${agent.color}, ${agent.color}80)`,
            boxShadow: `0 0 6px ${agent.color}`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-white/40">
        <span>↑ paid {paid} ℏ</span>
        <span>↓ recv {received} ℏ</span>
      </div>
    </div>
  );
}
