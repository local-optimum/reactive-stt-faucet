"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { FeedEvent } from "@/hooks/useLiveFeed";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

interface LiveFeedProps {
  events: FeedEvent[];
}

export function LiveFeed({ events }: LiveFeedProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
        Live Activity
      </h3>
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 min-h-[200px]">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-[168px]">
            <div className="flex items-center gap-2 text-white/30">
              <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
              <span className="text-sm">Waiting for events...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    event.type === "granted" ? "bg-accent" : "bg-accent-purple/60"
                  }`}
                />
                <span className="font-mono text-sm text-white/80">
                  {truncateAddress(event.address)}
                </span>
                <span
                  className={`text-sm flex-1 ${
                    event.type === "granted" ? "text-accent" : "text-accent-purple"
                  }`}
                >
                  {event.type === "granted"
                    ? "received 0.5 STT"
                    : `denied \u00B7 ${event.reason || "cooldown"}`}
                </span>
                <span className="text-xs text-white/30">{timeAgo(event.timestamp)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
