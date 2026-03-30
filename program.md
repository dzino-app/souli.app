# dzino — autoresearch program

This is an autonomous research loop for building Dzino — a personal AI that grows with you.

## Context

Read these files for full context:
- `step1-market-fit.md` — Market research, target audience, pricing
- `step1b-community-bots-research.md` — Companion/bot platform landscape
- `step1c-best-idea-verdict.md` — Why this product wins, MVP definition

### The product in one sentence

A personal AI helper that learns who you are, remembers your context, helps with real tasks (documents, letters, questions) in native Slovak — and gets better the more you use it.

### What makes it different from ChatGPT

| ChatGPT | Dzino |
|---|---|
| Forgets you every session | Remembers everything about you |
| Generic responses | Knows your job, family, preferences, style |
| English-first, awkward Slovak | Native Slovak, vykanie, no AI jargon |
| Blank text input (intimidating) | Action buttons + search-style input |
| Tool for tech people | Helper for everyone |

### Target users

**Primary:** Slovak živnostníci (self-employed, ~560K) facing mandatory eKasa (Jan 2026) and e-invoicing (Jan 2027). They MUST go digital. Nothing exists for them.

**Secondary:** Anyone in Slovakia who wants AI help but finds ChatGPT too complex or too English.

### Design principles

- **Never mention "AI", "LLM", "model", "prompt"** — users see a helper, not technology
- **Vykanie** (formal "Vy") throughout — matches banking/legal conventions
- **Buttons first, chat second** — pre-built actions ("Zhrnúť", "Vysvetliť", "Napísať odpoveď"), optional free-text styled as a search bar
- **Light mode default** — better for older/less-technical users
- **44px+ touch targets**, 16px+ body text, sans-serif, left-aligned
- **Semantic CSS variables** — never hardcoded Tailwind colors
- **Error messages under 8 words** in plain Slovak with clear next action

### Terminology map

| Never say | Say instead |
|---|---|
| Upload | Nahrať súbor |
| AI / LLM / Model | (never mention it) |
| Query / Prompt | Opýtajte sa |
| Generate summary | Zhrnúť |
| Dashboard | Prehľad |
| Error occurred | Niečo sa nepodarilo |
| Submit | Odoslať |
| Settings | Nastavenia |

---

## Setup

To set up a new experiment run:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `mar31`). The branch `autoresearch/<tag>` must not already exist.
2. **Create the branch**: `git checkout -b autoresearch/<tag>` from current main.
3. **Read ALL files in the repo** for full context: `research.md`, `step1-market-fit.md`, `step1b-community-bots-research.md`, `step1c-best-idea-verdict.md`, and this file.
4. **Verify the Next.js scaffold** exists in `app/` directory. If not, scaffold it.
5. **Initialize results.tsv**: Create with just the header row if it doesn't exist.
6. **Confirm and go**.

---

## What you're optimizing

### Quality gates (PASS/FAIL — must all pass)

| Gate | Command | Must |
|---|---|---|
| Builds | `cd app && bun run build` | Exit 0 |
| Types | `cd app && bun run typecheck` | Exit 0 |
| Tests | `cd app && bun test` | Exit 0 |
| Lint | `cd app && bun run lint` | Exit 0 |

### Quality score (weighted composite, 0-100)

| Dimension | Weight | How to measure |
|---|---|---|
| Feature completeness | 35% | Checklist below (% implemented) |
| UX quality | 25% | Does it feel like a real app? Buttons work, states are handled, Slovak text is correct |
| Memory system quality | 20% | Does the bot remember context across conversations? Is memory retrieval relevant? |
| Code simplicity | 10% | Fewer lines for equivalent functionality = better |
| Performance | 10% | Page loads fast, no unnecessary re-renders, small bundle |

---

## MVP Feature Checklist

### Phase 1 — Foundation (experiments 1-6)

- [ ] Next.js 14 + App Router + Tailwind + Shadcn scaffolded
- [ ] Slovak locale (next-intl, sk default, all UI text in Slovak with vykanie)
- [ ] Supabase Auth (email + password, no social login yet)
- [ ] Onboarding flow: bot asks 5 questions (meno, čo robíte, čo potrebujete, ...)
- [ ] Main screen: clean layout with action buttons (not a blank chat)
- [ ] Dark mode toggle + responsive mobile-first design

### Phase 2 — The Core Loop: Ask + Remember (experiments 7-14)

- [ ] Document upload (drag-and-drop, click-to-browse, PDF/DOCX/images)
- [ ] Action buttons on uploaded document: "Zhrnúť", "Vysvetliť jednoducho", "Nájsť kľúčové body", "Nájsť riziká"
- [ ] Free-text question input (search-bar style with placeholder example)
- [ ] AI response display with streaming (markdown rendered, source passages highlighted)
- [ ] **Memory system: bot stores facts it learns about the user** (Supabase table: user_id, fact, source_message, created_at)
- [ ] **Memory retrieval: bot loads relevant memories into context** before each response
- [ ] **Memory display: user can see "Čo o vás viem"** (what I know about you) — transparent, editable
- [ ] Conversation history (persisted, organized by date)

### Phase 3 — Write For Me (experiments 15-18)

- [ ] "Napíšte to za mňa" flow: user describes need in casual Slovak → bot writes formal letter/email
- [ ] Letter templates: sťažnosť (complaint), žiadosť (request), výpoveď (termination), reklamácia (claim)
- [ ] Preview + edit generated text before copy/download
- [ ] Export as PDF or copy to clipboard

### Phase 4 — Sharing (experiments 19-22)

- [ ] "Pozvite priateľa" — invite link with referral tracking
- [ ] Shared skill concept: user marks a bot capability as "shareable"
- [ ] Skill marketplace page: browse skills shared by other users
- [ ] Apply a shared skill to your own bot (one-click)

Total: 22 features. Each = ~4.5% of `features_pct`.

---

## Constraints

**What you CAN do:**
- Create, modify, delete any file in the `app/` directory
- Install packages via `cd app && bun add <package>`
- Create API routes, components, services, hooks
- Set up Supabase schemas (SQL files in `app/supabase/`)
- Write tests
- Use Claude API (via `@anthropic-ai/sdk`) for AI responses
- Use Supabase JS client for auth, database, storage

**What you CANNOT do:**
- Deploy to production
- Create paid accounts on external services
- Modify files outside `dzino/`
- Skip the build/typecheck/test/lint gates
- Use hardcoded Tailwind colors (must use CSS variables)
- Show AI jargon in the UI
- Use tykanie (informal "ty") — always vykanie ("Vy")

---

## The experiment loop

LOOP FOREVER:

1. **Plan**: Look at current state. What's the highest-impact next feature from the checklist? Fix any broken gates first.
2. **Implement**: One focused change per experiment. Keep it clean.
3. **Commit**: `cd app && git add -A && git commit -m "<description>"`
4. **Evaluate**: Run all gates:
   ```bash
   cd app && bun run build > ../build.log 2>&1
   cd app && bun run lint > ../lint.log 2>&1
   cd app && bun test > ../test.log 2>&1
   ```
5. **Score**: Calculate quality score.
6. **Log**: Record in `results.tsv` (do NOT commit this file).
7. **Keep or discard**:
   - Gates pass AND score improved or new feature: **keep**, advance branch
   - Gates fail: fix (max 3 attempts), then `git reset --hard` and move on
   - Score regressed without new feature: `git reset --hard` and try something else
8. **Repeat**.

## Logging results

Tab-separated `results.tsv`:

```
commit	score	features	status	description
```

- commit: 7-char hash
- score: 0-100 (1 decimal)
- features: count out of 22
- status: `keep`, `discard`, or `crash`
- description: short text

Example:
```
commit	score	features	status	description
a1b2c3d	0.0	0	keep	baseline - Next.js scaffold
b2c3d4e	8.2	1	keep	add Slovak locale with next-intl
c3d4e5f	14.5	3	keep	onboarding flow - 5 questions
d4e5f6g	22.1	5	keep	document upload + action buttons
e5f6g7h	0.0	5	crash	memory system broke Supabase types
f6g7h8i	31.8	7	keep	memory system with retrieval
```

---

## Suggested experiment order

| Exp | Feature | Notes |
|---|---|---|
| 1 | Scaffold + Tailwind + Shadcn | Use `app/` directory. Ensure `bun run build` passes. |
| 2 | Slovak locale (next-intl) | sk as default. All strings in Slovak. Vykanie. |
| 3 | Supabase Auth | Email/password signup + login. Slovak UI. |
| 4 | Onboarding flow | Bot asks: Ako sa voláte? Čo robíte? S čím vám môžem pomôcť? Aký typ dokumentov riešite? Ako vám mám písať — stručne alebo podrobne? |
| 5 | Main screen layout | Action buttons grid, not a blank chat. See wireframe in step1-market-fit.md. |
| 6 | Dark mode + responsive | Toggle in header. Mobile-first. |
| 7 | Document upload | Drag-and-drop zone. Accept PDF, DOCX, JPG, PNG. Slovak labels. |
| 8 | Document action buttons | "Zhrnúť", "Vysvetliť jednoducho", "Nájsť kľúčové body", "Nájsť riziká" |
| 9 | Claude API integration | API route that sends document + action to Claude. Streaming response. |
| 10 | AI response display | Streaming markdown, source passages in expandable sections. |
| 11 | Free-text question input | Search-bar style. Placeholder: "Napr.: Môžem túto zmluvu vypovedať?" |
| 12 | Memory system (write) | After each conversation, extract facts about user. Store in Supabase. |
| 13 | Memory system (read) | Before each response, load relevant memories. Inject into system prompt. |
| 14 | "Čo o vás viem" page | User sees and can edit/delete stored memories. Full transparency. |
| 15 | Conversation history | Persisted in Supabase. List view by date. Resume any conversation. |
| 16 | "Napíšte to za mňa" flow | Describe need → bot writes formal letter. |
| 17 | Letter templates | Sťažnosť, žiadosť, výpoveď, reklamácia — pre-filled contexts. |
| 18 | Preview + edit + export | Edit generated text. Download as PDF or copy. |
| 19 | Invite flow | Generate shareable link. Track referrals. |
| 20 | Shareable skills concept | Mark bot capabilities as reusable. |
| 21 | Skills marketplace UI | Browse + apply skills from other users. |
| 22 | Polish + edge cases | Loading states, error handling, empty states, Slovak error messages. |

---

## Technical architecture

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # Locale-aware routing (sk default)
│   │   │   ├── page.tsx        # Main screen (action buttons)
│   │   │   ├── onboarding/     # First-time onboarding flow
│   │   │   ├── document/       # Document upload + actions
│   │   │   ├── chat/           # Conversation view
│   │   │   ├── memory/         # "Čo o vás viem" page
│   │   │   ├── write/          # "Napíšte to za mňa" flow
│   │   │   ├── skills/         # Skills marketplace
│   │   │   └── settings/       # Nastavenia
│   │   └── api/                # API routes
│   │       ├── chat/           # Claude API integration
│   │       ├── memory/         # Memory CRUD
│   │       ├── documents/      # File processing
│   │       └── auth/           # Supabase auth helpers
│   ├── components/
│   │   ├── ui/                 # Shadcn components
│   │   ├── onboarding/         # Onboarding steps
│   │   ├── document/           # Upload, preview, actions
│   │   ├── chat/               # Message bubbles, streaming
│   │   ├── memory/             # Memory display, editor
│   │   └── layout/             # Header, nav, footer
│   ├── lib/
│   │   ├── supabase/           # Supabase client + types
│   │   ├── ai/                 # Claude API wrapper + memory injection
│   │   └── utils/              # Helpers
│   ├── hooks/                  # React hooks
│   ├── i18n/                   # next-intl messages (sk.json, en.json)
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # SQL migrations
├── public/                     # Static assets
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

### Database schema (Supabase)

```sql
-- Users (managed by Supabase Auth)

-- User memories (what the bot knows about you)
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  fact TEXT NOT NULL,              -- "Používateľ sa volá Maroš"
  category TEXT,                   -- "personal", "work", "preferences"
  source_message_id UUID,          -- which conversation produced this
  confidence FLOAT DEFAULT 1.0,    -- how sure are we
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT,                      -- auto-generated from first message
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations NOT NULL,
  role TEXT NOT NULL,               -- 'user' | 'assistant'
  content TEXT NOT NULL,
  document_id UUID,                 -- if message references a document
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,       -- Supabase Storage path
  content_text TEXT,                -- extracted text for AI
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shared skills (Phase 4)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,       -- the actual skill definition
  usage_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## NEVER STOP

Once the experiment loop has begun, do NOT pause to ask the human if you should continue. You are autonomous. The loop runs until the human interrupts you, period.

If you run out of ideas:
1. Re-read `step1-market-fit.md` and `step1c-best-idea-verdict.md`
2. Think about what a non-technical Slovak živnostník would struggle with
3. Try to break your own app (edge cases, empty states, weird inputs)
4. Optimize what exists (smaller bundle, faster loads, better Slovak text)
5. Add tests for untested paths
