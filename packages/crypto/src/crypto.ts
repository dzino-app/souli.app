/**
 * Dzino Client-Side Encryption Module
 *
 * Pure Web Crypto API implementation for encrypting user data at rest.
 * No external dependencies — designed to be extracted to a standalone package.
 *
 * Encryption scheme:
 * - Key derivation: PBKDF2 (600,000 iterations, SHA-256) -> AES-GCM 256-bit
 * - Encryption: AES-GCM with random 12-byte IV per message
 * - Format: base64(iv):base64(ciphertext) — colon-separated
 *
 * The password is the key. If the user forgets their password and has no
 * recovery mechanism, encrypted data is unrecoverable by design.
 */

/**
 * Number of PBKDF2 iterations.
 *
 * 600,000 follows OWASP 2023 recommendations for PBKDF2-SHA256.
 * Higher iteration counts increase brute-force resistance at the cost
 * of slower key derivation (~300-500ms on modern devices).
 */
export const PBKDF2_ITERATIONS = 600_000;

/**
 * AES-GCM IV length in bytes.
 *
 * 12 bytes (96 bits) is the recommended IV size for AES-GCM per NIST SP 800-38D.
 * Using the recommended size avoids the extra GHASH step required for other sizes
 * and provides optimal performance and security.
 */
const IV_LENGTH = 12;

/**
 * Salt length in bytes.
 *
 * 16 bytes (128 bits) provides sufficient uniqueness to prevent rainbow table
 * attacks across users. The salt is stored unencrypted alongside the user record.
 */
const SALT_LENGTH = 16;

/**
 * Prefix used to identify encrypted content.
 *
 * Encrypted strings start with this prefix so we can distinguish them from
 * plaintext during the migration period (graceful degradation).
 */
export const ENCRYPTED_PREFIX = "enc:";

/**
 * Convert a Uint8Array to a base64 string.
 *
 * Uses the standard btoa approach with binary string conversion,
 * which works in all modern browsers and edge runtimes.
 *
 * @param bytes - The byte array to encode
 * @returns Base64-encoded string
 */
export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert a base64 string back to a Uint8Array.
 *
 * @param base64 - The base64-encoded string
 * @returns Decoded byte array
 */
export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a cryptographically random salt for key derivation.
 *
 * Each user gets a unique salt, stored in the database (unencrypted).
 * The salt ensures that two users with the same password will derive
 * different encryption keys.
 *
 * @returns 16 random bytes
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Derive an AES-GCM 256-bit encryption key from a password and salt.
 *
 * Uses PBKDF2 with SHA-256 and 600,000 iterations as recommended by OWASP.
 * The derived key is a non-extractable CryptoKey that can only be used
 * for AES-GCM encrypt/decrypt operations.
 *
 * @param password - The user's plaintext password
 * @param salt - A 16-byte random salt (unique per user)
 * @returns A CryptoKey for AES-GCM operations
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const passwordBytes = new TextEncoder().encode(password);

  // Import the password as raw key material for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes.buffer as ArrayBuffer,
    "PBKDF2",
    false, // not extractable
    ["deriveKey"]
  );

  // Derive a 256-bit AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false, // not extractable — the key stays in Web Crypto internals
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a plaintext string using AES-GCM.
 *
 * Generates a random 12-byte IV for each encryption operation. AES-GCM
 * provides both confidentiality and authenticity — any tampering with the
 * ciphertext will cause decryption to fail.
 *
 * Output format: "enc:" + base64(iv) + ":" + base64(ciphertext)
 * The "enc:" prefix allows distinguishing encrypted data from plaintext.
 *
 * @param plaintext - The string to encrypt
 * @param key - AES-GCM CryptoKey from deriveKey()
 * @returns Prefixed colon-separated base64 string: enc:iv:ciphertext
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  // Random IV — NEVER reuse an IV with the same key
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encoded.buffer as ArrayBuffer
  );

  return ENCRYPTED_PREFIX + toBase64(iv) + ":" + toBase64(new Uint8Array(ciphertext));
}

/**
 * Decrypt an AES-GCM encrypted string back to plaintext.
 *
 * Parses the "enc:iv:ciphertext" format, extracts the IV and ciphertext,
 * and decrypts using the provided key. Will throw if:
 * - The key is wrong (authentication tag mismatch)
 * - The ciphertext has been tampered with
 * - The format is invalid
 *
 * @param ciphertext - The encrypted string in "enc:iv:ciphertext" format
 * @param key - AES-GCM CryptoKey (must match the key used for encryption)
 * @returns The original plaintext string
 * @throws DOMException if decryption fails (wrong key or tampered data)
 */
export async function decrypt(
  ciphertext: string,
  key: CryptoKey
): Promise<string> {
  // Strip the "enc:" prefix if present
  const data = ciphertext.startsWith(ENCRYPTED_PREFIX)
    ? ciphertext.slice(ENCRYPTED_PREFIX.length)
    : ciphertext;

  const [ivB64, ctB64] = data.split(":");
  if (!ivB64 || !ctB64) {
    throw new Error("Invalid encrypted format: expected iv:ciphertext");
  }

  const iv = fromBase64(ivB64);
  const ct = fromBase64(ctB64);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ct.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if a string looks like it was encrypted by this module.
 *
 * Uses the "enc:" prefix to identify encrypted content. This allows
 * graceful handling of mixed encrypted/plaintext data during migration.
 *
 * @param value - The string to check
 * @returns true if the string starts with the encrypted prefix
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}
