"use client";

const TOTAL_COOLDOWN = 24 * 60 * 60;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface CooldownTimerProps {
  secondsLeft: number;
}

export function CooldownTimer({ secondsLeft }: CooldownTimerProps) {
  const isReady = secondsLeft === 0;
  const progress = 1 - secondsLeft / TOTAL_COOLDOWN;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="128" height="128" viewBox="0 0 128 128">
        {/* Background ring */}
        <circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        {/* Progress ring */}
        <circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          stroke={isReady ? "#22c55e" : "#00E5FF"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          className="transition-all duration-1000"
        />
        {/* Center text */}
        <text
          x="64"
          y="64"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={isReady ? "13" : "14"}
          fontFamily="monospace"
        >
          {isReady ? "Ready" : formatTime(secondsLeft)}
        </text>
      </svg>
      <span className={`text-xs ${isReady ? "text-green-400" : "text-white/60"}`}>
        {isReady ? "Ready to claim" : "Cooldown active"}
      </span>
    </div>
  );
}
