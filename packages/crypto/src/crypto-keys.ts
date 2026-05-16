/**
 * Master Key Management
 *
 * Implements the "wrapped master key" model:
 * - A random 256-bit AES-GCM master key (MK) is the actual encryption key
 * - MK is wrapped (encrypted) under a password-derived wrapping key → stored in DB
 * - MK is wrapped under a recovery-phrase-derived wrapping key → stored in DB
 * - Changing password = re-wrap MK, not re-encrypt all data
 *
 * Wrapping uses AES-KW (RFC 3394) via Web Crypto's wrapKey/unwrapKey.
 */

import { toBase64, fromBase64, PBKDF2_ITERATIONS } from "./crypto";

/**
 * Generate a random 256-bit AES-GCM master key.
 *
 * The key is extractable so it can be wrapped (exported encrypted).
 * Callers should discard the extractable reference after wrapping and
 * keep only the non-extractable session copy from unwrapMasterKey.
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable — required for wrapKey
    ["encrypt", "decrypt"],
  );
}

/**
 * Derive a wrapping key from a password and salt.
 *
 * Same PBKDF2 parameters as the encryption key derivation, but the
 * resulting key is purposed for AES-KW (wrapKey/unwrapKey) instead
 * of AES-GCM (encrypt/decrypt).
 */
export async function deriveWrappingKey(
  secret: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret).buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

/**
 * Derive a wrapping key from recovery phrase entropy and a dedicated salt.
 */
export async function deriveRecoveryWrappingKey(
  entropy: Uint8Array,
  recoverySalt: Uint8Array,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    entropy.buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: recoverySalt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

/**
 * Wrap (encrypt) a master key under a wrapping key using AES-KW.
 *
 * Returns base64-encoded wrapped key (~40 bytes: 256-bit key + 8-byte integrity).
 */
export async function wrapMasterKey(
  masterKey: CryptoKey,
  wrappingKey: CryptoKey,
): Promise<string> {
  const wrapped = await crypto.subtle.wrapKey(
    "raw",
    masterKey,
    wrappingKey,
    "AES-KW",
  );
  return toBase64(new Uint8Array(wrapped));
}

/**
 * Unwrap (decrypt) a master key using a wrapping key.
 *
 * By default returns a NON-extractable key for session use.
 * Pass extractable=true when you need to re-wrap (e.g. password change).
 * Throws if the wrapping key is wrong (AES-KW integrity check fails).
 */
export async function unwrapMasterKey(
  wrappedB64: string,
  wrappingKey: CryptoKey,
  extractable = false,
): Promise<CryptoKey> {
  const wrapped = fromBase64(wrappedB64);
  return crypto.subtle.unwrapKey(
    "raw",
    wrapped.buffer as ArrayBuffer,
    wrappingKey,
    "AES-KW",
    { name: "AES-GCM", length: 256 },
    extractable,
    ["encrypt", "decrypt"],
  );
}

/**
 * Import raw key bytes as a non-extractable AES-GCM session key.
 * Used to downgrade an extractable key to a locked-down session key.
 */
export async function importSessionKey(
  extractableKey: CryptoKey,
): Promise<CryptoKey> {
  const raw = await crypto.subtle.exportKey("raw", extractableKey);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Generate a random salt for recovery key derivation.
 */
export function generateRecoverySalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}
