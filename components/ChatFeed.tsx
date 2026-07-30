"use client";
import { useEffect, useRef } from "react";
import type { ChatMessage, SerializedAgent, AgentId } from "../types";

const TYPE_STYLES: Record<ChatMessage["type"], string> = {
  offer: "border-l-blue-400",
  accept: "border-l-green-400",
  defect: "border-l-red-500",
  threat: "border-l-orange-400",
  taunt: "border-l-purple-400",
  system: "border-l-white/20",
};

interface Props {
  messages: ChatMessage[];
  agents: Record<AgentId, SerializedAgent>;
}

export default function ChatFeed({ messages, agents }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-1.5 h-full overflow-y-auto pr-1">
      {messages.length === 0 && (
        <div className="text-center text-white/30 text-sm mt-8">
          <div className="text-3xl mb-2">⚡</div>
          Start a match to see agents negotiate in real time...
        </div>
      )}

      {messages.map((msg) => {
        const agent = agents[msg.agentId];
        if (!agent) return null;

        const time = new Date(msg.timestamp).toLocaleTimeString("en", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        return (
          <div
            key={msg.id}
            className={`animate-slide-left flex gap-2 pl-2 border-l-2 py-1 ${TYPE_STYLES[msg.type]}`}
          >
            <span className="text-base shrink-0 leading-tight">{agent.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs font-bold shrink-0" style={{ color: agent.color }}>
                  {agent.name}
                </span>
                <span className="text-xs text-white/30 shrink-0">{time}</span>
              </div>
              <div className="text-sm text-white/80 leading-snug break-words">{msg.text}</div>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
