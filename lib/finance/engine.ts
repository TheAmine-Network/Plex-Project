/**
 * PlexIQ — Finance Engine (point d'entrée)
 * Orchestre tous les modules de calcul
 */

import type { PropertyInput, FullAnalysis } from "./types";
import { calculateCashflow } from "./cashflow";
import {
  buildProjections,
  buildIRRCashflows,
  calculateIRR,
} from "./projections";
import { sensitivityAnalysis, worstCaseCashflow } from "./sensitivity";
import { calculateDealScore } from "./score";

export function runFullAnalysis(input: PropertyInput): FullAnalysis {
  // 1. Cashflow de base
  const cashflow = calculateCashflow(input);

  // 2. Projections 10 ans
  const years = input.assumption.projectionYears ?? 10;
  const projections = buildProjections(input, cashflow, years);

  // 3. IRR 5 et 10 ans
  const cashflows5y = buildIRRCashflows(input, cashflow, projections, 5);
  const cashflows10y = buildIRRCashflows(input, cashflow, projections, 10);
  const irr5y = calculateIRR(cashflows5y);
  const irr10y = calculateIRR(cashflows10y);

  // 4. Sensibilité
  const sensitivity = sensitivityAnalysis(input);
  const worstCase = worstCaseCashflow(sensitivity);

  // 5. Score
  // Estimation du nombre de champs manquants (proxy)
  const estimatedFields = countEstimatedFields(input);
  const totalFields = 20; // nombre approximatif de champs clés

  const score = calculateDealScore({
    cashflow,
    sensitivityWorstCase: worstCase,
    estimatedFieldsCount: estimatedFields,
    totalFields,
    buildingAge: undefined,
    hasMajorWorkPlanned: false,
  });

  return {
    cashflow,
    projections,
    irr5y,
    irr10y,
    sensitivity,
    score,
    assumptions: input.assumption,
    computedAt: new Date().toISOString(),
  };
}

function countEstimatedFields(input: PropertyInput): number {
  let estimated = 0;
  const { assumption } = input;

  // Champs souvent estimés
  if (assumption.municipalTaxes === 0) estimated++;
  if (assumption.schoolTaxes === 0) estimated++;
  if (assumption.insurance === 0) estimated++;
  if (assumption.snowRemoval === 0) estimated++;
  if (assumption.water === 0) estimated++;

  // Loyers inconnus
  for (const unit of input.units) {
    if (!unit.monthlyRent || unit.monthlyRent === 0) estimated++;
  }

  return estimated;
}

// Re-exports utiles
export { calculateCashflow } from "./cashflow";
export { calculateMortgage, welcomeTax, schlInsurance } from "./mortgage";
export { buildProjections, calculateIRR } from "./projections";
export { sensitivityAnalysis } from "./sensitivity";
export { calculateDealScore } from "./score";
export type * from "./types";
