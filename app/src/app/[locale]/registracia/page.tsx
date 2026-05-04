"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initCryptoSessionV2 } from "@/lib/crypto-session";
import { generateSalt, toBase64 } from "@/lib/crypto";
import {
  generateMasterKey,
  deriveWrappingKey,
  deriveRecoveryWrappingKey,
  wrapMasterKey,
  generateRecoverySalt,
} from "@/lib/crypto-keys";
import { generateMnemonic, mnemonicToEntropy } from "@/lib/bip39";
import { storePendingCrypto } from "@/lib/crypto-salt-persist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecoveryPhraseDisplay } from "@/components/crypto/recovery-phrase-display";

export default function SignupPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [confirmScreen, setConfirmScreen] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?locale=${locale}${
          next && next.startsWith("/") && !next.startsWith("//")
            ? `&next=${encodeURIComponent(next)}`
            : ""
        }`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Generate v2 crypto: master key + recovery phrase
    try {
      const salt = generateSalt();
      const masterKey = await generateMasterKey();

      // Wrap under password
      const passwordWrappingKey = await deriveWrappingKey(password, salt);
      const wrappedByPassword = await wrapMasterKey(masterKey, passwordWrappingKey);

      // Wrap under recovery phrase
      const phrase = await generateMnemonic();
      const entropy = await mnemonicToEntropy(phrase);
      const recoverySalt = generateRecoverySalt();
      const recoveryWrappingKey = await deriveRecoveryWrappingKey(entropy, recoverySalt);
      const wrappedByRecovery = await wrapMasterKey(masterKey, recoveryWrappingKey);

      // Store in sessionStorage for post-confirmation persistence
      storePendingCrypto({
        salt: toBase64(salt),
        wrappedKeyPassword: wrappedByPassword,
        wrappedKeyRecovery: wrappedByRecovery,
        recoverySalt: toBase64(recoverySalt),
        cryptoVersion: 2,
      });

      // Init the session with the master key
      initCryptoSessionV2(masterKey, salt);

      // Show recovery phrase before email confirmation
      setMnemonic(phrase);
    } catch (err) {
      console.warn("[signup] Crypto init failed:", err);
      // Fallback: no encryption
    }

    setLoading(false);
  }

  // Step 2: recovery phrase display
  if (mnemonic && !confirmScreen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-8">
        <RecoveryPhraseDisplay
          mnemonic={mnemonic}
          onConfirm={() => setConfirmScreen(true)}
        />
      </div>
    );
  }

  // Step 3: email confirmation
  if (confirmScreen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-lg font-bold">{t("confirmEmailTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("confirmEmailDesc", { email })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("confirmEmailHint")}
            </p>
            <Link href="/prihlasenie">
              <Button variant="outline" size="sm" className="mt-2">
                {t("loginLink")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: signup form
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Souli</div>
          <CardTitle className="text-xl">{t("signupTitle")}</CardTitle>
          <CardDescription>{t("signupDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
                minLength={6}
                required
                className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {t("passwordDeviceHint")}
              </p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-border"
                required
              />
              <span className="text-xs text-muted-foreground leading-snug">
                {t("ageConfirm")}
              </span>
            </label>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" size="lg" disabled={loading || !ageConfirmed}>
              {loading ? "..." : t("signup")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/prihlasenie" className="text-primary hover:underline">
              {t("loginLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
