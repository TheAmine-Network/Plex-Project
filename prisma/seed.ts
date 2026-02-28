/**
 * PlexIQ — Seed data (exemple: triplex Montréal)
 * Run: npm run db:seed
 */
import { PrismaClient, Plan, PaymentFrequency, DealVerdict } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PlexIQ...");

  // Demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@plexiq.ca" },
    update: {},
    create: {
      email: "demo@plexiq.ca",
      supabaseId: "demo-supabase-id-000",
      name: "Marie Tremblay",
      plan: Plan.PRO,
    },
  });

  // Property: Triplex Rosemont
  const property = await prisma.property.create({
    data: {
      userId: user.id,
      name: "Triplex Rosemont",
      address: "1234 Rue Masson",
      city: "Montréal",
      province: "QC",
      postalCode: "H2G 1T2",
      propertyType: "TRIPLEX",
      yearBuilt: 1965,
      totalUnits: 3,
      totalArea: 3200,
      askingPrice: 1_050_000,
      purchasePrice: 1_020_000,
      sourceUrl: "https://www.centris.ca/fr/triplex~a-vendre~montreal/example",
      isFavorite: true,
    },
  });

  // Units
  await prisma.propertyUnit.createMany({
    data: [
      {
        propertyId: property.id,
        unitLabel: "Rez-de-chaussée (5½)",
        bedrooms: 3,
        bathrooms: 1,
        area: 1100,
        monthlyRent: 1650,
        marketRent: 1900,
        isVacant: false,
        heatingIncluded: true,
      },
      {
        propertyId: property.id,
        unitLabel: "2e étage (4½)",
        bedrooms: 2,
        bathrooms: 1,
        area: 950,
        monthlyRent: 1420,
        marketRent: 1700,
        isVacant: false,
        heatingIncluded: false,
      },
      {
        propertyId: property.id,
        unitLabel: "3e étage (3½)",
        bedrooms: 1,
        bathrooms: 1,
        area: 750,
        monthlyRent: 1100,
        marketRent: 1350,
        isVacant: true,
        heatingIncluded: false,
      },
    ],
  });

  // Assumptions
  const assumption = await prisma.assumption.create({
    data: {
      propertyId: property.id,
      isDefault: true,
      label: "Scénario de base",
      vacancyRate: 0.05,
      annualRentIncrease: 0.03,
      municipalTaxes: 9800,
      schoolTaxes: 1200,
      insurance: 4200,
      maintenanceRate: 0.02,
      snowRemoval: 1400,
      water: 800,
      electricity: 1200,
      management: 0.08,
      managementIsPercent: true,
      reserveFund: 0.03,
      inflationRate: 0.02,
      exitCapRate: 0.055,
      projectionYears: 10,
      closingCosts: 0.015,
      renovationBudget: 15_000,
    },
  });

  // Mortgage (mise de fonds 20%)
  const downPayment = 204_000; // ~20% of 1_020_000
  const mortgage = await prisma.mortgage.create({
    data: {
      propertyId: property.id,
      loanAmount: 1_020_000 - downPayment,
      interestRate: 0.0549,
      amortizationYears: 25,
      termYears: 5,
      paymentFrequency: PaymentFrequency.MONTHLY,
      isVariable: false,
      label: "Hypothèque principale — TD 5 ans fixe",
    },
  });

  // Analysis snapshot (pré-calculé pour seed)
  const mockResults = {
    gpi: 50_040,
    vacancyLoss: 2_502,
    egi: 47_538,
    operatingExpenses: 24_660,
    noi: 22_878,
    annualDebtService: 32_820,
    cashflowAnnual: -9_942,
    cashflowMonthly: -828.5,
    capRate: 0.0224,
    grm: 20.98,
    dscr: 0.697,
    irr5y: null,
    irr10y: 0.092,
    dealScore: 38,
    dealVerdict: "NO_GO",
  };

  await prisma.analysis.create({
    data: {
      userId: user.id,
      propertyId: property.id,
      assumptionId: assumption.id,
      mortgageId: mortgage.id,
      results: mockResults,
      inputSnapshot: { note: "Seed data — loyers actuels sous-marché" },
      cashflowMonthly: mockResults.cashflowMonthly,
      cashflowAnnual: mockResults.cashflowAnnual,
      capRate: mockResults.capRate,
      grm: mockResults.grm,
      dscr: mockResults.dscr,
      noi: mockResults.noi,
      dealScore: mockResults.dealScore,
      dealVerdict: DealVerdict.NO_GO,
      label: "Analyse initiale — loyers actuels",
      notes: "Cashflow négatif avec loyers actuels. Potentiel à 24 mois si loyers portés au marché.",
    },
  });

  console.log("✅ Seed terminé.");
  console.log(`   User: ${user.email}`);
  console.log(`   Property: ${property.name} (${property.address})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
