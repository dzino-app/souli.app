/**
 * User Key Lifecycle Management
 *
 * Manages ECDH keypair provisioning and retrieval for E2E encrypted sharing.
 * Each user gets one ECDH P-256 keypair stored in the `user_keys` table:
 *   - public_key: base64 SPKI, readable by anyone (for encrypting to this user)
 *   - encrypted_private_key: AES-GCM encrypted PKCS8, encrypted under session key
 *
 * The private key is encrypted under the user's master session key (from
 * crypto-session.ts), NOT under the password directly. This means:
 *   - If the user changes their password (v2 re-wrap), the sharing keys are unaffected
 *   - If the session key changes (v1 → v2 migration), the encrypted_private_key
 *     must be re-encrypted under the new session key
 *
 * Call `ensureUserKeys()` during login, after crypto session is initialized.
 */

import { createClient } from "./supabase/client";
import { getCryptoKey } from "./crypto-session";
import {
  generateUserKeyPair,
  exportPublicKey,
  importPublicKey,
  encryptPrivateKey,
  decryptPrivateKey,
} from "./crypto-sharing";

// ---------------------------------------------------------------------------
// Key provisioning
// ---------------------------------------------------------------------------

/**
 * Ensure the current user has an ECDH keypair in the `user_keys` table.
 *
 * If no keypair exists, generates one and stores it. The private key is
 * encrypted under the provided session key before storage.
 *
 * @param sessionKey - The user's AES-GCM session key from crypto-session.ts.
 *   If omitted, falls back to getCryptoKey() from the active session.
 * @returns true if keys exist (or were created), false if no auth/session
 */
export async function ensureUserKeys(sessionKey?: CryptoKey): Promise<boolean> {
  const key = sessionKey ?? getCryptoKey();
  if (!key) {
    console.warn("[user-keys] No session key — cannot ensure sharing keys");
    return false;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn("[user-keys] Not authenticated — cannot ensure sharing keys");
    return false;
  }

  // Check if keys already exist
  const { data: existing } = await supabase
    .from("user_keys")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (existing) return true;

  // Generate new keypair
  const keyPair = await generateUserKeyPair();
  const publicKeyB64 = await exportPublicKey(keyPair.publicKey);
  const encryptedPrivateKey = await encryptPrivateKey(keyPair.privateKey, key);

  const { error } = await supabase.from("user_keys").insert({
    user_id: user.id,
    public_key: publicKeyB64,
    encrypted_private_key: encryptedPrivateKey,
  });

  if (error) {
    // Handle race condition: another tab/device may have inserted first
    if (error.code === "23505") {
      // unique_violation — keys were created concurrently, that's fine
      return true;
    }
    console.error("[user-keys] Failed to store sharing keys:", error);
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Key retrieval
// ---------------------------------------------------------------------------

/**
 * Fetch another user's public ECDH key for encrypting content to them.
 *
 * Public keys are readable by all authenticated users (RLS policy).
 *
 * @param userId - The target user's UUID
 * @returns The imported CryptoKey, or null if the user has no keys
 */
export async function getUserPublicKey(
  userId: string,
): Promise<CryptoKey | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_keys")
    .select("public_key")
    .eq("user_id", userId)
    .single();

  if (error || !data?.public_key) {
    return null;
  }

  try {
    return await importPublicKey(data.public_key);
  } catch (e) {
    console.error("[user-keys] Failed to import public key for", userId, e);
    return null;
  }
}

/**
 * Fetch the current user's public key as a base64 string.
 *
 * Useful for including the sender's public key alongside shared content
 * so recipients can derive the shared secret.
 *
 * @returns Base64-encoded SPKI public key, or null
 */
export async function getOwnPublicKeyB64(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_keys")
    .select("public_key")
    .eq("user_id", user.id)
    .single();

  return data?.public_key ?? null;
}

/**
 * Fetch and decrypt the current user's ECDH private key.
 *
 * The private key is stored encrypted under the session key.
 *
 * @param sessionKey - The user's AES-GCM session key. If omitted, uses
 *   the active session key from crypto-session.ts.
 * @returns The decrypted CryptoKey for ECDH, or null if unavailable
 */
export async function getOwnPrivateKey(
  sessionKey?: CryptoKey,
): Promise<CryptoKey | null> {
  const key = sessionKey ?? getCryptoKey();
  if (!key) {
    console.warn("[user-keys] No session key — cannot decrypt private key");
    return null;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_keys")
    .select("encrypted_private_key")
    .eq("user_id", user.id)
    .single();

  if (error || !data?.encrypted_private_key) {
    return null;
  }

  try {
    return await decryptPrivateKey(data.encrypted_private_key, key);
  } catch (e) {
    console.error("[user-keys] Failed to decrypt own private key:", e);
    return null;
  }
}

/**
 * Re-encrypt the user's private sharing key under a new session key.
 *
 * Call this during v1 → v2 migration or session key rotation to keep
 * the encrypted_private_key in sync with the current session key.
 *
 * @param oldSessionKey - The previous session key (to decrypt)
 * @param newSessionKey - The new session key (to re-encrypt)
 * @returns true on success
 */
export async function reEncryptUserKeys(
  oldSessionKey: CryptoKey,
  newSessionKey: CryptoKey,
): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("user_keys")
    .select("encrypted_private_key")
    .eq("user_id", user.id)
    .single();

  if (!data?.encrypted_private_key) return false;

  try {
    // Decrypt raw PKCS8 bytes under old key, re-encrypt under new key.
    // We work with raw bytes instead of CryptoKey to avoid the need for
    // an extractable key (decryptPrivateKey returns non-extractable).
    const pkcs8Raw = await decryptPrivateKeyRaw(
      data.encrypted_private_key,
      oldSessionKey,
    );
    const newEncrypted = await encryptPrivateKeyRaw(pkcs8Raw, newSessionKey);

    const { error } = await supabase
      .from("user_keys")
      .update({ encrypted_private_key: newEncrypted })
      .eq("user_id", user.id);

    if (error) {
      console.error("[user-keys] Failed to re-encrypt private key:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[user-keys] Re-encryption failed:", e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers for raw PKCS8 manipulation (used during re-encryption)
// ---------------------------------------------------------------------------

import { toBase64, fromBase64 } from "./crypto";

/** Decrypt the encrypted private key to raw PKCS8 bytes (not as CryptoKey). */
async function decryptPrivateKeyRaw(
  encrypted: string,
  sessionKey: CryptoKey,
): Promise<ArrayBuffer> {
  const [ivB64, ctB64] = encrypted.split(":");
  if (!ivB64 || !ctB64) {
    throw new Error("Invalid encrypted private key format");
  }

  const iv = fromBase64(ivB64);
  const ct = fromBase64(ctB64);

  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    sessionKey,
    ct.buffer as ArrayBuffer,
  );
}

/** Encrypt raw PKCS8 bytes under a session key. Returns iv:ciphertext base64. */
async function encryptPrivateKeyRaw(
  pkcs8: ArrayBuffer,
  sessionKey: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    sessionKey,
    pkcs8,
  );
  return toBase64(iv) + ":" + toBase64(new Uint8Array(ciphertext));
}
