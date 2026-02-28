"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">PlexIQ</span>
          </Link>
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Entrez votre email pour recevoir un lien magique
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="font-semibold mb-2">Vérifiez votre email</h2>
              <p className="text-sm text-muted-foreground">
                Un lien de connexion a été envoyé à <strong>{email}</strong>
              </p>
              <Button
                variant="ghost"
                className="mt-4 text-sm"
                onClick={() => { setSent(false); setEmail(""); }}
              >
                Utiliser un autre email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                <Mail className="w-4 h-4" />
                Envoyer le lien magique
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Créer un compte
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
