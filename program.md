# dzino — autoresearch program (phase 2: deploy & launch)

## Context

Dzino is a gamified AI companion with:
- Pixel avatar that grows with levels (4×4 → 20×20)
- Soul files (.md) — shared knowledge base between user and Dzino
- Genes (immutable safety/growth values)
- Gamification: XP, levels, streaks, achievements, daily challenges
- 10 life aspects for challenges (physical, social, mental, creative, etc.)
- Mood tracking, weekly reviews, speech bubbles
- 25+ language auto-detection, Vertex AI (Gemini 2.5 Flash)
- Supabase Auth + Storage, PWA support
- 93 source files, 8 test files, 116 tests passing

### What works
- Chat with Dzino (streaming, soul context, mood-aware)
- Pixel avatar with emotions + level-based resolution
- Challenge system with proof via chat
- Soul browser (view/edit .md files)
- Events (diary + plans)
- Gamification (XP, levels, streaks, achievements)
- Auth (Supabase email+password)
- PWA (installable, push notifications ready)

### What needs fixing before launch
- Unicode escapes in some UI components
- Some unused old components to clean up
- Onboarding flow needs redesign for companion concept
- Settings toggles need to control features
- No Vercel deployment yet
- No analytics

---

## Setup

Tag: `apr02`
Branch: `autoresearch/apr02` from current `autoresearch/mar30`

---

## Quality gates (must all pass)
| Gate | Command | Must |
|---|---|---|
| Builds | `cd app && bun run build` | Exit 0 |
| Types | `cd app && bun run typecheck` | Exit 0 |
| Tests | `cd app && bun test --preload ./src/lib/__tests__/setup.ts` | Exit 0 |
| Lint | `cd app && bun run lint` | Exit 0 |

---

## Phase 2 Checklist

### P0 — Fix before deploy
- [ ] Fix ALL unicode escapes in .tsx files
- [ ] Clean up unused components
- [ ] Fix Vertex AI auth for Vercel (GOOGLE_CLOUD_CREDENTIALS_JSON env var)
- [ ] Auth flow end-to-end (signup → login → home → chat → logout)
- [ ] Remove DEV_RANDOMIZE from avatar.ts for production

### P1 — Deploy
- [ ] Deploy to Vercel
- [ ] Set env vars in Vercel dashboard
- [ ] Verify production on deployed URL
- [ ] Test signup + chat live

### P2 — Polish
- [ ] Redesign onboarding for companion (name, first chat)
- [ ] Wire settings toggles to features
- [ ] Wire weekly review
- [ ] End-to-end: mood → chat → challenges → soul updates
- [ ] Error messages in user's language

### P3 — Analytics & growth
- [ ] Add PostHog/Plausible analytics
- [ ] Track: signups, DAU, messages, challenges, streaks
- [ ] Meta tags for social sharing
- [ ] Product Hunt launch draft

### P4 — Content
- [ ] 100+ challenge templates
- [ ] Seasonal challenges
- [ ] Referral system
- [ ] Push notification triggers

---

## The experiment loop

LOOP FOREVER:
1. Plan → highest-impact next fix
2. Implement → one focused change
3. Commit + push
4. Evaluate → run all gates
5. Keep or discard
6. Repeat

## NEVER STOP
