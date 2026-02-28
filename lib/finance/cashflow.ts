/**
 * PlexIQ — Moteur de cashflow
 * Fonctions pures, validées, reproductibles
 */

import type {
  PropertyInput,
  IncomeStatement,
  OperatingExpenses,
  CashflowResult,
} from "./types";
import { calculateMortgage, welcomeTax } from "./mortgage";

// ─── REVENUS ──────────────────────────────────────────────────────────────────

/** Revenu Brut Potentiel (GPI) — loyers annuels, unités occupées */
export function grossPotentialIncome(units: PropertyInput["units"]): number {
  return round2(
    units.reduce((sum, u) => {
      if (u.isOwnerOccupied || u.isVacant) return sum;
      return sum + (u.monthlyRent ?? 0) * 12;
    }, 0)
  );
}

/** Perte de vacance et mauvaises créances */
export function vacancyLoss(gpi: number, vacancyRate: number): number {
  return round2(gpi * clamp(vacancyRate, 0, 1));
}

/** Revenu Brut Effectif (EGI) */
export function effectiveGrossIncome(gpi: number, vacancy: number): number {
  return round2(Math.max(gpi - vacancy, 0));
}

// ─── DÉPENSES ─────────────────────────────────────────────────────────────────

export function operatingExpenses(
  input: PropertyInput,
  egi: number
): OperatingExpenses {
  const { assumption, units } = input;

  const maintenance =
    assumption.maintenanceOverride != null
      ? assumption.maintenanceOverride
      : round2(input.purchasePrice * assumption.maintenanceRate);

  const management = assumption.managementIsPercent
    ? round2(egi * assumption.management)
    : assumption.management;

  const reserveFund = round2(egi * assumption.reserveFund);

  return {
    municipalTaxes: assumption.municipalTaxes,
    schoolTaxes: assumption.schoolTaxes,
    insurance: assumption.insurance,
    maintenance,
    snowRemoval: assumption.snowRemoval,
    landscaping: assumption.landscaping,
    water: assumption.water,
    electricity: assumption.electricity,
    heating: assumption.heating,
    management,
    reserveFund,
    other: assumption.otherExpenses,
  };
}

export function totalOperatingExpenses(opEx: OperatingExpenses): number {
  return round2(Object.values(opEx).reduce((a, b) => a + b, 0));
}

// ─── NOI & CASHFLOW ──────────────────────────────────────────────────────────

/** Net Operating Income = EGI − OpEx */
export function netOperatingIncome(egi: number, totalOpEx: number): number {
  return round2(egi - totalOpEx);
}

/** Résumé compte de résultat */
export function incomeStatement(input: PropertyInput): IncomeStatement {
  const gpi = grossPotentialIncome(input.units);
  const vacancy = vacancyLoss(gpi, input.assumption.vacancyRate);
  const egi = effectiveGrossIncome(gpi, vacancy);
  const opEx = operatingExpenses(input, egi);
  const totalOpEx = totalOperatingExpenses(opEx);
  const noi = netOperatingIncome(egi, totalOpEx);

  return {
    grossPotentialIncome: gpi,
    vacancyLoss: vacancy,
    effectiveGrossIncome: egi,
    operatingExpenses: opEx,
    totalOperatingExpenses: totalOpEx,
    noi,
  };
}

// ─── RATIOS ───────────────────────────────────────────────────────────────────

/** Cap Rate = NOI / Prix d'achat */
export function capRate(noi: number, purchasePrice: number): number {
  if (purchasePrice <= 0) return 0;
  return round4(noi / purchasePrice);
}

/** Gross Rent Multiplier = Prix / Revenu brut annuel */
export function grossRentMultiplier(purchasePrice: number, gpi: number): number {
  if (gpi <= 0) return 0;
  return round2(purchasePrice / gpi);
}

/** Debt Service Coverage Ratio = NOI / Service de la dette */
export function debtServiceCoverageRatio(
  noi: number,
  annualDebtService: number
): number {
  if (annualDebtService <= 0) return 0;
  return round2(noi / annualDebtService);
}

/** Cash-on-Cash = Cashflow avant impôt / Investissement total */
export function cashOnCash(cashflow: number, totalInvestment: number): number {
  if (totalInvestment <= 0) return 0;
  return round4(cashflow / totalInvestment);
}

// ─── CALCUL COMPLET ───────────────────────────────────────────────────────────

export function calculateCashflow(input: PropertyInput): CashflowResult {
  validatePropertyInput(input);

  const statement = incomeStatement(input);
  const mortgageSchedule = calculateMortgage(input.mortgage);

  const annualDebtService = mortgageSchedule.annualDebtService;
  const cashflowBeforeTax = round2(statement.noi - annualDebtService);
  const cashflowMonthly = round2(cashflowBeforeTax / 12);

  // Investissement initial
  const closingCostsAmount = round2(
    input.purchasePrice * input.assumption.closingCosts
  );
  const transferTax =
    input.assumption.transferTax ?? welcomeTax(input.purchasePrice);
  const totalInvestment = round2(
    input.assumption.downPayment +
      closingCostsAmount +
      transferTax +
      input.assumption.renovationBudget +
      (input.mortgage.mortgageInsurance ?? 0)
  );

  const cr = capRate(statement.noi, input.purchasePrice);
  const grm = grossRentMultiplier(
    input.purchasePrice,
    statement.grossPotentialIncome
  );
  const dscr = debtServiceCoverageRatio(statement.noi, annualDebtService);
  const coc = cashOnCash(cashflowBeforeTax, totalInvestment);

  return {
    incomeStatement: statement,
    mortgageSchedule,
    annualDebtService,
    cashflowBeforeTax,
    cashflowMonthly,
    capRate: cr,
    grm,
    dscr,
    cashOnCash: coc,
    downPayment: input.assumption.downPayment,
    closingCostsAmount,
    transferTax,
    totalInvestment,
  };
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

function validatePropertyInput(input: PropertyInput): void {
  if (input.purchasePrice <= 0) throw new Error("Prix d'achat invalide");
  if (input.units.length === 0) throw new Error("Aucune unité fournie");
  if (input.mortgage.loanAmount < 0) throw new Error("Montant hypothèque invalide");
  if (input.assumption.downPayment < 0) throw new Error("Mise de fonds invalide");
  if (
    input.assumption.vacancyRate < 0 ||
    input.assumption.vacancyRate > 1
  )
    throw new Error("Taux de vacance invalide (0–1)");
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(n: number): number {
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(n * 10000) / 10000;
}
