/**
 * @souli/crypto — zero-dependency client-side cryptography for the Souli app.
 *
 * Built on pure Web Crypto API. No network calls. No external dependencies.
 * Audit-friendly: the entire module is ~3.3k lines across 8 files. Every
 * import in this index is exported by name so consumers can tree-shake
 * what they don't need.
 *
 * Public surface:
 *   - AES-GCM 256 encryption/decryption (crypto.ts)
 *   - PBKDF2 + AES-KW key wrapping (crypto-keys.ts)
 *   - In-memory session key lifecycle (crypto-session.ts)
 *   - Pre-confirmation salt persistence (crypto-salt-persist.ts)
 *   - Version-1 → version-2 migration (crypto-migrate.ts)
 *   - End-to-end-encrypted public-share envelope (crypto-sharing.ts)
 *   - BIP39 recovery phrase generation (bip39.ts + bip39-wordlist.ts)
 */
export * from "./crypto";
export * from "./crypto-keys";
export * from "./crypto-session";
export * from "./crypto-salt-persist";
export * from "./crypto-migrate";
export * from "./crypto-sharing";
export * from "./bip39";
export { BIP39_WORDLIST } from "./bip39-wordlist";
