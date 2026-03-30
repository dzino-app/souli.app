# dzino — autoresearch program

This is an autonomous research loop for building and iterating on the Dzino MVP — an AI-powered workspace for non-technical Slovak users.

## Context

Read `research.md` for the full market research. The TL;DR:

- **Target users**: Non-technical Slovaks who want AI capabilities behind a familiar, simple UI
- **MVP scope**: File storage + AI chat over files + document editor with AI assistance
- **Stack**: Next.js 14 + FastAPI + Supabase + Claude API + TipTap
- **Language**: Slovak (sk) primary, English (en) secondary
- **Design principle**: Looks like Google Drive / e-shop — zero AI jargon

## Setup

To set up a new experiment run, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar30`). The branch `autoresearch/<tag>` must not already exist.
2. **Create the branch**: `git checkout -b autoresearch/<tag>` from current main.
3. **Read the in-scope files**: Read all files in the repo for full context.
4. **Initialize results.tsv**: Create `results.tsv` with just the header row.
5. **Confirm and go**: Confirm setup looks good.

Once you get confirmation, kick off the experimentation.

## What you're optimizing

Unlike ML training where you minimize `val_bpb`, here you maximize a **quality score** across multiple dimensions. After each experiment, evaluate your changes against this rubric:

| Dimension | Weight | How to measure |
|---|---|---|
| **Builds successfully** | PASS/FAIL gate | `bun run build` exits 0 |
| **Type-safe** | PASS/FAIL gate | `bun run typecheck` exits 0 |
| **Tests pass** | PASS/FAIL gate | `bun test` exits 0 |
| **Lighthouse Performance** | 20% | Run Lighthouse CI, score 0-100 |
| **Lighthouse Accessibility** | 25% | Run Lighthouse CI, score 0-100 |
| **Bundle size** | 15% | Smaller is better (KB) |
| **Feature completeness** | 25% | Checklist of MVP features implemented (%) |
| **Code simplicity** | 15% | Lines of code for equivalent functionality (fewer = better) |

**The composite score**: `0.20*perf + 0.25*a11y + 0.15*(100 - bundle_kb/10) + 0.25*features_pct + 0.15*(100 - loc/50)`

Clamp each component to [0, 100]. Higher is better.

## MVP feature checklist

Track feature completeness against this list:

- [ ] Project scaffolded (Next.js 14 + App Router + Tailwind + Shadcn)
- [ ] Slovak locale setup (next-intl, sk as default)
- [ ] Auth flow (Clerk or Supabase Auth)
- [ ] Dashboard / home page (simple, familiar layout)
- [ ] File upload (drag-and-drop, click-to-browse)
- [ ] File list view (grid + list toggle, like Google Drive)
- [ ] File preview (PDF, images, text)
- [ ] Folder navigation (create, rename, move files)
- [ ] AI chat panel (slide-out or sidebar)
- [ ] Chat with single file ("Zhrn tento dokument" / "Summarize this document")
- [ ] Chat with multiple files ("Porovnaj tieto dva dokumenty")
- [ ] Chat history (persisted per user)
- [ ] Document editor (TipTap rich text)
- [ ] AI-assisted writing (rewrite selection, expand, summarize, translate)
- [ ] Create new document from prompt
- [ ] Save/export documents (DOCX, PDF)
- [ ] Responsive design (mobile-friendly)
- [ ] Dark mode
- [ ] Loading states and error handling (Slovak error messages)
- [ ] Onboarding flow (explains what the app does, no AI jargon)

Total: 20 features. Each = 5% of `features_pct`.

## Constraints

**What you CAN do:**
- Create, modify, delete any file in the project
- Install packages via `bun add` or `uv pip install`
- Create API routes, components, services, hooks
- Set up database schemas
- Write tests

**What you CANNOT do:**
- Deploy to production
- Create paid accounts or subscriptions on external services
- Modify files outside the `dzino/` directory
- Skip the build/typecheck/test gates

## The experiment loop

LOOP FOREVER:

1. **Plan**: Look at current state. Identify the highest-impact next improvement. Consider:
   - What features are missing from the checklist?
   - What's the weakest quality dimension?
   - Are there any build/type/test failures to fix first?
2. **Implement**: Make the change. Keep it focused — one logical change per experiment.
3. **Commit**: `git add -A && git commit -m "<description>"`
4. **Evaluate**: Run the quality gates:
   ```bash
   bun run build > build.log 2>&1
   bun run typecheck > typecheck.log 2>&1
   bun test > test.log 2>&1
   ```
5. **Score**: Calculate the composite quality score.
6. **Log**: Record results in `results.tsv` (do not commit this file).
7. **Keep or discard**:
   - If all gates pass AND score improved (or new feature added): keep the commit, advance.
   - If gates fail: fix the issue and re-run. If unfixable after 3 attempts, `git reset --hard` to previous commit and move on.
   - If score regressed without adding a feature: `git reset --hard` and try something else.
8. **Repeat**.

## Logging results

Log to `results.tsv` (tab-separated):

```
commit	score	features	status	description
```

1. git commit hash (short, 7 chars)
2. composite quality score (0-100, to 1 decimal)
3. features implemented (count out of 20)
4. status: `keep`, `discard`, or `crash`
5. short text description

Example:

```
commit	score	features	status	description
a1b2c3d	0.0	0	keep	baseline - empty Next.js scaffold
b2c3d4e	12.5	1	keep	add Tailwind + Shadcn UI setup
c3d4e5f	18.3	2	keep	add Slovak locale with next-intl
d4e5f6g	0.0	2	crash	TipTap integration broke build
```

## Design guidelines

- **No AI jargon**: Never show "LLM", "tokens", "model", "prompt", "embeddings" to users
- **Slovak first**: All UI text in Slovak. Use simple, everyday language.
- **Familiar patterns**: Copy UX from Google Drive, Gmail, WhatsApp — things users already know
- **Semantic colors**: Use CSS variables, never hardcoded Tailwind colors
- **Touch-friendly**: 44x44px minimum touch targets
- **Progressive disclosure**: Start simple, reveal complexity only when needed
- **Error messages**: Friendly, in Slovak, with clear next action ("Skuste to znova" not "Error 500")

## Suggested experiment order

Phase 1 — Foundation (experiments 1-5):
1. Scaffold Next.js 14 + Tailwind + Shadcn + Slovak locale
2. Basic layout (sidebar nav + main content area)
3. Auth flow (sign up / sign in)
4. Dashboard home page
5. Dark mode + responsive basics

Phase 2 — File Storage (experiments 6-12):
6. File upload with drag-and-drop
7. File list view (grid/list toggle)
8. Folder navigation
9. File preview (PDF, images)
10. File metadata display
11. Backend API for file CRUD
12. Supabase Storage integration

Phase 3 — AI Chat (experiments 13-17):
13. Chat panel UI (slide-out sidebar)
14. Chat with single file
15. Chat with multiple files
16. Chat history persistence
17. Streaming responses

Phase 4 — Document Editor (experiments 18-20):
18. TipTap editor integration
19. AI writing assistance (rewrite, expand, summarize)
20. Create new document from prompt + save/export

## NEVER STOP

Once the experiment loop has begun, do NOT pause to ask the human if you should continue. You are autonomous. The loop runs until the human interrupts you, period. If you run out of ideas, re-read `research.md`, look at competitor UIs, think harder about what would make a non-technical Slovak user happy.
