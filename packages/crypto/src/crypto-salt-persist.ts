/**
 * Persist encryption data generated during signup.
 *
 * During signup, salt + wrapped keys are stored in sessionStorage
 * (temporary). After email confirmation and redirect, this function
 * reads the pending data and stores it permanently in user_crypto.
 */

import { createClient } from "./supabase/client";

const PENDING_SALT_KEY = "dzino_pending_salt";
const PENDING_WRAPPED_PWD = "dzino_pending_wrapped_password";
const PENDING_WRAPPED_REC = "dzino_pending_wrapped_recovery";
const PENDING_REC_SALT = "dzino_pending_recovery_salt";
const PENDING_VERSION = "dzino_pending_crypto_version";

/**
 * Store pending signup fields in sessionStorage.
 * Called from the signup page after key generation.
 */
export function storePendingCrypto(fields: {
  salt: string;
  wrappedKeyPassword?: string;
  wrappedKeyRecovery?: string;
  recoverySalt?: string;
  cryptoVersion?: number;
}): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_SALT_KEY, fields.salt);
  if (fields.wrappedKeyPassword)
    sessionStorage.setItem(PENDING_WRAPPED_PWD, fields.wrappedKeyPassword);
  if (fields.wrappedKeyRecovery)
    sessionStorage.setItem(PENDING_WRAPPED_REC, fields.wrappedKeyRecovery);
  if (fields.recoverySalt)
    sessionStorage.setItem(PENDING_REC_SALT, fields.recoverySalt);
  if (fields.cryptoVersion)
    sessionStorage.setItem(PENDING_VERSION, String(fields.cryptoVersion));
}

function clearPending(): void {
  sessionStorage.removeItem(PENDING_SALT_KEY);
  sessionStorage.removeItem(PENDING_WRAPPED_PWD);
  sessionStorage.removeItem(PENDING_WRAPPED_REC);
  sessionStorage.removeItem(PENDING_REC_SALT);
  sessionStorage.removeItem(PENDING_VERSION);
}

/**
 * Persist pending crypto data from signup into user_crypto.
 * Safe to call multiple times — no-op if already persisted.
 */
export async function persistPendingSalt(): Promise<void> {
  if (typeof window === "undefined") return;

  const pendingSalt = sessionStorage.getItem(PENDING_SALT_KEY);
  if (!pendingSalt) return;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("user_crypto")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    clearPending();
    return;
  }

  const version = parseInt(sessionStorage.getItem(PENDING_VERSION) || "1", 10);

  const row: Record<string, unknown> = {
    user_id: user.id,
    salt: pendingSalt,
    crypto_version: version,
  };

  if (version === 2) {
    const wrappedPwd = sessionStorage.getItem(PENDING_WRAPPED_PWD);
    const wrappedRec = sessionStorage.getItem(PENDING_WRAPPED_REC);
    const recSalt = sessionStorage.getItem(PENDING_REC_SALT);
    if (wrappedPwd) row.wrapped_key_password = wrappedPwd;
    if (wrappedRec) row.wrapped_key_recovery = wrappedRec;
    if (recSalt) row.recovery_salt = recSalt;
    if (wrappedRec) row.recovery_created_at = new Date().toISOString();
  }

  const { error } = await supabase.from("user_crypto").insert(row);
  if (!error) clearPending();
}
