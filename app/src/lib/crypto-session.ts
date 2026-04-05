/**
 * Crypto Session Manager
 *
 * Holds the derived encryption key in memory for the duration of the session.
 * The key is NEVER persisted to localStorage, cookies, or any storage.
 * It exists only in the JavaScript runtime memory and is lost on page refresh,
 * tab close, or explicit logout.
 *
 * Flow:
 * 1. User logs in -> initCryptoSession(password, salt) derives and stores key
 * 2. During session -> encryptIfActive/decryptIfActive wrap data transparently
 * 3. User logs out -> clearCryptoSession() zeroes the key reference
 */

import {
  deriveKey,
  encrypt,
  decrypt,
  isEncrypted,
} from "./crypto";

/** The derived AES-GCM key — lives only in memory. */
let sessionKey: CryptoKey | null = null;

/** The user's salt — kept in memory to avoid re-fetching. */
let userSalt: Uint8Array | null = null;

/**
 * Initialize the encryption session by deriving a key from the user's password.
 *
 * Called during login (after successful authentication) and signup (after
 * account creation). The password is used only for key derivation and is
 * NOT stored anywhere.
 *
 * @param password - The user's plaintext password (used only for derivation)
 * @param salt - The user's unique salt (from user_crypto table)
 */
export async function initCryptoSession(
  password: string,
  salt: Uint8Array
): Promise<void> {
  sessionKey = await deriveKey(password, salt);
  userSalt = salt;
}

/**
 * Get the current session encryption key.
 *
 * Returns null if no crypto session is active (user not logged in,
 * or legacy user without encryption set up).
 *
 * @returns The AES-GCM CryptoKey or null
 */
export function getCryptoKey(): CryptoKey | null {
  return sessionKey;
}

/**
 * Get the current session salt.
 *
 * @returns The user's salt or null
 */
export function getCryptoSalt(): Uint8Array | null {
  return userSalt;
}

/**
 * Clear the encryption session.
 *
 * Called during logout. Nullifies the key reference so it can be
 * garbage collected. After this call, encryptIfActive/decryptIfActive
 * become no-ops (passthrough).
 */
export function clearCryptoSession(): void {
  sessionKey = null;
  userSalt = null;
}

/**
 * Check if encryption is currently active.
 *
 * Returns true only when a valid crypto session exists (user is logged in
 * and has a derived key in memory).
 *
 * @returns true if encrypt/decrypt operations will actually transform data
 */
export function isEncryptionActive(): boolean {
  return sessionKey !== null;
}

/**
 * Encrypt a string if encryption is active, otherwise return it unchanged.
 *
 * This is the primary helper for Supabase write paths. It provides graceful
 * degradation: if no crypto session exists (guest mode, legacy user, etc.),
 * data is written as plaintext.
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string if active, original string if not
 */
export async function encryptIfActive(plaintext: string): Promise<string> {
  if (!sessionKey) return plaintext;
  return encrypt(plaintext, sessionKey);
}

/**
 * Decrypt a string if it's encrypted and we have a key, otherwise return as-is.
 *
 * This is the primary helper for Supabase read paths. It handles three cases:
 * 1. Encrypted data + active session -> decrypts and returns plaintext
 * 2. Encrypted data + no session -> returns the encrypted string as-is (lossy but safe)
 * 3. Plaintext data (no "enc:" prefix) -> returns as-is regardless of session state
 *
 * The "enc:" prefix check enables graceful migration: old plaintext data
 * is read normally, new encrypted data is decrypted when possible.
 *
 * @param ciphertext - The string to decrypt (may be plaintext or encrypted)
 * @returns Decrypted plaintext, or the original string if decryption not possible
 */
export async function decryptIfActive(ciphertext: string): Promise<string> {
  // If it's not encrypted data, return as-is
  if (!isEncrypted(ciphertext)) return ciphertext;
  // If we don't have a key, we can't decrypt — return as-is
  if (!sessionKey) return ciphertext;

  try {
    return await decrypt(ciphertext, sessionKey);
  } catch {
    // Decryption failed (wrong key, corrupted data) — return as-is
    console.warn("[crypto] Decryption failed for content, returning as-is");
    return ciphertext;
  }
}
