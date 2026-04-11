/**
 * Crypto Session Manager
 *
 * Holds the encryption key in memory for the duration of the session.
 * The key is NEVER persisted to localStorage, cookies, or any storage.
 * It exists only in the JavaScript runtime memory and is lost on page
 * refresh, tab close, or explicit logout.
 *
 * Supports two crypto versions:
 *   v1 (legacy): PBKDF2(password, salt) → session key directly
 *   v2 (master key): random MK wrapped under password + recovery phrase
 *
 * Both versions produce the same session interface: encryptIfActive /
 * decryptIfActive use whichever key was loaded.
 */

import {
  deriveKey,
  encrypt,
  decrypt,
  isEncrypted,
} from "./crypto";

/** The AES-GCM key used for data encryption — lives only in memory. */
let sessionKey: CryptoKey | null = null;

/** The user's salt — kept in memory to avoid re-fetching. */
let userSalt: Uint8Array | null = null;

/** Which crypto version is active in this session. */
let cryptoVersion: 1 | 2 | null = null;

/**
 * Initialize a v1 (legacy) crypto session.
 * The password is derived directly into the session key.
 */
export async function initCryptoSession(
  password: string,
  salt: Uint8Array,
): Promise<void> {
  sessionKey = await deriveKey(password, salt);
  userSalt = salt;
  cryptoVersion = 1;
}

/**
 * Initialize a v2 (master key) crypto session.
 * The master key was already unwrapped by the caller.
 */
export function initCryptoSessionV2(
  masterKey: CryptoKey,
  salt: Uint8Array,
): void {
  sessionKey = masterKey;
  userSalt = salt;
  cryptoVersion = 2;
}

export function getCryptoKey(): CryptoKey | null {
  return sessionKey;
}

export function getCryptoSalt(): Uint8Array | null {
  return userSalt;
}

export function getCryptoVersion(): 1 | 2 | null {
  return cryptoVersion;
}

/**
 * Clear the encryption session (logout).
 */
export function clearCryptoSession(): void {
  sessionKey = null;
  userSalt = null;
  cryptoVersion = null;
}

export function isEncryptionActive(): boolean {
  return sessionKey !== null;
}

/**
 * Encrypt a string if encryption is active, otherwise return it unchanged.
 */
export async function encryptIfActive(plaintext: string): Promise<string> {
  if (!sessionKey) return plaintext;
  return encrypt(plaintext, sessionKey);
}

/**
 * Decrypt a string if it's encrypted and we have a key, otherwise return as-is.
 * Returns empty string if ciphertext is present but no key — never leaks ciphertext.
 */
export async function decryptIfActive(ciphertext: string): Promise<string> {
  if (!isEncrypted(ciphertext)) return ciphertext;
  if (!sessionKey) {
    console.warn("[crypto] Encrypted data encountered without session key — returning empty");
    return "";
  }

  try {
    return await decrypt(ciphertext, sessionKey);
  } catch {
    console.warn("[crypto] Decryption failed for content, returning empty");
    return "";
  }
}
