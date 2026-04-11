/**
 * Asymmetric Key Management for E2E Encrypted Sharing
 *
 * Uses ECDH with P-256 (NIST curve, widely supported in Web Crypto) for
 * key agreement, then derives an AES-GCM 256-bit key via HKDF for
 * symmetric encryption of shared content.
 *
 * Flow for sharing content with another user:
 *   1. Sender has their ECDH private key, recipient has their ECDH public key
 *   2. ECDH(senderPrivate, recipientPublic) → shared secret (raw bits)
 *   3. HKDF(sharedSecret, salt, info) → AES-GCM key
 *   4. AES-GCM encrypt the content with a random IV
 *
 * Recipient reverses with ECDH(recipientPrivate, senderPublic) — same shared secret.
 *
 * "Public to everyone" mode:
 *   For content published to the Pixoci library (public but E2E encrypted),
 *   we use a well-known keypair whose private key is bundled in the client.
 *   This means:
 *   - The server stores only ciphertext (can't read it — no browser/Web Crypto)
 *   - Any Dzino client can decrypt (the well-known private key is in the JS bundle)
 *   - This is NOT secret from other Dzino users — it's "encrypted at rest on server"
 *   - It prevents passive server-side data mining while keeping content shareable
 *   This is a deliberate tradeoff: zero-knowledge from the server, readable by any client.
 */

import { toBase64, fromBase64 } from "./crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** AES-GCM IV length in bytes (96-bit, NIST recommended) */
const IV_LENGTH = 12;

/** HKDF info string — domain separation for Dzino sharing keys */
const HKDF_INFO = new TextEncoder().encode("dzino-e2e-sharing-v1");

/** HKDF salt length in bytes */
const HKDF_SALT_LENGTH = 16;

/**
 * Well-known ECDH keypair for "public to everyone" content.
 *
 * The private key is intentionally bundled in the client code. This provides
 * encryption at rest on the server (which has no Web Crypto context) while
 * allowing any Dzino client to decrypt shared library content.
 *
 * These are JWK representations of a fixed P-256 ECDH keypair.
 * Generated once, never rotated (rotation would break existing shared content).
 */
const WELL_KNOWN_PUBLIC_JWK: JsonWebKey = {
  kty: "EC",
  crv: "P-256",
  x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
  y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
  ext: true,
};

const WELL_KNOWN_PRIVATE_JWK: JsonWebKey = {
  kty: "EC",
  crv: "P-256",
  x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
  y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
  d: "jpsQnnGQmL-YBIffS1BSyVKhrlRhnkCSES2OdyC8KE8",
  ext: true,
};

// ---------------------------------------------------------------------------
// Key generation & export/import
// ---------------------------------------------------------------------------

/**
 * Generate a new ECDH P-256 keypair for sharing.
 *
 * The private key is extractable so it can be encrypted under the user's
 * session key before storage. The public key is always extractable.
 */
export async function generateUserKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable — needed to export & encrypt the private key
    ["deriveKey", "deriveBits"],
  );
}

/**
 * Export a public key as a base64-encoded SPKI blob.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey("spki", key);
  return toBase64(new Uint8Array(spki));
}

/**
 * Import a base64-encoded SPKI public key as a CryptoKey.
 */
export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const spki = fromBase64(b64);
  return crypto.subtle.importKey(
    "spki",
    spki.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
}

/**
 * Encrypt an ECDH private key under the user's AES-GCM session key.
 *
 * Exports the private key as PKCS8, then encrypts it with the provided
 * session key. Format: base64(iv):base64(ciphertext)
 */
export async function encryptPrivateKey(
  privateKey: CryptoKey,
  sessionKey: CryptoKey,
): Promise<string> {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    sessionKey,
    pkcs8,
  );

  return toBase64(iv) + ":" + toBase64(new Uint8Array(ciphertext));
}

/**
 * Decrypt an ECDH private key that was encrypted under the session key.
 *
 * Returns a non-extractable CryptoKey suitable for ECDH derivation.
 */
export async function decryptPrivateKey(
  encrypted: string,
  sessionKey: CryptoKey,
): Promise<CryptoKey> {
  const [ivB64, ctB64] = encrypted.split(":");
  if (!ivB64 || !ctB64) {
    throw new Error("Invalid encrypted private key format");
  }

  const iv = fromBase64(ivB64);
  const ct = fromBase64(ctB64);

  const pkcs8 = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    sessionKey,
    ct.buffer as ArrayBuffer,
  );

  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "ECDH", namedCurve: "P-256" },
    false, // non-extractable for session use
    ["deriveKey", "deriveBits"],
  );
}

// ---------------------------------------------------------------------------
// ECDH key agreement + HKDF → AES-GCM key
// ---------------------------------------------------------------------------

/**
 * Derive a shared AES-GCM 256-bit key from an ECDH private key and a
 * peer's public key using ECDH + HKDF.
 *
 * The salt must be the same on both sides (sender includes it in the message).
 * HKDF provides proper key stretching and domain separation.
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  salt: Uint8Array,
): Promise<CryptoKey> {
  // Step 1: ECDH → raw shared secret bits
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256,
  );

  // Step 2: Import shared bits as HKDF key material
  const hkdfMaterial = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    "HKDF",
    false,
    ["deriveKey"],
  );

  // Step 3: HKDF → AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt.buffer as ArrayBuffer,
      info: HKDF_INFO.buffer as ArrayBuffer,
    },
    hkdfMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// ---------------------------------------------------------------------------
// Encrypt / decrypt for a specific recipient
// ---------------------------------------------------------------------------

/**
 * Encrypt plaintext for a specific recipient using ECDH key agreement.
 *
 * Output format: base64(hkdfSalt):base64(iv):base64(ciphertext)
 * The HKDF salt and IV are random per message and included in the output.
 *
 * @param plaintext - The string to encrypt
 * @param senderPrivateKey - Sender's ECDH private key
 * @param recipientPublicKey - Recipient's ECDH public key
 * @returns Colon-separated base64: hkdfSalt:iv:ciphertext
 */
export async function encryptForRecipient(
  plaintext: string,
  senderPrivateKey: CryptoKey,
  recipientPublicKey: CryptoKey,
): Promise<string> {
  // Random salt for HKDF — unique per message
  const hkdfSalt = crypto.getRandomValues(new Uint8Array(HKDF_SALT_LENGTH));

  // Derive shared AES-GCM key
  const sharedKey = await deriveSharedSecret(
    senderPrivateKey,
    recipientPublicKey,
    hkdfSalt,
  );

  // Encrypt with random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    sharedKey,
    encoded.buffer as ArrayBuffer,
  );

  return (
    toBase64(hkdfSalt) +
    ":" +
    toBase64(iv) +
    ":" +
    toBase64(new Uint8Array(ciphertext))
  );
}

/**
 * Decrypt ciphertext from a sender using ECDH key agreement.
 *
 * @param ciphertext - The encrypted string in "hkdfSalt:iv:ciphertext" format
 * @param recipientPrivateKey - Recipient's ECDH private key
 * @param senderPublicKey - Sender's ECDH public key
 * @returns The original plaintext string
 * @throws DOMException if decryption fails (wrong keys or tampered data)
 */
export async function decryptFromSender(
  ciphertext: string,
  recipientPrivateKey: CryptoKey,
  senderPublicKey: CryptoKey,
): Promise<string> {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid shared ciphertext format: expected hkdfSalt:iv:ciphertext",
    );
  }
  const [saltB64, ivB64, ctB64] = parts;

  const hkdfSalt = fromBase64(saltB64);
  const iv = fromBase64(ivB64);
  const ct = fromBase64(ctB64);

  // Derive the same shared AES-GCM key
  const sharedKey = await deriveSharedSecret(
    recipientPrivateKey,
    senderPublicKey,
    hkdfSalt,
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    sharedKey,
    ct.buffer as ArrayBuffer,
  );

  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// Well-known keypair for "public to everyone" content
// ---------------------------------------------------------------------------

/** Cached well-known keys — imported lazily on first use */
let _wellKnownPublic: CryptoKey | null = null;
let _wellKnownPrivate: CryptoKey | null = null;

/**
 * Get the well-known public key for encrypting content to the public library.
 *
 * Any user can encrypt content for the public library using this key.
 * The corresponding private key is also bundled in the client, so any
 * Dzino client can decrypt it.
 */
export async function getWellKnownPublicKey(): Promise<CryptoKey> {
  if (!_wellKnownPublic) {
    _wellKnownPublic = await crypto.subtle.importKey(
      "jwk",
      WELL_KNOWN_PUBLIC_JWK,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      [],
    );
  }
  return _wellKnownPublic;
}

/**
 * Get the well-known private key for decrypting public library content.
 *
 * This key is intentionally bundled in the client. The tradeoff is documented
 * at the top of this file. The server cannot decrypt because it has no
 * Web Crypto API context for ECDH.
 */
export async function getWellKnownPrivateKey(): Promise<CryptoKey> {
  if (!_wellKnownPrivate) {
    _wellKnownPrivate = await crypto.subtle.importKey(
      "jwk",
      WELL_KNOWN_PRIVATE_JWK,
      { name: "ECDH", namedCurve: "P-256" },
      false, // non-extractable
      ["deriveKey", "deriveBits"],
    );
  }
  return _wellKnownPrivate;
}

/**
 * Encrypt content for the public Pixoci library.
 *
 * Uses the sender's private key + the well-known public key. Any Dzino
 * client can decrypt using the well-known private key + sender's public key.
 *
 * @param plaintext - Content to encrypt
 * @param senderPrivateKey - The publishing user's ECDH private key
 * @returns Encrypted string in "hkdfSalt:iv:ciphertext" format
 */
export async function encryptForPublicLibrary(
  plaintext: string,
  senderPrivateKey: CryptoKey,
): Promise<string> {
  const publicKey = await getWellKnownPublicKey();
  return encryptForRecipient(plaintext, senderPrivateKey, publicKey);
}

/**
 * Decrypt content from the public Pixoci library.
 *
 * Uses the well-known private key + the sender's public key to derive
 * the same shared secret that was used for encryption.
 *
 * @param ciphertext - The encrypted string from the library
 * @param senderPublicKey - The publishing user's ECDH public key
 * @returns The original plaintext
 */
export async function decryptFromPublicLibrary(
  ciphertext: string,
  senderPublicKey: CryptoKey,
): Promise<string> {
  const privateKey = await getWellKnownPrivateKey();
  return decryptFromSender(ciphertext, privateKey, senderPublicKey);
}
