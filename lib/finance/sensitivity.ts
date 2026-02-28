/**
 * PlexIQ — Analyse de sensibilité
 * Matrice: variation d'une variable → impact cashflow / DSCR
 */

import type { PropertyInput, SensitivityResult } from "./types";
import { calculateCashflow } from "./cashflow";

export function sensitivityAnalysis(
  baseInput: PropertyInput
): SensitivityResult[] {
  return [
    sensitivityInterestRate(baseInput),
    sensitivityVacancy(baseInput),
    sensitivityRents(baseInput),
    sensitivityMaintenance(baseInput),
    sensitivityTaxes(baseInput),
  ];
}

function sensitivityInterestRate(base: PropertyInput): SensitivityResult {
  const deltas = [-0.02, -0.01, 0, 0.01, 0.02];
  const baseRate = base.mortgage.annualRate;

  return buildResult(
    "interestRate",
    "Taux d'intérêt",
    baseRate,
    deltas,
    deltas.map((d) => ({
      ...base,
      mortgage: { ...base.mortgage, annualRate: Math.max(0.001, baseRate + d) },
    }))
  );
}

function sensitivityVacancy(base: PropertyInput): SensitivityResult {
  const deltas = [-0.03, -0.02, 0, 0.02, 0.05];
  const baseVacancy = base.assumption.vacancyRate;

  return buildResult(
    "vacancyRate",
    "Taux de vacance",
    baseVacancy,
    deltas,
    deltas.map((d) => ({
      ...base,
      assumption: {
        ...base.assumption,
        vacancyRate: clamp(baseVacancy + d, 0, 1),
      },
    }))
  );
}

function sensitivityRents(base: PropertyInput): SensitivityResult {
  const deltas = [-0.1, -0.05, 0, 0.05, 0.1];
  const baseMonthly =
    base.units.reduce((s, u) => s + (u.monthlyRent ?? 0), 0) /
    Math.max(base.units.length, 1);

  return buildResult(
    "rentLevel",
    "Niveau de loyers",
    baseMonthly,
    deltas,
    deltas.map((d) => ({
      ...base,
      units: base.units.map((u) => ({
        ...u,
        monthlyRent: (u.monthlyRent ?? 0) * (1 + d),
      })),
    }))
  );
}

function sensitivityMaintenance(base: PropertyInput): SensitivityResult {
  const deltas = [-0.5, -0.25, 0, 0.25, 0.5];
  const baseMaintenance =
    base.assumption.maintenanceOverride ??
    base.purchasePrice * base.assumption.maintenanceRate;

  return buildResult(
    "maintenance",
    "Entretien",
    baseMaintenance,
    deltas,
    deltas.map((d) => ({
      ...base,
      assumption: {
        ...base.assumption,
        maintenanceOverride: Math.max(0, baseMaintenance * (1 + d)),
      },
    }))
  );
}

function sensitivityTaxes(base: PropertyInput): SensitivityResult {
  const deltas = [-0.1, -0.05, 0, 0.05, 0.1];
  const baseTaxes =
    base.assumption.municipalTaxes + base.assumption.schoolTaxes;

  return buildResult(
    "taxes",
    "Taxes foncières",
    baseTaxes,
    deltas,
    deltas.map((d) => ({
      ...base,
      assumption: {
        ...base.assumption,
        municipalTaxes: base.assumption.municipalTaxes * (1 + d),
        schoolTaxes: base.assumption.schoolTaxes * (1 + d),
      },
    }))
  );
}

function buildResult(
  variable: string,
  label: string,
  baseValue: number,
  deltas: number[],
  inputs: PropertyInput[]
): SensitivityResult {
  const scenarios = inputs.map((input, idx) => {
    const result = calculateCashflow(input);
    return {
      delta: deltas[idx],
      value: baseValue * (1 + deltas[idx]),
      cashflowMonthly: result.cashflowMonthly,
      dscr: result.dscr,
      capRate: result.capRate,
    };
  });

  return { variable, label, baseValue, deltas, scenarios };
}

export function worstCaseCashflow(sensitivity: SensitivityResult[]): number {
  let worst = Infinity;
  for (const s of sensitivity) {
    for (const scenario of s.scenarios) {
      if (scenario.cashflowMonthly < worst) worst = scenario.cashflowMonthly;
    }
  }
  return worst === Infinity ? 0 : worst;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
