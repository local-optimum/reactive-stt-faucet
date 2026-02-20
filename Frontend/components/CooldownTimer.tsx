"use client";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface CooldownTimerProps {
  secondsLeft: number;
  totalCooldown: number;
}

export function CooldownTimer({ secondsLeft, totalCooldown }: CooldownTimerProps) {
  const isReady = secondsLeft === 0;
  const progress = totalCooldown > 0 ? 1 - secondsLeft / totalCooldown : 1;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
        />
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke={isReady ? "#22c55e" : "#00E5FF"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="flex flex-col">
        <span className={`text-sm font-mono ${isReady ? "text-green-400" : "text-white/80"}`}>
          {isReady ? "Ready" : formatTime(secondsLeft)}
        </span>
        <span className="text-[11px] text-white/40">
          {isReady ? "Ready to claim" : "Cooldown active"}
        </span>
      </div>
    </div>
  );
}
