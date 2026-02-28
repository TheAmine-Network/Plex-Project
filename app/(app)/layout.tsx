import { AppShell } from "@/components/layout/AppShell";
import { requireAuth } from "@/lib/auth/helpers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth guard — redirige vers /login si non connecté
  await requireAuth();

  return <AppShell>{children}</AppShell>;
}
