import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un montant en dollars canadiens */
export function formatCurrency(
  amount: number,
  options: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = false, decimals = 0 } = options;

  if (compact && Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M$`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}k$`;
  }

  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Formate un pourcentage */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Formate un ratio (ex: DSCR) */
export function formatRatio(value: number, decimals = 2): string {
  return value.toFixed(decimals) + "x";
}

/** Détermine la couleur selon une valeur seuil */
export function getSignalColor(
  value: number,
  thresholds: { good: number; neutral: number }
): "positive" | "warning" | "negative" {
  if (value >= thresholds.good) return "positive";
  if (value >= thresholds.neutral) return "warning";
  return "negative";
}

/** Génère un slug unique */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Sanitize input string (prévention XSS basique) */
export function sanitizeString(input: string, maxLength = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>&"']/g, (char) => {
      const map: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#x27;",
      };
      return map[char] ?? char;
    });
}

/** Valide un montant financier */
export function isValidAmount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    isFinite(value) &&
    !isNaN(value) &&
    value >= 0
  );
}

/** Classifie un DSCR */
export function dscrLabel(dscr: number): { label: string; color: string } {
  if (dscr >= 1.3) return { label: "Excellent", color: "text-positive" };
  if (dscr >= 1.2) return { label: "Bon", color: "text-positive" };
  if (dscr >= 1.0) return { label: "Adéquat", color: "text-warning" };
  return { label: "Insuffisant", color: "text-negative" };
}

/** Classifie un cap rate (contexte Québec) */
export function capRateLabel(cr: number): { label: string; color: string } {
  if (cr >= 0.07) return { label: "Excellent", color: "text-positive" };
  if (cr >= 0.055) return { label: "Bon", color: "text-positive" };
  if (cr >= 0.04) return { label: "Moyen", color: "text-warning" };
  return { label: "Faible", color: "text-negative" };
}
