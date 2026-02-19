"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ClaimState } from "@/hooks/useClaim";

const stateConfig = {
  idle: { label: "Request STT", color: "border-accent", glow: "shadow-accent/30" },
  pending: { label: "Requesting...", color: "border-accent", glow: "shadow-accent/20" },
  confirming: { label: "Confirming...", color: "border-accent", glow: "shadow-accent/20" },
  success: { label: "0.5 STT incoming!", color: "border-accent", glow: "shadow-accent/60" },
  denied: { label: "Denied", color: "border-accent-purple", glow: "shadow-accent-purple/30" },
  error: { label: "Error", color: "border-red-500", glow: "shadow-red-500/30" },
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
  const label = disabled && disabledReason ? disabledReason : cfg.label;

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow ring */}
      <motion.div
        className={`absolute w-44 h-44 rounded-full border-2 ${cfg.color} ${cfg.glow} shadow-lg`}
        animate={
          isLoading
            ? { rotate: 360, scale: 1 }
            : state === "success"
            ? { scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }
            : state === "denied" || state === "error"
            ? { x: [0, -4, 4, -4, 0] }
            : { scale: [1, 1.02, 1] }
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
        className={`relative z-10 w-36 h-36 rounded-full bg-white/5 backdrop-blur border ${cfg.color}
          text-white font-semibold text-sm
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-white/10 transition-colors`}
        whileHover={!disabled && !isLoading ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="block px-4"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
