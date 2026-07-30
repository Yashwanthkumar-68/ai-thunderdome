"use client";
import { useEffect, useRef } from "react";
import type { SerializedPaymentEvent, SerializedAgent, AgentId } from "../types";

interface Props {
  events: SerializedPaymentEvent[];
  agents: Record<AgentId, SerializedAgent>;
  totalVolume: string;
}

export default function PaymentTicker({ events, agents, totalVolume }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const totalHbar = (Number(totalVolume) / 1e8).toFixed(6);

  return (
    <div className="flex flex-col h-full">
      {/* Total volume header */}
      <div className="mb-3 p-3 rounded-lg bg-black/30 border border-[#00ff9d]/20">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Volume</div>
        <div className="font-mono font-bold text-xl text-[#00ff9d] glow-green">
          {totalHbar} ℏ
        </div>
        <div className="text-xs text-white/30 mt-0.5">{events.filter(e => e.success).length} settled on-chain</div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
        {events.length === 0 && (
          <div className="text-xs text-white/30 text-center mt-6">
            Payment events will appear here...
          </div>
        )}

        {[...events].reverse().map((evt) => {
          const fromAgent = agents[evt.fromAgent];
          const toAgent = agents[evt.toAgent];
          if (!fromAgent || !toAgent) return null;

          const time = new Date(evt.timestamp).toLocaleTimeString("en", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });

          return (
            <div
              key={evt.id}
              className={`animate-slide-right p-2 rounded-lg border text-xs ${
                evt.success
                  ? "border-[#00ff9d]/20 bg-[rgba(0,255,157,0.04)]"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span>{fromAgent.emoji}</span>
                  <span className="text-white/40">→</span>
                  <span>{toAgent.emoji}</span>
                </div>
                <span className="font-mono font-bold text-[#00ff9d]">
                  {evt.amountHbar} ℏ
                </span>
              </div>

              <div className="text-white/50 mb-1 truncate">{evt.action}</div>

              <div className="flex items-center justify-between">
                <span className="text-white/30">{time}</span>
                {evt.success && evt.hashscanUrl ? (
                  <a
                    href={evt.hashscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00b3ff] hover:text-[#00ffff] underline font-mono truncate max-w-[120px]"
                  >
                    HashScan ↗
                  </a>
                ) : (
                  <span className="text-red-400">
                    {evt.errorMessage ? `✗ ${evt.errorMessage.substring(0, 20)}` : "✗ failed"}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
