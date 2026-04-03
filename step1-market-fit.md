# Step 1: Market Fit — Dzino MVP

## The One-Line Pitch

**"Nahrajte akykolvek dokument a opytajte sa coho chcete — po slovensky."**
(Upload any document and ask whatever you want — in Slovak.)

---

## Beachhead Market: Who We Build For First

### Primary: Solo Accountants + Tradespeople (Zivnostnici)

**Why them and why NOW:**

Slovakia is implementing three overlapping digital mandates that create a **must-buy moment**:

| Mandate | Deadline | Who it affects | Penalty |
|---|---|---|---|
| eKasa-only cash registers | Jan 2026 | Every seller, including craftsmen | Fines |
| Mandatory B2B e-invoicing | Jan 2027 | Every VAT-registered business (>EUR 49,790) | Up to EUR 100,000 |
| Real-time VAT reporting | Jan 2027 | Same | Same |

This forces ~200,000-300,000 small businesses — who currently run on paper, USB sticks, and basic email — to go digital. They need tools NOW and nothing exists for them.

**The numbers:**
- ~560K self-employed (zivnostnici) in Slovakia
- Existing tools: Pohoda (desktop, no AI), SuperFaktura (EUR 15.90/mo, invoicing only), Vyfakturuj (EUR 23.60/mo, no AI)
- Gap: **No Slovak tool combines AI + document understanding + file management + email**
- Willingness to pay: FORCED by law — not optional

### Secondary: Small Law Offices (1-3 lawyers)

- 5,600+ lawyers, 70-80% in practices of 1-5 people
- Already pay for tools (higher willingness to pay)
- This is Lexomat's home turf — can cross-sell

### NOT the beachhead (defer these):

| Persona | Why not first |
|---|---|
| Teachers | Lowest pay, no budget, near-zero willingness to pay |
| Students | Use free tools, will not pay |
| Retirees | Fixed income, need family to pay for them |
| Government clerks | Public procurement, EU-funded, slow |
| Doctors | Regulated, reimbursement-constrained |

---

## The MVP: One Feature Done Exceptionally Well

### What every successful product teaches us

| Product | What they started with | NOT what they started with |
|---|---|---|
| Notion | Notes only | Full workspace |
| Canva | Yearbook design tool (Fusion Books) | Full design platform |
| Superhuman | Fast email for power users | Full communication suite |
| Linear | Issue tracking for developers | Full project management |

**The pattern:** Start with one thing done 10x better than alternatives. The platform comes after 1,000 happy users.

### Dzino MVP = "Upload a document, ask anything, in Slovak"

**Core feature:** User uploads a document (PDF, photo, scan of a contract, invoice, government letter, insurance policy). Types a question in casual Slovak. Gets a clear, structured answer in native Slovak within seconds.

**Why this is the "wow" moment:**
- Everyone has documents they don't fully understand
- The alternative is paying a lawyer (EUR 50-150/hour) or asking a friend
- Works immediately — no setup, no learning, no AI jargon
- Deeply personal (their own document, their own question)
- Slovak language quality is a real differentiator vs ChatGPT (which often responds in English or awkward Slovak)

**Secondary feature:** "Napiste to za mna" (Write it for me) — user describes what they need in casual Slovak, AI produces a properly formatted formal letter/email/complaint. Copy-paste-send.

**That's it. Nothing else at launch.**

No workspace. No notes. No project management. No image generation. No integrations. No multi-person chat. No computer use. Those come in Phase 2+.

### What NOT to build in MVP

- File storage / Google Drive clone (too complex, too competitive)
- Email integration (requires OAuth approvals, high liability)
- Document editor (TipTap integration is 3-5 months alone)
- Group chat (needs real-time infrastructure)
- Computer use (APIs at 40% reliability — not ready)

---

## Design: How It Should Look and Feel

### Core Principles

1. **Never mention "AI"** — Use "Pomoc s dokumentom" (Help with document), "Analyza" (Analysis), "Odporucania" (Recommendations)
2. **Buttons first, chat second** — Non-technical users struggle with blank text inputs. Offer pre-built actions as big buttons, with optional free-text input styled as a search bar
3. **Vykanie** (formal "Vy") — Matches banking/legal conventions Slovaks expect. Builds trust.
4. **Light mode default** — Better for cognitive tasks, especially older users. Dark mode as option.
5. **Familiar patterns** — Borrow from Alza.sk (accordion details), Tatra banka (bottom nav, chatbot), WhatsApp (message bubbles)

### The Main Screen

```
┌─────────────────────────────────────────────┐
│  [Logo] Dzino              [Nastavenia] [?] │
├─────────────────────────────────────────────┤
│                                             │
│     ┌───────────────────────────────┐       │
│     │                               │       │
│     │   Nahrajte dokument           │       │
│     │   (pretiahnite sem alebo      │       │
│     │    kliknite pre vyber)        │       │
│     │                               │       │
│     │   [PDF] [Foto] [Sken]        │       │
│     └───────────────────────────────┘       │
│                                             │
│  ── alebo skuste s ukazkovym dokumentom ──  │
│                                             │
│  [Zmluva o prenajme]  [Poistna zmluva]      │
│  [Faktura]            [Uradny list]         │
│                                             │
├─────────────────────────────────────────────┤
│  Posledne dokumenty                         │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │ doc1 │ │ doc2 │ │ doc3 │                │
│  └──────┘ └──────┘ └──────┘                │
└─────────────────────────────────────────────┘
```

### After Upload — Document Actions (Buttons, NOT Chat)

```
┌─────────────────────────────────────────────┐
│  ← Spat    Zmluva_o_prenajme.pdf            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │  Zhrnout     │  │  Klucove    │          │
│  │  dokument    │  │  body       │          │
│  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐          │
│  │  Vysvetlit   │  │  Najst      │          │
│  │  jednoducho  │  │  rizika     │          │
│  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐          │
│  │  Napisat     │  │  Porovnat   │          │
│  │  odpoved     │  │  s predpisom│          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ─── Alebo sa opytajte vlastnu otazku ───   │
│  ┌─────────────────────────────────────┐    │
│  │ Napr.: Mozem zmluvu vypovediet?     │    │
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│  [Dokument]  [Otazky]  [Historia]           │
└─────────────────────────────────────────────┘
```

### UI Specifications

| Element | Spec |
|---|---|
| Touch targets | 44x44px minimum (WCAG 2.5.5) |
| Body text | 16px minimum, sans-serif |
| Line height | 1.5x font size |
| Error messages | Under 8 words, plain Slovak, clear next action |
| Colors | Blue/purple for trust (like Tatra banka), semantic CSS variables |
| Address form | Vykanie throughout |
| Default theme | Light mode |
| Layout | Responsive, mobile-first build, desktop-optimized reading |

### Terminology Map

| Never say | Say instead |
|---|---|
| Upload file | **Nahrat subor** |
| AI / LLM / Model | **(nothing — never mention it)** |
| Query / Prompt | **Opytajte sa** (Ask a question) |
| Generate summary | **Zhrnut** (Summarize) |
| AI-assisted analysis | **Pomoc s textom** (Help with text) |
| Dashboard | **Prehlad** (Overview) |
| Error occurred | **Nieco sa nepodarilo** (Something didn't work out) |
| Submit | **Odoslat** (Send) |
| Settings | **Nastavenia** |
| Download | **Stiahnut** |

---

## Pricing: Hybrid Model (Free + Credits + Subscription)

### Why this structure

- Less than 30% of Slovaks want subscriptions (PwC CEE 2024)
- 52% pay cash on delivery — deep distrust of recurring digital payments
- Median salary EUR 950/month — EUR 20/month (ChatGPT price) = 2.1% of income (too expensive)
- A EUR 20 subscription in Slovak purchasing power feels like $84/month to an American

### Pricing tiers

| Tier | Price | What you get | Target |
|---|---|---|---|
| **Zadarmo (Free)** | EUR 0 | 20 questions/month, 5 document uploads | Growth engine — must be genuinely useful |
| **Kredity (Credits)** | EUR 3 / 50 credits | 1 credit per question, 2 per upload. No expiry. | Occasional users who hate subscriptions |
| **Mesacny plan** | EUR 4.99/month | 200 questions, 50 uploads, priority speed | Regular users, small businesses |
| **Rocny plan** | EUR 39.99/year | Same as monthly, 33% discount | Committed users |

### Pricing rules

- EUR 4.99 stays under the psychological EUR 5 barrier
- Credits never expire — removes "wasted subscription" fear
- No credit card required for free tier
- Always in EUR, never USD
- Pricing visible on landing page — Slovaks bounce if costs are hidden
- Consider pay-per-document (EUR 0.50-1.00) as entry point

---

## Promotion Strategy

### Channel priorities

| Channel | Priority | Why | Cost |
|---|---|---|---|
| **Facebook groups** | #1 | Slovaks are extremely active in niche FB groups (accounting, small business, legal). Organic seeding. | Free |
| **Facebook ads** | #1 | 3.5M+ Slovak users, dominant for 30-60 age group | EUR 5-15 CPM |
| **YouTube demos** | #2 | 30-second screen recordings showing the wow moment | EUR 200-500/creator |
| **Word of mouth** | #2 | Small market = everyone knows everyone. "Pozvite priatela" with free credits | Free |
| **Local media** | #3 | Startitup.sk, Refresher, Zive.sk will cover a local AI product | Free (PR) |
| **Partnerships** | #4 | Accounting firms, Pohoda/Money S3 user communities | Revenue share |

### Landing page structure

1. **Hero:** One-sentence benefit + 15-second demo video showing document upload → question → answer
   - "Porozumejte kazdej zmluve za 30 sekund" (Understand any contract in 30 seconds)
2. **Try it now:** Upload a document and ask ONE question free, WITHOUT signing up (zero friction)
3. **Three use cases with icons:** Zmluvy (Contracts), Uradne listy (Official letters), Faktury (Invoices)
4. **Social proof:** "Uz 500 Slovakov pouziva Dzino"
5. **Pricing:** Simple, transparent, in EUR
6. **FAQ:** "Je to bezpecne?" (Is it safe?), "Kto vidi moje dokumenty?" (Who sees my documents?), "Musim platit?" (Do I have to pay?)

### Language rules for marketing

- **Never say "AI"** on the landing page or in ads
- Frame as outcomes: "Porozumejte kazdej zmluve za 30 sekund"
- Use analogies: "Ako keby ste mali osobneho poradcu, ktory precita vsetko za vas" (Like having a personal advisor who reads everything for you)
- Benefits, not features. Never "powered by Claude." Instead: "Odpovie vam okamzite v slovencine"

---

## Competitive Moat

### What WON'T protect you

- The AI itself (commodity API — anyone can wrap Claude/GPT)
- Features (big tech will always have more)
- Price (Google can offer this for free)

### What WILL protect you

1. **Slovak language quality** — Careful prompt engineering for native-sounding Slovak (not the Slovenian/Czech confusion that ChatGPT produces)
2. **Slovak regulatory context** — Understanding eKasa, e-invoicing, Slovak contract law, uradny jazyk
3. **Trust relationship** — Being the first tool non-technical Slovaks rely on for document understanding
4. **Distribution** — Facebook groups, word of mouth in a small market where everyone knows everyone
5. **Data flywheel** — Understanding which documents Slovaks upload, what questions they ask, which answers they find useful

---

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| ChatGPT adds better Slovak support | High | Differentiate on document UX + regulatory context, not raw AI |
| Jasper-style collapse (90% of AI wrappers fail in 18 months) | High | Build domain expertise, not a generic wrapper |
| Low willingness to pay | Medium | Generous free tier + credits model |
| AI hallucinations on legal/financial docs | High | Always show source passages, never present AI as authoritative |
| Regulatory (EU AI Act transparency) | Low | Disclose AI usage in ToS, label outputs — deadline Aug 2026 |

---

## Success Metrics

### Week 1 target
- 100 document uploads
- 50% of uploaders ask at least one question
- 20% return within 7 days

### Month 1 target
- 500 registered users
- 5% conversion from free to paid (credits or subscription)
- Net Promoter Score > 40

### PMF signal (Superhuman test)
- Survey: "How would you feel if you could no longer use Dzino?"
- Target: >40% answer "very disappointed"

---

## Phase Roadmap

| Phase | Timeline | What | Revenue target |
|---|---|---|---|
| **1. Document Q&A** | Months 1-3 | Upload + ask + formal letter writing | Validate PMF |
| **2. File management** | Months 4-6 | Google Drive-like storage + AI over all files | First paying users |
| **3. Email integration** | Months 7-9 | Gmail/Outlook + AI email management | Recurring revenue |
| **4. Group chat** | Months 10-12 | WhatsApp-like chat with AI + invite others | Team pricing |
| **5. Computer use** | Months 12+ | Browser automation (when APIs mature) | Enterprise |

---

## Sources

### Market & Personas
- [Eurostat: 32.7% of EU used generative AI (2025)](https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20251216-3)
- [Slovakia 2024 Digital Decade Country Report](https://digital-strategy.ec.europa.eu/en/factpages/slovakia-2024-digital-decade-country-report)
- [IMF: AI Exposure in Slovakia's Labor Market](https://www.elibrary.imf.org/view/journals/002/2025/073/article-A003-en.xml)
- [Slovakia e-Invoicing 2027 Mandate (EDICOM)](https://edicomgroup.com/blog/slovakia-continues-to-advance-its-einvoicing-project)
- [Slovakia eKasa Mandate 2026 (VATupdate)](https://www.vatupdate.com/2025/12/25/slovakia-mandates-ekasa-only-cash-registers-and-qr-receipts-from-january-2026/)
- [5naj.sk: Slovak Invoicing Software Comparison](https://www.5naj.sk/porovnanie-fakturacnych-softverov/)
- [PwC Voice of Consumer Survey 2024 - CEE](https://cee.pwc.com/voice-of-the-consumer-survey-2024.html)

### MVP Strategy
- [Notion's PMF Journey (Unusual Ventures)](https://www.unusual.vc/notion-product-market-fit/)
- [Canva's Path to PMF (First Round)](https://review.firstround.com/canvas-path-to-product-market-fit-2/)
- [Superhuman's PMF Framework (First Round)](https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit/)
- [Linear: Rethinking the Startup MVP](https://linear.app/now/rethinking-the-startup-mvp-building-a-competitive-product)
- [AI Wrapper Problem (Medium)](https://medium.com/@Binoykumarbalan/the-ai-wrapper-problem-why-80-of-ai-startups-will-disappear-by-2026-6b4a873b0ad3)
- [a16z State of Consumer AI 2025](https://a16z.com/state-of-consumer-ai-2025-product-hits-misses-and-whats-next/)

### Design & UX
- [NN/g: Overcoming AI Articulation Barrier](https://www.nngroup.com/articles/ai-articulation-barrier/)
- [NN/g: Designing Use-Case Prompt Suggestions](https://www.nngroup.com/articles/designing-use-case-prompt-suggestions/)
- [Smashing Magazine: Design Patterns for AI Interfaces](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/)
- [GOV.UK Design Principles](https://www.gov.uk/guidance/government-design-principles)
- [Perplexity UX Interview (NN/g)](https://www.nngroup.com/articles/perplexity-henry-modisett/)

### Pricing
- [AI Pricing Playbook (Bessemer)](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook)
- [Payments in Slovakia (Stripe)](https://stripe.com/resources/more/payments-in-slovakia)
- [Subscription Fatigue Statistics 2026 (Adapty)](https://adapty.io/blog/9-subscription-trends-dominating-2025/)
