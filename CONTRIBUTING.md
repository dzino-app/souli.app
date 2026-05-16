# Contributing to Souli

Issues and PRs welcome. This file lists the places where outside contributions move the project forward fastest.

## Highest-leverage contributions

### 1. Native-speaker polish on the 9 locales

The Pixoci canonical story (13 episodes × 9 locales = 135 markdown files) was translated by parallel LLM passes, then polished by another LLM pass that caught 164 issues across all locales. The result is *good*, but no LLM equals a native speaker.

Where each locale stands today:

| Locale | Translation source | LLM polish | Native-speaker pass | Quality bar |
|---|---|---|---|---|
| 🇸🇰 sk | original | ✅ (34 edits) | — | author's native, good baseline |
| 🇬🇧 en | LLM from sk | ✅ (17 edits) | — | author-fluent, but not native |
| 🇨🇿 cs | LLM from en | ✅ (13 edits) | — | open |
| 🇩🇪 de | LLM from en | ✅ (26 edits) | — | open |
| 🇪🇸 es | LLM from en | ✅ (10 edits) | — | open |
| 🇫🇷 fr | LLM from en | ✅ (29 edits) | — | open |
| 🇮🇳 hi | LLM from en | ✅ (10 edits) | — | open |
| 🇭🇺 hu | LLM from en | ✅ (10 edits) | — | open |
| 🇵🇱 pl | LLM from en | ✅ (15 edits) | — | open |

**To contribute a native-speaker pass:**

1. Pick your locale folder under `app/content/story/{locale}/`
2. Read `scroll.md` first to absorb the world bible — voice notes for each mentor, tone, palette of word choices
3. Read all 13 episodes in `episodes/eXX.md`
4. Edit anything that reads unnatural to a native ear — awkward calques, register slips, declension/gender errors, untranslated technical jargon
5. PR your edits with a short summary of issues you fixed

Voice should be: fairy-tale, chill, mysterious — never preachy, never urgent. "Like a children's book read aloud, not television." Otto is theatrical, Bruno is terse, Hana is pastoral, Rex is loud and warm — each mentor has a register.

### 2. Hand-paint the style anchors

The Pixoci production gallery at `/pribeh/assets` (live at https://souli.app/en/pribeh/assets) shows 18 style-anchor slots. The 13 mentor + Dzino sheets are rendered by the app's own `PixelAvatar` (continuous with `/kniznica`); the 5 biome plates are procedural placeholders.

To upgrade an anchor: drop a 512×512 PNG at the slot's path under `app/public/style-anchors/`. The build script auto-detects size; anything >30KB is classified as "Painted" (vs. our placeholder cards).

See [issue #50](https://github.com/dzino-app/dzino/issues/50) for the full kickoff plan, including the Hana + Pixel Garden pair that unblocks E01 pilot validation in Runway Gen-4.

### 3. Open issues with `good first issue` or `help wanted`

Browse https://github.com/dzino-app/dzino/issues — look for those labels.

## Development setup

```bash
git clone https://github.com/dzino-app/dzino.git
cd dzino/app
bun install
bun run dev          # → http://localhost:3000
bun run typecheck
bun run lint
bun run test
```

Prerequisites: Bun 1.2+, Node 24+.

## Code style

- TypeScript everywhere (Next.js 15 App Router)
- Prettier defaults; ESLint enforced in CI
- Server Components by default; "use client" only when needed
- Avoid abstractions beyond what the task requires
- No comments unless WHY is non-obvious

## Commit style

Conventional-ish, but the *what* matters more than the format. Good:

```
Render mentors from the app's canonical PixelAvatar — same pixels in /kniznica → same pixels in the show
```

Bad:

```
fix: refactor
```

## Crypto / security

The encryption module at `app/src/lib/crypto*.ts` and `app/src/lib/bip39*.ts` has zero external dependencies and uses pure Web Crypto API. If you touch this code:

- Don't introduce new dependencies
- Don't expose plaintext to non-client code paths
- Open an issue first for any architectural change — happy to discuss

## License

By contributing you agree your contributions are licensed under [AGPL-3.0](LICENSE), same as the rest of the project.

## Questions

Open an issue. Slow but reliable response.
