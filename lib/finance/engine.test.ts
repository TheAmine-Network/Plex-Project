/**
 * PlexIQ — Tests unitaires du moteur financier
 * Run: npm test
 */

import { describe, it, expect } from "vitest";
import {
  grossPotentialIncome,
  vacancyLoss,
  effectiveGrossIncome,
  netOperatingIncome,
  capRate,
  grossRentMultiplier,
  debtServiceCoverageRatio,
  calculateCashflow,
} from "./cashflow";
import {
  periodicPayment,
  effectivePeriodRate,
  welcomeTax,
  schlInsurance,
} from "./mortgage";
import { calculateIRR } from "./projections";
import { runFullAnalysis } from "./engine";
import type { PropertyInput } from "./types";

// ─── FIXTURE ─────────────────────────────────────────────────────────────────

const sampleInput: PropertyInput = {
  purchasePrice: 1_020_000,
  units: [
    { monthlyRent: 1650, isVacant: false, isOwnerOccupied: false, heatingIncluded: true },
    { monthlyRent: 1420, isVacant: false, isOwnerOccupied: false, heatingIncluded: false },
    { monthlyRent: 1100, isVacant: true, isOwnerOccupied: false, heatingIncluded: false },
  ],
  assumption: {
    vacancyRate: 0.05,
    annualRentIncrease: 0.03,
    municipalTaxes: 9800,
    schoolTaxes: 1200,
    insurance: 4200,
    maintenanceRate: 0.02,
    snowRemoval: 1400,
    landscaping: 0,
    water: 800,
    electricity: 1200,
    heating: 0,
    management: 0.08,
    managementIsPercent: true,
    reserveFund: 0.03,
    otherExpenses: 0,
    inflationRate: 0.02,
    exitCapRate: 0.055,
    projectionYears: 10,
    closingCosts: 0.015,
    renovationBudget: 15_000,
    downPayment: 204_000,
  },
  mortgage: {
    loanAmount: 816_000,
    annualRate: 0.0549,
    amortizationYears: 25,
    paymentFrequency: "MONTHLY",
    mortgageInsurance: 0,
  },
};

// ─── REVENUS ─────────────────────────────────────────────────────────────────

describe("grossPotentialIncome", () => {
  it("ne compte pas les unités vacantes", () => {
    // 2 unités occupées: 1650 + 1420 = 3070/mois → 36840/an
    expect(grossPotentialIncome(sampleInput.units)).toBe(36_840);
  });

  it("ne compte pas les unités propriétaire-occupées", () => {
    const units = [
      { monthlyRent: 1500, isVacant: false, isOwnerOccupied: true, heatingIncluded: false },
      { monthlyRent: 1200, isVacant: false, isOwnerOccupied: false, heatingIncluded: false },
    ];
    expect(grossPotentialIncome(units)).toBe(14_400);
  });

  it("retourne 0 si tout vacant", () => {
    const units = [
      { monthlyRent: 1500, isVacant: true, isOwnerOccupied: false, heatingIncluded: false },
    ];
    expect(grossPotentialIncome(units)).toBe(0);
  });
});

describe("vacancyLoss", () => {
  it("calcule correctement à 5%", () => {
    expect(vacancyLoss(36_840, 0.05)).toBe(1842);
  });

  it("plafonne à 100%", () => {
    expect(vacancyLoss(36_840, 1.5)).toBe(36_840);
  });

  it("ne retourne jamais négatif", () => {
    expect(vacancyLoss(36_840, -0.1)).toBe(0);
  });
});

describe("netOperatingIncome", () => {
  it("calcule correctement", () => {
    expect(netOperatingIncome(40_000, 25_000)).toBe(15_000);
  });
});

describe("ratios", () => {
  it("cap rate correct", () => {
    expect(capRate(50_000, 1_000_000)).toBeCloseTo(0.05, 4);
  });

  it("GRM correct", () => {
    expect(grossRentMultiplier(1_000_000, 50_000)).toBe(20);
  });

  it("DSCR correct", () => {
    expect(debtServiceCoverageRatio(40_000, 32_000)).toBe(1.25);
  });

  it("DSCR retourne 0 si dette nulle", () => {
    expect(debtServiceCoverageRatio(40_000, 0)).toBe(0);
  });
});

// ─── HYPOTHÈQUE ─────────────────────────────────────────────────────────────

describe("mortgage (méthode canadienne)", () => {
  it("taux effectif mensuel cohérent avec taux nominal 5.49%", () => {
    const rate = effectivePeriodRate(0.0549, "MONTHLY");
    // Taux semi-annuel = 2.745%, annuel effectif ≈ 5.565%, mensuel ≈ 0.4523%
    expect(rate).toBeGreaterThan(0.004);
    expect(rate).toBeLessThan(0.005);
  });

  it("paiement mensuel pour 816k$ / 25 ans / 5.49%", () => {
    const payment = periodicPayment({
      loanAmount: 816_000,
      annualRate: 0.0549,
      amortizationYears: 25,
      paymentFrequency: "MONTHLY",
    });
    // Attendu: ~4900–5100$/mois
    expect(payment).toBeGreaterThan(4500);
    expect(payment).toBeLessThan(5500);
  });

  it("paiement bimensuel > paiement mensuel / 2 (accélération)", () => {
    const monthly = periodicPayment({
      loanAmount: 500_000,
      annualRate: 0.05,
      amortizationYears: 25,
      paymentFrequency: "MONTHLY",
    });
    const biweekly = periodicPayment({
      loanAmount: 500_000,
      annualRate: 0.05,
      amortizationYears: 25,
      paymentFrequency: "BIWEEKLY",
    });
    // 26 paiements bimensuels/an vs 12 mensuels
    expect(biweekly * 26).toBeGreaterThan(monthly * 12);
  });
});

describe("welcomeTax (taxe de bienvenue QC)", () => {
  it("propriété à 300k$", () => {
    const tax = welcomeTax(300_000);
    // Tranche 1: 58900 * 0.5% = 294.50
    // Tranche 2: (294600-58900) * 1% = 2357
    // Tranche 3: (300000-294600) * 1.5% = 81
    // Total ≈ 2732.50
    expect(tax).toBeGreaterThan(2500);
    expect(tax).toBeLessThan(3000);
  });

  it("propriété à 1M$", () => {
    const tax = welcomeTax(1_000_000);
    expect(tax).toBeGreaterThan(14_000);
    expect(tax).toBeLessThan(18_000);
  });
});

describe("schlInsurance", () => {
  it("pas d'assurance si LTV <= 80%", () => {
    expect(schlInsurance(0.8, 800_000)).toBe(0);
  });

  it("2.8% si LTV 80–85%", () => {
    expect(schlInsurance(0.85, 850_000)).toBeCloseTo(850_000 * 0.028, 0);
  });

  it("4% si LTV 90–95%", () => {
    expect(schlInsurance(0.95, 950_000)).toBeCloseTo(950_000 * 0.04, 0);
  });
});

// ─── IRR ─────────────────────────────────────────────────────────────────────

describe("IRR", () => {
  it("calcule correctement un IRR simple", () => {
    // Investissement -1000, retours 300, 400, 500 → IRR ~13%
    const result = calculateIRR([-1000, 300, 400, 500]);
    expect(result.irr).not.toBeNull();
    expect(result.irr!).toBeGreaterThan(0.1);
    expect(result.irr!).toBeLessThan(0.2);
  });

  it("retourne null si flux toujours négatifs", () => {
    const result = calculateIRR([-1000, -200, -300]);
    expect(result.irr).toBeNull();
  });

  it("retourne null si flux toujours positifs", () => {
    const result = calculateIRR([1000, 200, 300]);
    // Pas d'investissement initial — IRR indéfini
    expect(result.irr).toBeNull();
  });
});

// ─── INTÉGRATION ─────────────────────────────────────────────────────────────

describe("calculateCashflow (intégration)", () => {
  it("retourne des résultats cohérents pour le triplex Rosemont", () => {
    const result = calculateCashflow(sampleInput);

    expect(result.incomeStatement.grossPotentialIncome).toBeGreaterThan(0);
    expect(result.incomeStatement.noi).toBeGreaterThan(0);
    expect(result.capRate).toBeGreaterThan(0);
    expect(result.capRate).toBeLessThan(0.15);
    expect(result.grm).toBeGreaterThan(5);
    expect(result.grm).toBeLessThan(50);
    expect(result.totalInvestment).toBeGreaterThan(0);
  });

  it("cashflow avant impôt = NOI − service de la dette", () => {
    const result = calculateCashflow(sampleInput);
    const expected =
      result.incomeStatement.noi - result.annualDebtService;
    expect(result.cashflowBeforeTax).toBeCloseTo(expected, 1);
  });
});

describe("runFullAnalysis (intégration complète)", () => {
  it("produit une analyse complète sans erreur", () => {
    const analysis = runFullAnalysis(sampleInput);

    expect(analysis.cashflow).toBeDefined();
    expect(analysis.projections).toHaveLength(10);
    expect(analysis.irr10y).toBeDefined();
    expect(analysis.sensitivity).toHaveLength(5);
    expect(analysis.score.score).toBeGreaterThanOrEqual(0);
    expect(analysis.score.score).toBeLessThanOrEqual(100);
    expect(["GO", "NEUTRAL", "NO_GO"]).toContain(analysis.score.verdict);
  });

  it("projections croissantes sur les revenus (hausse loyers 3%)", () => {
    const analysis = runFullAnalysis(sampleInput);
    const firstYear = analysis.projections[0].gpi;
    const lastYear = analysis.projections[9].gpi;
    expect(lastYear).toBeGreaterThan(firstYear);
  });
});
