import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  signal?: "positive" | "warning" | "negative" | "neutral";
  icon?: ReactNode;
  tooltip?: string;
  className?: string;
}

const signalStyles = {
  positive: "text-green-700 dark:text-green-400",
  warning: "text-amber-700 dark:text-amber-400",
  negative: "text-red-700 dark:text-red-400",
  neutral: "text-foreground",
};

const signalBg = {
  positive: "bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900",
  warning: "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900",
  negative: "bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900",
  neutral: "bg-card border-border",
};

export function KPICard({
  label,
  value,
  subtext,
  signal = "neutral",
  icon,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all hover:shadow-md",
        signalBg[signal],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>

      <p className={cn("mt-2 text-2xl font-bold tabular-nums", signalStyles[signal])}>
        {value}
      </p>

      {subtext && (
        <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
}
