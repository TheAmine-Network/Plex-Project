/**
 * PlexIQ — Helpers d'authentification côté serveur
 */
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import type { User } from "@prisma/client";

/** Récupère la session courante — redirige si non connecté */
export async function requireAuth(): Promise<{ supabaseId: string; email: string }> {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return {
    supabaseId: session.user.id,
    email: session.user.email ?? "",
  };
}

/** Récupère l'utilisateur DB (crée si première connexion) */
export async function getOrCreateUser(supabaseId: string, email: string): Promise<User> {
  let user = await prisma.user.findUnique({ where: { supabaseId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        supabaseId,
        email,
        plan: "FREE",
      },
    });
  }

  return user;
}

/** Vérifie le quota d'analyses selon le plan */
export async function checkAnalysisQuota(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  limit: number;
  used: number;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, reason: "Utilisateur introuvable", limit: 0, used: 0 };

  const limits: Record<string, number> = {
    FREE: 1,
    PRO: Infinity,
    PREMIUM: Infinity,
  };

  const limit = limits[user.plan] ?? 1;
  const used = user.analysisCount;

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Limite atteinte pour le plan ${user.plan}. Passez à Pro pour continuer.`,
      limit,
      used,
    };
  }

  return { allowed: true, limit, used };
}
