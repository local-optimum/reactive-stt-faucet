"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ClaimState } from "@/hooks/useClaim";

const stateConfig = {
  idle: { color: "#00E5FF" },
  pending: { color: "#00E5FF" },
  confirming: { color: "#00E5FF" },
  success: { color: "#00E5FF" },
  denied: { color: "#7C3AED" },
  error: { color: "#ef4444" },
};

const stateLabel: Record<ClaimState, string> = {
  idle: "Request STT",
  pending: "Requesting...",
  confirming: "Confirming...",
  success: "1 STT incoming!",
  denied: "Denied",
  error: "Error",
};

interface HeroButtonProps {
  state: ClaimState;
  disabled: boolean;
  disabledReason?: string;
  onClick: () => void;
}

export function HeroButton({ state, disabled, disabledReason, onClick }: HeroButtonProps) {
  const cfg = stateConfig[state];
  const isLoading = state === "pending" || state === "confirming";
  const label = disabled && disabledReason ? disabledReason : stateLabel[state];

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      {/* Glow ring — same size as button, positioned behind */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${cfg.color}`,
          boxShadow: `0 0 20px ${cfg.color}33, 0 0 40px ${cfg.color}1a`,
        }}
        animate={
          isLoading
            ? { rotate: 360, scale: 1 }
            : state === "success"
            ? { scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }
            : state === "denied" || state === "error"
            ? { x: [0, -3, 3, -3, 0] }
            : { scale: [1, 1.03, 1] }
        }
        transition={
          isLoading
            ? { rotate: { duration: 1.5, repeat: Infinity, ease: "linear" } }
            : state === "success"
            ? { duration: 0.6 }
            : state === "denied" || state === "error"
            ? { duration: 0.4 }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <motion.button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="relative z-10 w-full h-full rounded-full bg-white/5 backdrop-blur
          text-white font-semibold text-sm
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-white/10 transition-colors"
        style={{ border: `1px solid ${cfg.color}44` }}
        whileHover={!disabled && !isLoading ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="block px-3 leading-tight"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
