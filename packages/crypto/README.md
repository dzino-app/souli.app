# @souli/crypto

Zero-dependency client-side cryptography for [Souli](https://souli.app). Pure Web Crypto API.

## What's in here

| Module | Purpose |
| --- | --- |
| `crypto.ts` | AES-GCM 256 encrypt/decrypt + PBKDF2 key derivation |
| `crypto-keys.ts` | Master-key generation + AES-KW wrap/unwrap |
| `crypto-session.ts` | In-memory session-key lifecycle (v1 + v2) |
| `crypto-salt-persist.ts` | Pre-confirmation salt persistence (signup → email-confirmation flow) |
| `crypto-migrate.ts` | v1 (password-derived) → v2 (master-key-wrapped) migration |
| `crypto-sharing.ts` | E2EE envelope for public Pixoci shares — wraps soul under a bundled library key |
| `bip39.ts` | BIP39 mnemonic generation + entropy ↔ phrase conversion |
| `bip39-wordlist.ts` | Standard 2048-word English BIP39 wordlist |

## Zero external dependencies

```bash
grep -rE "fetch|XMLHttpRequest" src/
# (returns only "fetch" string match in the wordlist itself — no network calls)
```

Every primitive comes from `crypto.subtle` (Web Crypto API). The wordlist is a TS constant. The whole package is auditable in one sitting.

## Architecture

```
                     ┌───────────────────────────────┐
                     │  User password                │
                     │  + BIP39 recovery phrase      │
                     └───────────┬───────────────────┘
                                 │
                       PBKDF2 600K iter.
                                 │
                     ┌───────────▼─────────────┐
                     │  Wrapping keys (AES-KW) │
                     └───────────┬─────────────┘
                                 │
                       wraps/unwraps
                                 │
                     ┌───────────▼─────────────┐
                     │  Master key (AES-GCM)   │  ← never leaves client
                     └───────────┬─────────────┘
                                 │
                       AES-GCM 256
                                 │
                     ┌───────────▼─────────────┐
                     │  Soul files (ciphertext)│  ← what the server stores
                     └─────────────────────────┘
```

The server only ever sees the two `wrapped_key_*` blobs (under password + under recovery phrase) plus the ciphertext of each soul file. Without either wrapping key, the data is mathematically unreadable.

## Usage in Souli app

The main app (`app/`) imports from this package via workspace alias:

```ts
import {
  initCryptoSession,
  generateMasterKey,
  wrapMasterKey,
  generateMnemonic,
} from "@souli/crypto";
```

## Why this exists

The privacy policy promises zero-knowledge client-side encryption. A closed-source bundle makes that promise unverifiable — users have to trust whatever JS Vercel serves them. By open-sourcing the crypto layer separately:

- Anyone can audit or fuzz the module in isolation
- Supply-chain attacks become detectable (compare published vs. bundled SHA)
- Other projects can reuse it under [AGPL-3.0](./LICENSE)

## Status

**Pre-1.0.** Used in production at [souli.app](https://souli.app) since 2026-04. The API is settled but not yet versioned for npm. Path to v1:

1. ✅ Extract from main repo
2. ⏳ Add unit tests for each primitive (currently tested only through app integration)
3. ⏳ Fuzz the encrypt/decrypt + wrap/unwrap round-trips
4. ⏳ Independent crypto review
5. ⏳ Publish to npm as `@souli/crypto`

Until then, depend on it via git or workspace.

## License

[AGPL-3.0](../../LICENSE)
