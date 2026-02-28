/**
 * PlexIQ — Finance Engine Types
 * Toutes les interfaces du moteur de calcul financier
 */

// ─── INPUTS ──────────────────────────────────────────────────────────────────

export interface UnitInput {
  monthlyRent: number;       // 0 si vacant
  isVacant: boolean;
  isOwnerOccupied: boolean;
  heatingIncluded: boolean;  // loyer inclut chauffage
}

export interface AssumptionInput {
  // Revenus
  vacancyRate: number;          // 0.05 = 5%
  annualRentIncrease: number;   // 0.03 = 3%/an

  // Dépenses annuelles ($)
  municipalTaxes: number;
  schoolTaxes: number;
  insurance: number;
  maintenanceRate: number;       // % du prix d'achat si pas d'override
  maintenanceOverride?: number;  // $ fixe prioritaire
  snowRemoval: number;
  landscaping: number;
  water: number;
  electricity: number;
  heating: number;
  management: number;            // $ ou %
  managementIsPercent: boolean;
  reserveFund: number;           // % du revenu brut
  otherExpenses: number;

  // Projections
  inflationRate: number;        // 0.02 = 2%
  exitCapRate: number;          // 0.055
  projectionYears: number;      // 5 ou 10

  // Acquisition
  closingCosts: number;         // % prix achat (1–2%)
  renovationBudget: number;
  transferTax?: number;         // si fourni manuellement
  downPayment: number;          // $
}

export interface MortgageInput {
  loanAmount: number;
  annualRate: number;            // 0.0549
  amortizationYears: number;    // 25
  paymentFrequency: PaymentFrequency;
  mortgageInsurance?: number;   // $ (SCHL)
}

export type PaymentFrequency =
  | "MONTHLY"
  | "SEMI_MONTHLY"
  | "BIWEEKLY"
  | "WEEKLY"
  | "ACCELERATED_BIWEEKLY"
  | "ACCELERATED_WEEKLY";

export interface PropertyInput {
  purchasePrice: number;
  units: UnitInput[];
  assumption: AssumptionInput;
  mortgage: MortgageInput;
}

// ─── OUTPUTS ─────────────────────────────────────────────────────────────────

export interface IncomeStatement {
  // Gross Potential Income
  grossPotentialIncome: number;   // GPI — 100% occupancy
  vacancyLoss: number;
  effectiveGrossIncome: number;   // EGI = GPI − vacancy

  // Dépenses
  operatingExpenses: OperatingExpenses;
  totalOperatingExpenses: number;

  // Résultats
  noi: number;                    // NOI = EGI − OpEx
}

export interface OperatingExpenses {
  municipalTaxes: number;
  schoolTaxes: number;
  insurance: number;
  maintenance: number;
  snowRemoval: number;
  landscaping: number;
  water: number;
  electricity: number;
  heating: number;
  management: number;
  reserveFund: number;
  other: number;
}

export interface MortgageSchedule {
  periodicPayment: number;       // paiement par période
  monthlyPayment: number;        // normalisé mensuel
  annualDebtService: number;
  paymentsPerYear: number;
  totalInterest: number;         // sur toute l'amortisation
  amortizationSchedule: AmortizationRow[];
}

export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface CashflowResult {
  incomeStatement: IncomeStatement;
  mortgageSchedule: MortgageSchedule;

  // Résultats clés
  annualDebtService: number;
  cashflowBeforeTax: number;     // NOI − dette
  cashflowMonthly: number;

  // Ratios
  capRate: number;               // NOI / prix achat
  grm: number;                   // prix / revenu brut annuel
  dscr: number;                  // NOI / dette
  cashOnCash: number;            // cashflow / mise de fonds totale

  // Investissement initial
  downPayment: number;
  closingCostsAmount: number;
  transferTax: number;
  totalInvestment: number;       // mise de fonds + frais + rénovations
}

export interface ProjectionYear {
  year: number;
  gpi: number;
  egi: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashflow: number;
  propertyValue: number;         // valeur estimée via cap rate de sortie
  equity: number;                // valeur − solde hypothèque
  cumulativeCashflow: number;
}

export interface IRRResult {
  irr: number | null;            // null si calcul impossible
  npv: number;                   // à taux 0
  cashflows: number[];           // flux année 0 = mise de fonds (négatif)
}

export interface SensitivityMatrix {
  variable: "interestRate" | "vacancyRate" | "rentGrowth" | "maintenance";
  baseValue: number;
  deltas: number[];              // ex: [-0.02, -0.01, 0, +0.01, +0.02]
  cashflowImpact: number[];
  dscrImpact: number[];
}

export interface DealScore {
  score: number;                 // 0–100
  verdict: "GO" | "NEUTRAL" | "NO_GO";
  breakdown: ScoreBreakdown;
  flags: DealFlag[];
  explanations: string[];
}

export interface ScoreBreakdown {
  cashflowScore: number;         // /25
  dscrScore: number;             // /20
  capRateScore: number;          // /20
  stabilityScore: number;        // /20 (sensibilité)
  dataQualityScore: number;      // /15 (pénalité données manquantes)
}

export interface DealFlag {
  type: "warning" | "danger" | "info";
  code: string;
  label: string;
  detail?: string;
}

export interface FullAnalysis {
  cashflow: CashflowResult;
  projections: ProjectionYear[];
  irr5y: IRRResult;
  irr10y: IRRResult;
  sensitivity: SensitivityMatrix[];
  score: DealScore;
  assumptions: AssumptionInput;
  computedAt: string;            // ISO timestamp
}
