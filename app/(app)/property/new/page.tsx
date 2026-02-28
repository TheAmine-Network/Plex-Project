import { Metadata } from "next";
import { PropertyForm } from "@/components/property/PropertyForm";

export const metadata: Metadata = { title: "Nouvelle analyse" };

export default function NewPropertyPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Nouvelle analyse</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Remplissez les informations de la propriété pour obtenir une analyse complète.
        </p>
      </div>
      <PropertyForm />
    </div>
  );
}
