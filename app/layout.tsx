import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PlexIQ — Analyse financière d'immeubles locatifs",
    template: "%s | PlexIQ",
  },
  description:
    "Analysez duplex, triplex et petits immeubles locatifs au Québec. Cashflow, cap rate, DSCR, IRR — tout en quelques minutes.",
  keywords: ["immobilier", "locatif", "québec", "duplex", "triplex", "investissement", "cashflow"],
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: "https://plexiq.ca",
    siteName: "PlexIQ",
    title: "PlexIQ — Analyse financière d'immeubles locatifs",
    description: "Prenez de meilleures décisions immobilières avec des analyses financières claires et fiables.",
  },
  robots: { index: true, follow: true },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
