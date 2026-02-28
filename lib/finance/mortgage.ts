/**
 * PlexIQ — Calculs hypothécaires Canada
 *
 * En Canada, les hypothèques sont composées semi-annuellement (2x/an)
 * mais les paiements peuvent être mensuels/bimensuels/etc.
 * Formule : i_eff = (1 + annualRate/2)^(1/n) - 1
 * où n = nombre de paiements par année
 */

import type {
  MortgageInput,
  MortgageSchedule,
  AmortizationRow,
  PaymentFrequency,
} from "./types";

const PAYMENTS_PER_YEAR: Record<PaymentFrequency, number> = {
  MONTHLY: 12,
  SEMI_MONTHLY: 24,
  BIWEEKLY: 26,
  WEEKLY: 52,
  ACCELERATED_BIWEEKLY: 26,
  ACCELERATED_WEEKLY: 52,
};

/** Taux effectif par période (méthode canadienne semi-annuelle) */
export function effectivePeriodRate(
  annualRate: number,
  frequency: PaymentFrequency
): number {
  const n = PAYMENTS_PER_YEAR[frequency];
  // Taux semi-annuel effectif
  const semiAnnualRate = annualRate / 2;
  // Taux effectif annuel
  const effectiveAnnualRate = Math.pow(1 + semiAnnualRate, 2) - 1;
  // Taux par période
  return Math.pow(1 + effectiveAnnualRate, 1 / n) - 1;
}

/** Paiement périodique */
export function periodicPayment(input: MortgageInput): number {
  const { loanAmount, annualRate, amortizationYears, paymentFrequency } = input;
  const n = PAYMENTS_PER_YEAR[paymentFrequency];
  const totalPeriods = amortizationYears * n;
  const i = effectivePeriodRate(annualRate, paymentFrequency);

  if (i === 0) return loanAmount / totalPeriods;

  const payment =
    (loanAmount * i * Math.pow(1 + i, totalPeriods)) /
    (Math.pow(1 + i, totalPeriods) - 1);

  return round2(payment);
}

/** Tableau d'amortissement complet */
export function amortizationSchedule(input: MortgageInput): AmortizationRow[] {
  const { loanAmount, amortizationYears, paymentFrequency } = input;
  const n = PAYMENTS_PER_YEAR[paymentFrequency];
  const totalPeriods = amortizationYears * n;
  const i = effectivePeriodRate(annualRate(input), paymentFrequency);
  const payment = periodicPayment(input);
  const rows: AmortizationRow[] = [];

  let balance = loanAmount;

  for (let period = 1; period <= totalPeriods; period++) {
    const interest = round2(balance * i);
    const principal = round2(Math.min(payment - interest, balance));
    balance = round2(Math.max(balance - principal, 0));

    rows.push({ period, payment: round2(payment), principal, interest, balance });

    if (balance === 0) break;
  }

  return rows;
}

/** Calcul complet du service de la dette */
export function calculateMortgage(input: MortgageInput): MortgageSchedule {
  const { paymentFrequency, loanAmount } = input;
  const n = PAYMENTS_PER_YEAR[paymentFrequency];
  const payment = periodicPayment(input);

  // Pour paiements accélérés : paiement = mensuel / (n_base/12)
  // On normalise en mensuel pour les comparaisons
  let monthlyEquivalent: number;
  if (paymentFrequency === "ACCELERATED_BIWEEKLY") {
    // = paiement mensuel / 2 × 26 paiements
    const monthlyBase = periodicPayment({ ...input, paymentFrequency: "MONTHLY" });
    monthlyEquivalent = monthlyBase;
  } else if (paymentFrequency === "ACCELERATED_WEEKLY") {
    const monthlyBase = periodicPayment({ ...input, paymentFrequency: "MONTHLY" });
    monthlyEquivalent = monthlyBase;
  } else {
    monthlyEquivalent = (payment * n) / 12;
  }

  const annualDebtService = round2(payment * n);
  const schedule = amortizationSchedule(input);
  const totalInterest = round2(
    schedule.reduce((sum, row) => sum + row.interest, 0)
  );

  return {
    periodicPayment: payment,
    monthlyPayment: round2(monthlyEquivalent),
    annualDebtService,
    paymentsPerYear: n,
    totalInterest,
    amortizationSchedule: schedule,
  };
}

/** Solde hypothécaire après N années */
export function balanceAfterYears(input: MortgageInput, years: number): number {
  const { paymentFrequency } = input;
  const n = PAYMENTS_PER_YEAR[paymentFrequency];
  const periods = years * n;
  const schedule = amortizationSchedule(input);
  const row = schedule[Math.min(periods - 1, schedule.length - 1)];
  return row?.balance ?? 0;
}

/** Calcul de la taxe de bienvenue (droits de mutation — Québec) */
export function welcomeTax(purchasePrice: number): number {
  // Barème 2024 Québec (municipal + scolaire)
  // Tranche 1: 0–58 900$ → 0.5%
  // Tranche 2: 58 900–294 600$ → 1.0%
  // Tranche 3: 294 600–552 300$ → 1.5%
  // Tranche 4: 552 300–1 104 700$ → 2.0%
  // Tranche 5: >1 104 700$ → 2.5%
  const brackets = [
    { max: 58_900, rate: 0.005 },
    { max: 294_600, rate: 0.01 },
    { max: 552_300, rate: 0.015 },
    { max: 1_104_700, rate: 0.02 },
    { max: Infinity, rate: 0.025 },
  ];

  let tax = 0;
  let prev = 0;

  for (const bracket of brackets) {
    if (purchasePrice <= prev) break;
    const taxable = Math.min(purchasePrice, bracket.max) - prev;
    tax += taxable * bracket.rate;
    prev = bracket.max;
  }

  return round2(tax);
}

/** Assurance prêt SCHL */
export function schlInsurance(ltvRatio: number, loanAmount: number): number {
  // LTV > 80% requis
  if (ltvRatio <= 0.8) return 0;
  let premiumRate: number;
  if (ltvRatio <= 0.85) premiumRate = 0.028;
  else if (ltvRatio <= 0.9) premiumRate = 0.031;
  else if (ltvRatio <= 0.95) premiumRate = 0.04;
  else return 0; // Non admissible >95%
  return round2(loanAmount * premiumRate);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function annualRate(input: MortgageInput): number {
  return input.annualRate;
}

function round2(n: number): number {
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}
