"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { loadFromSupabase } from "@/lib/supabase/sync";
import { initCryptoSession } from "@/lib/crypto-session";
import { fromBase64 } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(t("invalidCredentials"));
      setLoading(false);
      return;
    }

    // Initialize client-side encryption from the user's password + stored salt
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: cryptoRow } = await supabase
          .from("user_crypto")
          .select("salt, encryption_enabled")
          .eq("user_id", user.id)
          .single();

        // Only derive key if encryption is enabled for this user
        if (cryptoRow?.salt && cryptoRow?.encryption_enabled !== false) {
          await initCryptoSession(password, fromBase64(cryptoRow.salt));
        }
      }
    } catch {
      // Crypto init failed — proceed without encryption (graceful degradation)
    }

    // Load all user data from Supabase into localStorage before redirect
    try {
      await loadFromSupabase();
    } catch {
      // Non-critical: localStorage will still work
    }

    router.push("/");
    router.refresh();
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setError(t("enterEmailFirst"));
      return;
    }
    setResetLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setResetLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Dzino</div>
          <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                required
                className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {resetSent && (
              <p className="text-sm text-green-600">{t("resetSent")}</p>
            )}
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "..." : t("login")}
            </Button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="text-xs text-muted-foreground hover:text-primary transition-colors text-center"
            >
              {resetLoading ? "..." : t("forgotPassword")}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/registracia" className="text-primary hover:underline">
              {t("createAccount")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
