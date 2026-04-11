# Dzino

AI companion that knows you. Open-source, end-to-end encrypted.

## Reproducible build

```bash
# Prerequisites: Bun 1.2+, Node 24+
bun install --frozen-lockfile
cd app && bun run build
```

The build output in `app/.next/` should match what Vercel serves. To verify:

```bash
# After building locally:
sha256sum app/.next/BUILD_ID
# Compare with the BUILD_ID served at https://dzino.sk/_next/BUILD_ID
```

## Verify the crypto module

The zero-knowledge encryption code has zero external dependencies — pure Web Crypto API:

```
app/src/lib/crypto.ts          # AES-GCM 256 + PBKDF2
app/src/lib/crypto-keys.ts     # Master key wrap/unwrap (AES-KW)
app/src/lib/crypto-session.ts  # Session key lifecycle
app/src/lib/bip39.ts           # Recovery phrase generation
app/src/lib/bip39-wordlist.ts  # Standard BIP39 English wordlist
```

## Development

```bash
cd app && bun run dev        # http://localhost:3000
cd app && bun run typecheck  # TypeScript
cd app && bun run lint       # ESLint
cd app && bun run test       # Bun test runner
```

## License

AGPL-3.0 — see [LICENSE](LICENSE).
