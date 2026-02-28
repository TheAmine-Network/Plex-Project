import { formatCurrency, formatPercent } from "@/lib/utils";
import type { IncomeStatement } from "@/lib/finance/types";
import { Separator } from "@/components/ui/separator";

interface IncomeStatementTableProps {
  statement: IncomeStatement;
  purchasePrice: number;
}

export function IncomeStatementTable({ statement, purchasePrice }: IncomeStatementTableProps) {
  const { operatingExpenses: opEx } = statement;

  const rows = [
    { label: "Revenus bruts potentiels (GPI)", value: statement.grossPotentialIncome, indent: false, bold: false },
    { label: "Perte vacance et créances", value: -statement.vacancyLoss, indent: true, bold: false },
    { label: "Revenus effectifs (EGI)", value: statement.effectiveGrossIncome, indent: false, bold: true },
    null, // spacer
    { label: "Taxes municipales", value: -opEx.municipalTaxes, indent: true, bold: false },
    { label: "Taxes scolaires", value: -opEx.schoolTaxes, indent: true, bold: false },
    { label: "Assurances", value: -opEx.insurance, indent: true, bold: false },
    { label: "Entretien et réparations", value: -opEx.maintenance, indent: true, bold: false },
    { label: "Déneigement", value: -opEx.snowRemoval, indent: true, bold: false },
    { label: "Eau", value: -opEx.water, indent: true, bold: false },
    { label: "Électricité (parties communes)", value: -opEx.electricity, indent: true, bold: false },
    { label: "Chauffage", value: -opEx.heating, indent: true, bold: false },
    { label: "Gestion", value: -opEx.management, indent: true, bold: false },
    { label: "Fonds de réserve", value: -opEx.reserveFund, indent: true, bold: false },
    { label: "Autres dépenses", value: -opEx.other, indent: true, bold: false },
    { label: "Total dépenses opération", value: -statement.totalOperatingExpenses, indent: false, bold: true },
    null,
    { label: "Revenu Net d'Opération (NOI)", value: statement.noi, indent: false, bold: true },
  ];

  return (
    <div className="space-y-0.5">
      {rows.map((row, idx) => {
        if (!row) return <Separator key={idx} className="my-2" />;

        const isNegative = row.value < 0;
        const isZero = row.value === 0;

        if (isZero && row.indent) return null; // cacher dépenses à zéro

        return (
          <div
            key={idx}
            className={`flex items-center justify-between py-1 ${row.indent ? "pl-4" : ""} ${row.bold ? "border-t border-border mt-1 pt-2" : ""}`}
          >
            <span className={`text-sm ${row.bold ? "font-semibold" : "text-muted-foreground"}`}>
              {row.label}
            </span>
            <span className={`text-sm tabular-nums ${row.bold ? "font-semibold" : ""} ${isNegative ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
              {isNegative ? `(${formatCurrency(Math.abs(row.value))})` : formatCurrency(row.value)}
            </span>
          </div>
        );
      })}

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Cap rate</span>
        <span className="text-sm font-semibold">
          {formatPercent(statement.noi / purchasePrice)}
        </span>
      </div>
    </div>
  );
}
