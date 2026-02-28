"use client";

import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { SensitivityResult } from "@/lib/finance/sensitivity";

interface SensitivityTableProps {
  data: SensitivityResult[];
}

export function SensitivityTable({ data }: SensitivityTableProps) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.variable}>
          <p className="text-sm font-medium text-muted-foreground mb-2">{item.label}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left pb-1 font-medium">Scénario</th>
                  <th className="text-right pb-1 font-medium">Cashflow/mois</th>
                  <th className="text-right pb-1 font-medium">DSCR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {item.scenarios.map((s, idx) => {
                  const isBase = s.delta === 0;
                  const isPositive = s.cashflowMonthly >= 0;
                  return (
                    <tr
                      key={idx}
                      className={cn(
                        "transition-colors",
                        isBase && "bg-muted/50 font-medium"
                      )}
                    >
                      <td className="py-1.5 pr-4">
                        {isBase ? "Base" : s.delta > 0 ? `+${formatPercent(s.delta, 0)}` : `${formatPercent(s.delta, 0)}`}
                      </td>
                      <td className={cn(
                        "py-1.5 text-right tabular-nums",
                        isPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                      )}>
                        {formatCurrency(s.cashflowMonthly)}
                      </td>
                      <td className={cn(
                        "py-1.5 text-right tabular-nums",
                        s.dscr >= 1.2 ? "text-green-700 dark:text-green-400" :
                        s.dscr >= 1.0 ? "text-amber-700 dark:text-amber-400" :
                        "text-red-700 dark:text-red-400"
                      )}>
                        {s.dscr.toFixed(2)}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
