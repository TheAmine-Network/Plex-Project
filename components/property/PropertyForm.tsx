"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

const unitSchema = z.object({
  unitLabel: z.string().min(1, "Requis"),
  monthlyRent: z.coerce.number().min(0),
  isVacant: z.boolean().default(false),
  isOwnerOccupied: z.boolean().default(false),
  heatingIncluded: z.boolean().default(false),
  bedrooms: z.coerce.number().int().min(0).optional(),
});

const formSchema = z.object({
  // Propriété
  name: z.string().min(2, "Requis (min 2 caractères)"),
  address: z.string().min(5, "Requis"),
  city: z.string().min(2, "Requis"),
  propertyType: z.enum(["DUPLEX", "TRIPLEX", "QUADRUPLEX", "FIVE_UNITS", "SIX_UNITS"]),
  yearBuilt: z.coerce.number().int().min(1800).max(2025).optional(),
  askingPrice: z.coerce.number().min(1, "Requis"),
  sourceUrl: z.string().url().optional().or(z.literal("")),

  // Unités
  units: z.array(unitSchema).min(1),

  // Hypothèque
  downPayment: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0.001).max(0.3),
  amortizationYears: z.coerce.number().int().min(5).max(30).default(25),
  termYears: z.coerce.number().int().min(1).max(10).default(5),

  // Dépenses
  municipalTaxes: z.coerce.number().min(0),
  schoolTaxes: z.coerce.number().min(0),
  insurance: z.coerce.number().min(0),
  snowRemoval: z.coerce.number().min(0).default(1400),
  water: z.coerce.number().min(0).default(0),
  management: z.coerce.number().min(0).max(0.3).default(0.08),
  managementIsPercent: z.boolean().default(true),
  maintenanceRate: z.coerce.number().min(0).max(0.1).default(0.02),

  // Hypothèses
  vacancyRate: z.coerce.number().min(0).max(1).default(0.05),
  renovationBudget: z.coerce.number().min(0).default(0),
  closingCosts: z.coerce.number().min(0).max(0.1).default(0.015),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_UNITS = {
  DUPLEX: 2,
  TRIPLEX: 3,
  QUADRUPLEX: 4,
  FIVE_UNITS: 5,
  SIX_UNITS: 6,
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function PropertyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyType: "TRIPLEX",
      interestRate: 0.0549,
      amortizationYears: 25,
      termYears: 5,
      vacancyRate: 0.05,
      maintenanceRate: 0.02,
      management: 0.08,
      managementIsPercent: true,
      snowRemoval: 1400,
      closingCosts: 0.015,
      units: [
        { unitLabel: "Logement 1", monthlyRent: 0, isVacant: false, isOwnerOccupied: false, heatingIncluded: false },
        { unitLabel: "Logement 2", monthlyRent: 0, isVacant: false, isOwnerOccupied: false, heatingIncluded: false },
        { unitLabel: "Logement 3", monthlyRent: 0, isVacant: false, isOwnerOccupied: false, heatingIncluded: false },
      ],
    },
  });

  const { fields: unitFields, append, remove } = useFieldArray({ control, name: "units" });

  const askingPrice = watch("askingPrice") || 0;
  const downPayment = watch("downPayment") || 0;
  const loanAmount = Math.max(askingPrice - downPayment, 0);
  const ltv = askingPrice > 0 ? loanAmount / askingPrice : 0;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const { propertyId } = await res.json();
      router.push(`/app/property/${propertyId}`);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Propriété */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Informations de base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nom de la propriété" error={errors.name?.message} required>
              <Input {...register("name")} placeholder="Triplex Rosemont" />
            </FormField>
            <FormField label="Type" error={errors.propertyType?.message} required>
              <select
                {...register("propertyType")}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="DUPLEX">Duplex (2 logements)</option>
                <option value="TRIPLEX">Triplex (3 logements)</option>
                <option value="QUADRUPLEX">Quadruplex (4 logements)</option>
                <option value="FIVE_UNITS">5 logements</option>
                <option value="SIX_UNITS">6 logements</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Adresse" error={errors.address?.message} required className="col-span-2 md:col-span-1">
              <Input {...register("address")} placeholder="1234 Rue Masson" />
            </FormField>
            <FormField label="Ville" error={errors.city?.message} required>
              <Input {...register("city")} placeholder="Montréal" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prix demandé ($)" error={errors.askingPrice?.message} required>
              <Input {...register("askingPrice")} type="number" placeholder="1 050 000" prefix="$" />
            </FormField>
            <FormField label="Année de construction" error={errors.yearBuilt?.message}>
              <Input {...register("yearBuilt")} type="number" placeholder="1965" />
            </FormField>
          </div>

          <FormField label="URL annonce (optionnel)" error={errors.sourceUrl?.message}>
            <Input {...register("sourceUrl")} type="url" placeholder="https://www.centris.ca/..." />
          </FormField>
        </CardContent>
      </Card>

      {/* Section 2: Logements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Logements et loyers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {unitFields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4">
                <Label className="text-xs mb-1 block">Logement</Label>
                <Input
                  {...register(`units.${idx}.unitLabel`)}
                  placeholder={`Logement ${idx + 1}`}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs mb-1 block">Loyer/mois ($)</Label>
                <Input
                  {...register(`units.${idx}.monthlyRent`)}
                  type="number"
                  placeholder="1 500"
                  className="h-8 text-sm"
                  prefix="$"
                />
              </div>
              <div className="col-span-2 flex items-center gap-1.5 pb-1">
                <input
                  type="checkbox"
                  {...register(`units.${idx}.isVacant`)}
                  id={`vacant-${idx}`}
                  className="w-3.5 h-3.5"
                />
                <Label htmlFor={`vacant-${idx}`} className="text-xs">Vacant</Label>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 pb-1">
                <input
                  type="checkbox"
                  {...register(`units.${idx}.heatingIncluded`)}
                  id={`heat-${idx}`}
                  className="w-3.5 h-3.5"
                />
                <Label htmlFor={`heat-${idx}`} className="text-xs">Chauffage</Label>
              </div>
              <div className="col-span-1 flex justify-end pb-1">
                {unitFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                unitLabel: `Logement ${unitFields.length + 1}`,
                monthlyRent: 0,
                isVacant: false,
                isOwnerOccupied: false,
                heatingIncluded: false,
              })
            }
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter un logement
          </Button>
        </CardContent>
      </Card>

      {/* Section 3: Financement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Financement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mise de fonds ($)" error={errors.downPayment?.message} required>
              <Input {...register("downPayment")} type="number" placeholder="204 000" prefix="$" />
            </FormField>
            <div>
              <Label className="text-xs text-muted-foreground">Prêt hypothécaire</Label>
              <p className="text-lg font-semibold mt-1">
                {loanAmount > 0 ? `${(loanAmount / 1000).toFixed(0)}k$` : "—"}
                {ltv > 0 && (
                  <span className={cn(
                    "ml-2 text-sm font-normal",
                    ltv > 0.8 ? "text-warning" : "text-positive"
                  )}>
                    ({(ltv * 100).toFixed(0)}% LTV)
                  </span>
                )}
              </p>
              {ltv > 0.8 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Assurance SCHL requise (&lt;20% mise de fonds)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Taux d'intérêt (%)" error={errors.interestRate?.message} required>
              <Input
                {...register("interestRate")}
                type="number"
                step="0.01"
                placeholder="5.49"
                suffix="%"
              />
            </FormField>
            <FormField label="Amortissement (ans)" error={errors.amortizationYears?.message}>
              <Input {...register("amortizationYears")} type="number" placeholder="25" />
            </FormField>
            <FormField label="Terme (ans)" error={errors.termYears?.message}>
              <Input {...register("termYears")} type="number" placeholder="5" />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Dépenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Dépenses annuelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Taxes municipales ($)"
              error={errors.municipalTaxes?.message}
              required
              hint="Consultez le rôle d'évaluation municipal"
            >
              <Input {...register("municipalTaxes")} type="number" placeholder="9 800" prefix="$" />
            </FormField>
            <FormField
              label="Taxes scolaires ($)"
              error={errors.schoolTaxes?.message}
              required
              hint="Disponible sur le relevé de taxes"
            >
              <Input {...register("schoolTaxes")} type="number" placeholder="1 200" prefix="$" />
            </FormField>
            <FormField
              label="Assurance bâtiment ($)"
              error={errors.insurance?.message}
              required
              hint="Assurance immeuble à revenus"
            >
              <Input {...register("insurance")} type="number" placeholder="4 200" prefix="$" />
            </FormField>
            <FormField label="Déneigement ($)" error={errors.snowRemoval?.message}>
              <Input {...register("snowRemoval")} type="number" placeholder="1 400" prefix="$" />
            </FormField>
          </div>

          {/* Section avancée */}
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAdvanced ? "Masquer" : "Afficher"} les paramètres avancés
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <FormField
                label="Gestion (%)"
                error={errors.management?.message}
                hint="Pourcentage des revenus bruts (0 si auto-géré)"
              >
                <Input {...register("management")} type="number" step="0.01" placeholder="8" suffix="%" />
              </FormField>
              <FormField
                label="Taux vacance (%)"
                error={errors.vacancyRate?.message}
                hint="Taux typique Montréal: 3–6%"
              >
                <Input {...register("vacancyRate")} type="number" step="0.01" placeholder="5" suffix="%" />
              </FormField>
              <FormField
                label="Budget entretien (%)"
                error={errors.maintenanceRate?.message}
                hint="% du prix d'achat par an (défaut: 2%)"
              >
                <Input {...register("maintenanceRate")} type="number" step="0.01" placeholder="2" suffix="%" />
              </FormField>
              <FormField
                label="Budget rénovation ($)"
                error={errors.renovationBudget?.message}
                hint="Travaux planifiés à l'achat"
              >
                <Input {...register("renovationBudget")} type="number" placeholder="0" prefix="$" />
              </FormField>
              <FormField
                label="Frais d'acquisition (%)"
                error={errors.closingCosts?.message}
                hint="Notaire, inspection, etc. (défaut: 1.5%)"
              >
                <Input {...register("closingCosts")} type="number" step="0.001" placeholder="1.5" suffix="%" />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-700 dark:text-amber-400">
        <strong>Rappel :</strong> Cette analyse est un outil d&apos;aide à la décision. Elle ne constitue pas un conseil financier ou fiscal. Vérifiez toutes les données avec des sources officielles avant de prendre une décision d&apos;investissement.
      </div>

      {serverError && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" size="lg" loading={isSubmitting} className="flex-1">
          Analyser cette propriété
        </Button>
      </div>
    </form>
  );
}

// ─── FORM FIELD HELPER ───────────────────────────────────────────────────────

function FormField({
  label,
  children,
  error,
  hint,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
