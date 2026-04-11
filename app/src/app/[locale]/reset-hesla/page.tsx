"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { fromBase64 } from "@/lib/crypto";
import { initCryptoSessionV2 } from "@/lib/crypto-session";
import {
  deriveWrappingKey,
  deriveRecoveryWrappingKey,
  unwrapMasterKey,
  wrapMasterKey,
  importSessionKey,
} from "@/lib/crypto-keys";
import { mnemonicToEntropy } from "@/lib/bip39";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecoveryPhraseInput } from "@/components/crypto/recovery-phrase-input";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [isV2, setIsV2] = useState<boolean | null>(null);
  const [needsPhrase, setNeedsPhrase] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  // Extractable master key — held in memory only during the reset flow
  const extractableMK = useRef<CryptoKey | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_crypto")
        .select("crypto_version, wrapped_key_recovery")
        .eq("user_id", user.id)
        .single();
      if (data?.crypto_version === 2 && data.wrapped_key_recovery) {
        setIsV2(true);
        setNeedsPhrase(true);
      } else {
        setIsV2(false);
      }
    })();
  }, []);

  async function handleRecoverySubmit(mnemonic: string) {
    setLoading(true);
    setRecoveryError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: row } = await supabase
        .from("user_crypto")
        .select("salt, wrapped_key_recovery, recovery_salt")
        .eq("user_id", user.id)
        .single();
      if (!row?.wrapped_key_recovery || !row.recovery_salt) {
        throw new Error("No recovery data");
      }

      const entropy = await mnemonicToEntropy(mnemonic);
      const recoverySalt = fromBase64(row.recovery_salt);
      const recoveryWrappingKey = await deriveRecoveryWrappingKey(entropy, recoverySalt);

      // Unwrap as extractable so we can re-wrap under new password later
      const mk = await unwrapMasterKey(row.wrapped_key_recovery, recoveryWrappingKey, true);
      extractableMK.current = mk;

      // Init session with a non-extractable copy
      const sessionMK = await importSessionKey(mk);
      initCryptoSessionV2(sessionMK, fromBase64(row.salt));

      setNeedsPhrase(false);
    } catch {
      setRecoveryError("Neplatná obnovovacia fráza alebo poškodené dáta");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordsMismatch"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authErr } = await supabase.auth.updateUser({ password });
    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    // For v2: re-wrap master key under the new password
    if (isV2 && extractableMK.current) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: row } = await supabase
            .from("user_crypto")
            .select("salt")
            .eq("user_id", user.id)
            .single();
          if (row) {
            const salt = fromBase64(row.salt);
            const newWrappingKey = await deriveWrappingKey(password, salt);
            const newWrapped = await wrapMasterKey(extractableMK.current, newWrappingKey);
            await supabase
              .from("user_crypto")
              .update({ wrapped_key_password: newWrapped })
              .eq("user_id", user.id);
          }
        }
        extractableMK.current = null;
      } catch (err) {
        console.warn("[reset-hesla] Re-wrap failed:", err);
      }
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.push("/"), 2000);
  }

  if (needsPhrase) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-8">
        <RecoveryPhraseInput
          onSubmit={handleRecoverySubmit}
          loading={loading}
          error={recoveryError}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("resetTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-sm text-green-600 text-center">{t("resetSuccess")}</p>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  {t("newPassword")}
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
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-sm font-medium">
                  {t("confirmPassword")}
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  required
                  className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? "..." : t("resetButton")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
