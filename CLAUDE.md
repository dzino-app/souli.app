# Dzino — Claude Code Instructions

## Project
Dzino is a personal AI companion app built with Next.js 14, Gemini 2.5 Flash, Supabase, and next-intl.

## Commands
- Build: `cd app && bun run build`
- Typecheck: `cd app && bun run typecheck`
- Lint: `cd app && bun run lint`
- Test: `cd app && bun run test`
- Dev: `cd app && bun run dev`

## Architecture
- Soul files (.md) are stored in Supabase Storage, cached in localStorage
- Core values (genes) are in `src/lib/dzino-core-values.ts` — NEVER user-editable
- LLM: Gemini 2.5 Flash via `@google/generative-ai` (src/lib/llm.ts)
- Languages: 25 supported, auto-detected from user messages
- Gamification: XP, levels, streaks, achievements, daily challenges

## Skills

### /align-translations
Align all translation files and soul defaults with the English source of truth.
1. Compare sk.json vs en.json — find missing keys in either direction
2. Check soul file defaults in soul.ts — ensure they match the English templates in languages.ts
3. Check dzino-core-values.ts — ensure it's complete and consistent
4. Report what's missing or outdated
5. Fix any issues found

### /release
See `.claude/skills/release/SKILL.md`.

### /align-genes
Review and update Dzino's core values (genes) in dzino-core-values.ts.
1. Read the current CORE_VALUES
2. Check for completeness: safety, morals, challenges, emotions, curiosity, health, language
3. Suggest improvements based on latest AI safety best practices
4. Ensure genes can't be bypassed via soul file edits or language switching
