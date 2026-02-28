import Link from "next/link";
import { Building2, BarChart3, Shield, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PlexIQ</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Essayer gratuitement</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-24 md:py-32 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Nouveau · Analyse de duplex/triplex en 5 minutes
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            Analysez vos immeubles locatifs,{" "}
            <span className="text-primary">sans vous tromper.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            PlexIQ calcule le cashflow, le cap rate, le DSCR et le TRI de vos duplex, triplex et 4–6 logements au Québec.
            Décision éclairée en quelques minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" asChild>
              <Link href="/signup">
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/app/demo">Voir une démo</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Aucune carte de crédit requise · 1 analyse gratuite
          </p>
        </div>

        {/* Dashboard preview mockup */}
        <div className="mt-20 mx-auto max-w-5xl">
          <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
            <div className="bg-muted/50 border-b px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 h-5 rounded bg-background/60 text-xs flex items-center px-3 text-muted-foreground">
                plexiq.ca/app/property/triplex-rosemont
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Cashflow mensuel", value: "+$842", signal: "positive" },
                { label: "Cap Rate", value: "5.8%", signal: "positive" },
                { label: "DSCR", value: "1.24x", signal: "positive" },
                { label: "Deal Score", value: "71/100", signal: "positive" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold text-green-600 mt-1">{kpi.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Des calculs fiables, des hypothèses transparentes, un résultat clair.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: BarChart3,
              title: "Calculs complets",
              desc: "Cashflow, cap rate, DSCR, GRM, TRI sur 5/10 ans. Tableau d'amortissement canadien (méthode semi-annuelle).",
            },
            {
              icon: Shield,
              title: "Hypothèses transparentes",
              desc: "Chaque chiffre est expliqué. Modifiez les hypothèses et voyez l'impact en temps réel.",
            },
            {
              icon: Zap,
              title: "Analyse de sensibilité",
              desc: "Voyez comment votre cashflow réagit à +1% de taux, 10% de loyers en moins, ou plus de vacance.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Tarifs simples</h2>
          <p className="text-muted-foreground">Commencez gratuitement, passez à Pro quand vous êtes prêt.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              name: "Gratuit",
              price: "0$",
              period: "",
              features: ["1 analyse sauvegardée", "Calculs de base", "Accès limité"],
              cta: "Commencer",
              href: "/signup",
              featured: false,
            },
            {
              name: "Pro",
              price: "29$",
              period: "/mois",
              features: [
                "Analyses illimitées",
                "Export PDF",
                "Comparaison de propriétés",
                "Analyse de sensibilité",
                "TRI et projections 10 ans",
              ],
              cta: "Essayer Pro",
              href: "/signup?plan=pro",
              featured: true,
            },
            {
              name: "Premium",
              price: "89$",
              period: "/mois",
              features: [
                "Tout Pro +",
                "Scénarios multiples",
                "Templates fiscaux",
                "Exports avancés",
                "Support prioritaire",
              ],
              cta: "Essayer Premium",
              href: "/signup?plan=premium",
              featured: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${plan.featured ? "border-primary shadow-lg ring-1 ring-primary" : ""}`}
            >
              {plan.featured && (
                <div className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">
                  Le plus populaire
                </div>
              )}
              <h3 className="font-bold text-xl">{plan.name}</h3>
              <div className="mt-2 mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.featured ? "default" : "outline"}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Rapport PDF à la carte · 9$/rapport pour les utilisateurs Free
        </p>
      </section>

      {/* Disclaimer */}
      <section className="border-t bg-muted/30">
        <div className="container py-8">
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
            <strong>Avertissement :</strong> PlexIQ est un outil d&apos;aide à la décision. Les analyses produites ne constituent pas un conseil financier, fiscal ou juridique. Les calculs sont basés sur les données fournies et les hypothèses sélectionnées. Consultez un professionnel qualifié avant tout investissement. Les rendements passés ne garantissent pas les rendements futurs.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="font-semibold text-foreground">PlexIQ</span>
            <span>© 2025</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">Confidentialité</Link>
            <Link href="/terms" className="hover:text-foreground">Conditions</Link>
            <Link href="/disclaimer" className="hover:text-foreground">Avertissements</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
