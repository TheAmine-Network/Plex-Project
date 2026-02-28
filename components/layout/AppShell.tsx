"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  ArrowLeftRight,
  Settings,
  CreditCard,
  Building2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/app/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/app/property/new", label: "Nouvelle analyse", icon: Plus },
  { href: "/app/compare", label: "Comparaison", icon: ArrowLeftRight },
];

const bottomItems = [
  { href: "/app/settings", label: "Paramètres", icon: Settings },
  { href: "/app/billing", label: "Abonnement", icon: CreditCard },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r bg-card shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">PlexIQ</span>
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            BETA
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon className="w-4 h-4" />}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t space-y-1">
          {bottomItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon className="w-4 h-4" />}
              active={pathname === item.href}
            />
          ))}
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
