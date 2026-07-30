"use client";
import { useEffect, useState } from "react";
import type { MatchStatus } from "../types";

interface Props {
  status: MatchStatus;
  startTime?: number;
  durationSeconds: number;
}

export default function MatchTimer({ status, startTime, durationSeconds }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "running" || !startTime) {
      setElapsed(0);
      return;
    }

    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, startTime]);

  const remaining = Math.max(0, durationSeconds - elapsed);
  const pct = durationSeconds > 0 ? ((elapsed / durationSeconds) * 100) : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const urgency = remaining < 20;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {status === "running" && (
          <div className={`w-2 h-2 rounded-full ${urgency ? "bg-red-400 animate-pulse" : "bg-[#00ff9d] animate-heartbeat"}`} />
        )}
        <span
          className={`font-mono font-bold text-xl ${
            status === "running"
              ? urgency
                ? "text-red-400"
                : "text-[#00ff9d] glow-green"
              : "text-white/30"
          }`}
        >
          {status === "running"
            ? `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
            : status === "ended"
            ? "ENDED"
            : "00:00"}
        </span>
      </div>

      {status === "running" && (
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-24">
          <div
            className={`h-full rounded-full transition-all ${urgency ? "bg-red-400" : "bg-[#00ff9d]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
