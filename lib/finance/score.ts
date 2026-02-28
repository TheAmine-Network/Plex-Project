/**
 * PlexIQ — Deal Score (0–100)
 * Score explicable, non black-box
 */

import type { DealScore, ScoreBreakdown, DealFlag, CashflowResult } from "./types";
import type { SensitivityResult } from "./sensitivity";

interface ScoreInput {
  cashflow: CashflowResult;
  sensitivityWorstCase: number; // cashflow dans le pire scénario sensibilité
  estimatedFieldsCount: number; // nb de champs estimés/manquants (pénalité)
  totalFields: number;
  buildingAge?: number;         // optionnel
  hasMajorWorkPlanned?: boolean; // optionnel
}

// ─── PONDÉRATIONS ─────────────────────────────────────────────────────────────
// Total = 100 points
// Cashflow mensuel     : /25
// DSCR                 : /20
// Cap rate             : /20
// Robustesse (sensib.) : /20
// Qualité des données  : /15

export function calculateDealScore(input: ScoreInput): DealScore {
  const { cashflow } = input;

  const cashflowScore = scoreCashflow(cashflow.cashflowMonthly, 25);
  const dscrScore = scoreDSCR(cashflow.dscr, 20);
  const capRateScore = scoreCapRate(cashflow.capRate, 20);
  const stabilityScore = scoreStability(
    cashflow.cashflowMonthly,
    input.sensitivityWorstCase,
    20
  );
  const dataQualityScore = scoreDataQuality(
    input.estimatedFieldsCount,
    input.totalFields,
    15
  );

  const total =
    cashflowScore +
    dscrScore +
    capRateScore +
    stabilityScore +
    dataQualityScore;

  const score = Math.round(clamp(total, 0, 100));
  const verdict = verdictFromScore(score);
  const flags = buildFlags(input);
  const explanations = buildExplanations({
    cashflowScore,
    dscrScore,
    capRateScore,
    stabilityScore,
    dataQualityScore,
    cashflow,
  });

  return {
    score,
    verdict,
    breakdown: {
      cashflowScore: Math.round(cashflowScore),
      dscrScore: Math.round(dscrScore),
      capRateScore: Math.round(capRateScore),
      stabilityScore: Math.round(stabilityScore),
      dataQualityScore: Math.round(dataQualityScore),
    },
    flags,
    explanations,
  };
}

// ─── SUB-SCORES ───────────────────────────────────────────────────────────────

/** Cashflow mensuel → /maxPoints
 * >500$/mois = parfait, 0 = neutre, <-300 = zéro
 */
function scoreCashflow(monthly: number, maxPoints: number): number {
  if (monthly >= 500) return maxPoints;
  if (monthly >= 300) return maxPoints * 0.9;
  if (monthly >= 150) return maxPoints * 0.75;
  if (monthly >= 0) return maxPoints * 0.55;
  if (monthly >= -150) return maxPoints * 0.3;
  if (monthly >= -300) return maxPoints * 0.1;
  return 0;
}

/** DSCR → /maxPoints
 * >1.3 = excellent, 1.2 = bon, 1.0 = équilibre, <1.0 = danger
 */
function scoreDSCR(dscr: number, maxPoints: number): number {
  if (dscr >= 1.3) return maxPoints;
  if (dscr >= 1.2) return maxPoints * 0.85;
  if (dscr >= 1.1) return maxPoints * 0.65;
  if (dscr >= 1.0) return maxPoints * 0.45;
  if (dscr >= 0.9) return maxPoints * 0.2;
  return 0;
}

/** Cap rate → /maxPoints
 * Cibles Québec 2024: >6% = excellent, 4–6% = bon, 3–4% = serré, <3% = faible
 */
function scoreCapRate(capRate: number, maxPoints: number): number {
  if (capRate >= 0.07) return maxPoints;
  if (capRate >= 0.06) return maxPoints * 0.85;
  if (capRate >= 0.05) return maxPoints * 0.65;
  if (capRate >= 0.04) return maxPoints * 0.45;
  if (capRate >= 0.03) return maxPoints * 0.25;
  return maxPoints * 0.1;
}

/** Robustesse : cashflow reste positif même dans le pire scénario ? */
function scoreStability(
  baseCashflow: number,
  worstCase: number,
  maxPoints: number
): number {
  if (worstCase >= 0) return maxPoints;         // positif même en pire cas
  if (baseCashflow >= 0 && worstCase >= -200) return maxPoints * 0.7;
  if (baseCashflow >= 0 && worstCase >= -500) return maxPoints * 0.5;
  if (worstCase >= -200) return maxPoints * 0.3;
  return 0;
}

/** Qualité des données : pénalité si trop de champs estimés */
function scoreDataQuality(
  estimatedCount: number,
  totalCount: number,
  maxPoints: number
): number {
  if (totalCount === 0) return maxPoints * 0.5;
  const ratio = estimatedCount / totalCount;
  if (ratio === 0) return maxPoints;
  if (ratio <= 0.1) return maxPoints * 0.9;
  if (ratio <= 0.2) return maxPoints * 0.75;
  if (ratio <= 0.4) return maxPoints * 0.5;
  if (ratio <= 0.6) return maxPoints * 0.25;
  return 0;
}

// ─── VERDICT ─────────────────────────────────────────────────────────────────

function verdictFromScore(score: number): "GO" | "NEUTRAL" | "NO_GO" {
  if (score >= 65) return "GO";
  if (score >= 40) return "NEUTRAL";
  return "NO_GO";
}

// ─── FLAGS ───────────────────────────────────────────────────────────────────

function buildFlags(input: ScoreInput): DealFlag[] {
  const flags: DealFlag[] = [];
  const { cashflow } = input;

  if (cashflow.cashflowMonthly < 0) {
    flags.push({
      type: "danger",
      code: "NEGATIVE_CASHFLOW",
      label: "Cashflow négatif",
      detail: `Vous investissez ${Math.abs(cashflow.cashflowMonthly).toFixed(0)}$/mois`,
    });
  }

  if (cashflow.dscr < 1.0) {
    flags.push({
      type: "danger",
      code: "DSCR_BELOW_1",
      label: "DSCR < 1.0 — revenus insuffisants pour couvrir la dette",
    });
  }

  if (cashflow.capRate < 0.035) {
    flags.push({
      type: "warning",
      code: "LOW_CAP_RATE",
      label: `Cap rate faible (${(cashflow.capRate * 100).toFixed(2)}%)`,
      detail: "Le rendement locatif est bas pour ce prix d'achat",
    });
  }

  if (cashflow.grm > 25) {
    flags.push({
      type: "warning",
      code: "HIGH_GRM",
      label: `GRM élevé (${cashflow.grm.toFixed(1)}x)`,
      detail: "Ratio prix/loyers élevé — valeur difficile à justifier",
    });
  }

  if (input.estimatedFieldsCount / Math.max(input.totalFields, 1) > 0.3) {
    flags.push({
      type: "warning",
      code: "DATA_UNCERTAINTY",
      label: "Données partiellement estimées",
      detail: "Plusieurs champs sont basés sur des valeurs par défaut. Validez avec des données réelles.",
    });
  }

  if (input.buildingAge && input.buildingAge > 50) {
    flags.push({
      type: "info",
      code: "OLDER_BUILDING",
      label: `Bâtiment de ${input.buildingAge} ans`,
      detail: "Prévoir un budget de rénovation plus important",
    });
  }

  if (input.hasMajorWorkPlanned) {
    flags.push({
      type: "warning",
      code: "MAJOR_WORK",
      label: "Travaux majeurs planifiés",
      detail: "Assurez-vous que le budget de rénovation est inclus dans l'analyse",
    });
  }

  return flags;
}

// ─── EXPLICATIONS ─────────────────────────────────────────────────────────────

function buildExplanations(params: {
  cashflowScore: number;
  dscrScore: number;
  capRateScore: number;
  stabilityScore: number;
  dataQualityScore: number;
  cashflow: CashflowResult;
}): string[] {
  const { cashflow } = params;
  const explanations: string[] = [];

  explanations.push(
    `Cashflow mensuel de ${cashflow.cashflowMonthly >= 0 ? "+" : ""}${cashflow.cashflowMonthly.toFixed(0)}$ → ${Math.round(params.cashflowScore)}/25 pts`
  );

  explanations.push(
    `DSCR de ${cashflow.dscr.toFixed(2)} (${cashflow.dscr >= 1.2 ? "excellent" : cashflow.dscr >= 1.0 ? "adéquat" : "insuffisant"}) → ${Math.round(params.dscrScore)}/20 pts`
  );

  explanations.push(
    `Cap rate de ${(cashflow.capRate * 100).toFixed(2)}% → ${Math.round(params.capRateScore)}/20 pts`
  );

  explanations.push(
    `Stabilité sous stress → ${Math.round(params.stabilityScore)}/20 pts`
  );

  explanations.push(
    `Qualité des données → ${Math.round(params.dataQualityScore)}/15 pts`
  );

  return explanations;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
