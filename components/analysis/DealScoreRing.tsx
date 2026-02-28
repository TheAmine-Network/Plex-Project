"use client";

import { cn } from "@/lib/utils";
import type { DealScore } from "@/lib/finance/types";

interface DealScoreRingProps {
  score: DealScore;
  size?: number;
  className?: string;
}

const VERDICT_CONFIG = {
  GO: { label: "GO", color: "#10b981", bg: "bg-green-50 dark:bg-green-950/30" },
  NEUTRAL: { label: "NEUTRE", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/30" },
  NO_GO: { label: "NO-GO", color: "#ef4444", bg: "bg-red-50 dark:bg-red-950/30" },
};

export function DealScoreRing({ score, size = 160, className }: DealScoreRingProps) {
  const config = VERDICT_CONFIG[score.verdict];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score.score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* SVG Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
          {/* Track */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />
          {/* Progress */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="score-ring"
          />
        </svg>

        {/* Score au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color: config.color }}>
            {score.score}
          </span>
          <span className="text-xs text-muted-foreground font-medium">/ 100</span>
        </div>
      </div>

      {/* Verdict badge */}
      <div className={cn(
        "px-4 py-1.5 rounded-full text-sm font-bold tracking-wide",
        config.bg
      )} style={{ color: config.color }}>
        {config.label}
      </div>
    </div>
  );
}
