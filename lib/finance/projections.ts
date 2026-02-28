/**
 * PlexIQ — Projections pluriannuelles & IRR
 */

import type {
  PropertyInput,
  ProjectionYear,
  IRRResult,
  CashflowResult,
} from "./types";
import {
  grossPotentialIncome,
  netOperatingIncome,
  totalOperatingExpenses,
  operatingExpenses,
  effectiveGrossIncome,
  vacancyLoss,
} from "./cashflow";
import { balanceAfterYears } from "./mortgage";

// ─── PROJECTIONS ─────────────────────────────────────────────────────────────

export function buildProjections(
  input: PropertyInput,
  baseCashflow: CashflowResult,
  years: number
): ProjectionYear[] {
  const { assumption } = input;
  const baseGpi = baseCashflow.incomeStatement.grossPotentialIncome;
  const baseOpEx = baseCashflow.incomeStatement.totalOperatingExpenses;
  const annualDebtService = baseCashflow.annualDebtService;
  let cumulative = 0;

  return Array.from({ length: years }, (_, idx) => {
    const year = idx + 1;
    const rentMultiplier = Math.pow(1 + assumption.annualRentIncrease, year);
    const inflationMultiplier = Math.pow(1 + assumption.inflationRate, year);

    const gpi = round2(baseGpi * rentMultiplier);
    const vacancy = vacancyLoss(gpi, assumption.vacancyRate);
    const egi = effectiveGrossIncome(gpi, vacancy);

    // Dépenses indexées à l'inflation (sauf fonds de réserve qui suit le revenu)
    const opEx = round2(baseOpEx * inflationMultiplier);
    const noi = netOperatingIncome(egi, opEx);

    const cashflow = round2(noi - annualDebtService);
    cumulative = round2(cumulative + cashflow);

    // Valeur estimée : NOI / cap rate de sortie
    const propertyValue =
      assumption.exitCapRate > 0
        ? round2(noi / assumption.exitCapRate)
        : input.purchasePrice;

    // Équité = valeur − solde hypothèque
    const mortgageBalance = balanceAfterYears(input.mortgage, year);
    const equity = round2(propertyValue - mortgageBalance);

    return {
      year,
      gpi,
      egi,
      operatingExpenses: opEx,
      noi,
      debtService: annualDebtService,
      cashflow,
      propertyValue,
      equity,
      cumulativeCashflow: cumulative,
    };
  });
}

// ─── IRR ─────────────────────────────────────────────────────────────────────

/**
 * Calcul du TRI (IRR) par méthode Newton-Raphson
 * cashflows[0] = investissement initial (négatif)
 * cashflows[1..n] = cashflows annuels + revente nette en dernière année
 */
export function calculateIRR(cashflows: number[]): IRRResult {
  if (cashflows.length < 2) {
    return { irr: null, npv: sumCashflows(cashflows), cashflows };
  }

  const npv = sumCashflows(cashflows);

  // Tentative Newton-Raphson
  let rate = 0.1; // estimation initiale
  const MAX_ITER = 1000;
  const TOLERANCE = 1e-7;

  for (let i = 0; i < MAX_ITER; i++) {
    const { f, df } = npvAndDerivative(cashflows, rate);

    if (Math.abs(df) < 1e-12) break;

    const newRate = rate - f / df;

    if (Math.abs(newRate - rate) < TOLERANCE) {
      if (newRate < -1) return { irr: null, npv, cashflows };
      return { irr: round4(newRate), npv, cashflows };
    }

    rate = newRate;
    if (rate < -1) rate = -0.99; // garde-fou
  }

  // Fallback : bisection
  const irrBisect = bisectionIRR(cashflows);
  return { irr: irrBisect, npv, cashflows };
}

/** Flux pour calcul IRR sur N années */
export function buildIRRCashflows(
  input: PropertyInput,
  baseCashflow: CashflowResult,
  projections: ProjectionYear[],
  horizonYears: number
): number[] {
  const year0 = -baseCashflow.totalInvestment; // mise de fonds + frais
  const annualCashflows = projections
    .slice(0, horizonYears)
    .map((p) => p.cashflow);

  // Revente nette en dernière année
  const lastProjection = projections[horizonYears - 1];
  if (!lastProjection) return [year0];

  const mortgageBalance = balanceAfterYears(input.mortgage, horizonYears);
  const sellingCosts = round2(lastProjection.propertyValue * 0.05); // ~5% frais vente
  const netProceeds = round2(
    lastProjection.propertyValue - mortgageBalance - sellingCosts
  );

  const flows = [year0, ...annualCashflows];
  flows[flows.length - 1] = round2(flows[flows.length - 1] + netProceeds);

  return flows;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function npvAndDerivative(
  cashflows: number[],
  rate: number
): { f: number; df: number } {
  let f = 0;
  let df = 0;

  for (let t = 0; t < cashflows.length; t++) {
    const denom = Math.pow(1 + rate, t);
    f += cashflows[t] / denom;
    if (t > 0) df -= (t * cashflows[t]) / Math.pow(1 + rate, t + 1);
  }

  return { f, df };
}

function bisectionIRR(cashflows: number[]): number | null {
  let lo = -0.99;
  let hi = 10.0;

  const npvAt = (r: number) =>
    cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + r, t), 0);

  if (Math.sign(npvAt(lo)) === Math.sign(npvAt(hi))) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npvAt(mid) > 0) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-7) return round4(mid);
  }

  return round4((lo + hi) / 2);
}

function sumCashflows(cashflows: number[]): number {
  return cashflows.reduce((a, b) => a + b, 0);
}

function round2(n: number): number {
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(n * 10000) / 10000;
}
