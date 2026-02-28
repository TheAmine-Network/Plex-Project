import Link from "next/link";
import { Plus, Building2, Star, TrendingUp, ArrowRight } from "lucide-react";
import { requireAuth, getOrCreateUser } from "@/lib/auth/helpers";
import prisma from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabaseId, email } = await requireAuth();
  const user = await getOrCreateUser(supabaseId, email);

  // Propriétés récentes
  const properties = await prisma.property.findMany({
    where: { userId: user.id, isArchived: false },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Analyses récentes
  const recentAnalyses = await prisma.analysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { property: true },
  });

  const verdictConfig = {
    GO: { label: "GO", variant: "positive" as const },
    NEUTRAL: { label: "NEUTRE", variant: "warning" as const },
    NO_GO: { label: "NO-GO", variant: "negative" as const },
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bonjour{user.name ? `, ${user.name}` : ""} · Plan{" "}
            <span className="font-medium text-foreground">{user.plan}</span>
          </p>
        </div>
        <Button asChild>
          <Link href="/app/property/new">
            <Plus className="w-4 h-4" />
            Nouvelle analyse
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Propriétés</p>
            <p className="text-2xl font-bold mt-1">{properties.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Analyses</p>
            <p className="text-2xl font-bold mt-1">{user.analysisCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">GO détectés</p>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {recentAnalyses.filter((a) => a.dealVerdict === "GO").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Favoris</p>
            <p className="text-2xl font-bold mt-1">
              {properties.filter((p) => p.isFavorite).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properties list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Mes propriétés</h2>
        </div>

        {properties.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Aucune propriété</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Commencez par analyser votre premier immeuble
              </p>
              <Button asChild>
                <Link href="/app/property/new">
                  <Plus className="w-4 h-4" />
                  Créer une analyse
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {properties.map((property) => {
              const latestAnalysis = property.analyses[0];
              const verdict = latestAnalysis?.dealVerdict
                ? verdictConfig[latestAnalysis.dealVerdict]
                : null;

              return (
                <Link key={property.id} href={`/app/property/${property.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{property.name}</h3>
                            {property.isFavorite && (
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            )}
                            {verdict && (
                              <Badge variant={verdict.variant}>{verdict.label}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {property.address}, {property.city} · {property.totalUnits} logements
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(property.askingPrice, { compact: true })}
                          </p>
                        </div>

                        {latestAnalysis && (
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-bold tabular-nums ${latestAnalysis.cashflowMonthly >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {latestAnalysis.cashflowMonthly >= 0 ? "+" : ""}
                              {formatCurrency(latestAnalysis.cashflowMonthly)}/mois
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Cap rate {formatPercent(latestAnalysis.capRate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Score {latestAnalysis.dealScore}/100
                            </p>
                          </div>
                        )}

                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 self-center" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
