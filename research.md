# Dzino — Market Research & Feasibility Analysis

## Idea

A web app for non-technical Slovak users that wraps AI capabilities (Claude/LLM) behind a familiar, simple UI — like an e-shop or Google Drive. No technical jargon. Features: file storage, email, document editing, multi-person chat, and computer/browser automation — all AI-powered under the hood.

---

## Does the idea make sense? **Yes, with caveats.**

### The opportunity

| Factor | Finding |
|---|---|
| **Slovak internet users** | 5.05M (92.5% penetration) |
| **AI adoption** | Above 40% — Slovakia is surprisingly one of the EU leaders |
| **Digital skills** | Only 51% have basic skills (23rd of 27 EU states) — confirms the need for a simple UI |
| **Direct competition** | Zero. No one does "AI workspace for non-technical Slovak users" |
| **Unique pattern** | In Slovakia, lowest-income households are the highest AI users — opposite of most EU countries |

### Competitive landscape

**Big tech (indirect threat):**
- Microsoft 365 Copilot ($18-30/user/month) — AI in Word/Excel/Outlook, but complex and enterprise-focused
- Google Workspace + Gemini ($26-54) — AI in Docs/Gmail, but not simplified for non-tech users
- Apple Intelligence — on-device, free, but limited capabilities

**AI-native startups (partial overlap):**
- Notion AI ($20/month) — workspace + AI, but English-first, no email, no computer use
- Saner.AI — pulls notes/tasks/emails together, AI organizes automatically
- Manus AI — general agent, acquired by Meta for ~$2B

**None of them** combine file storage + email + docs + chat + computer use in one simple UI, and none target Slovak non-technical users.

### Feature feasibility ranking

| Feature | Complexity | Build time | Maturity |
|---|---|---|---|
| File storage + AI chat | Medium | 2-3 months | Ready |
| Document creation/editing | High | 3-5 months | Ready (TipTap + AI) |
| Multi-person chat with AI | Medium-High | 3-4 months | Ready |
| Email integration | High | 3-4 months | Ready but OAuth approval is slow |
| Computer/browser automation | Very High | 4-6 months | **Beta, ~40% reliability** |

### Cost per user

With smart model routing (Haiku for simple tasks, Sonnet for complex):

| Scenario | Monthly API cost/user |
|---|---|
| Light user (20 interactions/day) | $3-5 |
| Power user (50 interactions/day) | $7-12 |
| With prompt caching + routing | **$4-8** |

At a subscription price of EUR 15-20/month, this is viable but tight. Gemini Flash drops costs to $2-4/user.

### Key risks

1. **AI reliability for critical tasks** — an email sent to the wrong person or a deleted file destroys trust instantly. This is the #1 risk.
2. **Big tech competition** — Microsoft/Google will keep adding AI to their existing suites. You can't compete on features; you compete on simplicity and localization.
3. **Small market** — 5.4M people caps revenue. Slovak subscription reluctance (under 30% want subscriptions) means freemium is essential.
4. **Computer use is immature** — both Anthropic and OpenAI APIs are in beta with ~40% task success rates. Not ready for non-technical users.
5. **Slovak language quality** — LLMs confuse Slovak with Slovenian/Czech. Needs careful prompt engineering.

---

## Detailed Findings

### Slovak Digital Market

- 92.5% internet penetration (5.05M users out of 5.47M population)
- 6.20M mobile connections (113% of population)
- 82% access internet daily
- Median mobile download: 62.59 Mbps; fixed: 90.28 Mbps
- 54.3% urban, 45.7% rural; median age 42.3 years
- E-commerce turnover: EUR 1.84B (2024), growing 6% YoY
- 52% of shoppers still pay cash on delivery — signals residual distrust of digital payments
- Average gross monthly salary: EUR 1,586 (H1 2025)
- Less than 30% want subscription-based plans (vs. 41% in Poland, 47% in Ukraine)

### AI Adoption in Slovakia

- Above 40% of ages 16-74 used generative AI tools in 2025 (alongside Denmark, Estonia, Finland, Sweden)
- Explosive growth: ~13% (2023) → ~18% (2024) → 40%+ (2025)
- Unique: lowest-income households are the highest AI users (opposite of most EU countries)
- 43 mapped AI companies, 12,500 AI professionals, EUR 39M total AI startup funding in 2024

### Slovak Language AI Support

- Slovak is "medium-proficiency" tier in major LLMs
- Claude: closest Slavic benchmark unavailable; estimated 85-92% of English performance
- ChatGPT: frequently confuses Slovak with Slovenian, sometimes defaults to Czech
- KInIT (Kempelen Institute) won EUR 10.9M EU grant for Slovak language models (lorAI project)
- Practical: works but requires careful prompt engineering ("respond in Slovak, not Czech or Slovenian")

### Local Competition

| Company | What | Funding |
|---|---|---|
| Cequence (Presov) | AI contract lifecycle management | EUR 3M |
| CloudTalk (Bratislava) | AI-powered cloud calling | EUR 26M |
| Elv.ai (Bratislava) | AI content moderation | EUR 500K |
| Powerful Medical | AI cardiac diagnostics | EUR 7.5M |

**No direct competitor** offers a consumer-facing Slovak-language AI workspace.

### International Legal/AI Workspace Competitors

| Product | Relevance |
|---|---|
| Wolters Kluwer Libra | Launched in SK March 2026, legal AI workspace |
| Noxtua | EUR 80.7M raised, partners with C.H. Beck Slovakia |
| Legora | $5.55B valuation, in Czech Republic |
| AI Drive (myaidrive.com) | Cloud storage + AI chat over documents |

### Computer Use / Browser Automation State of Art

| Product | Company | Success Rate |
|---|---|---|
| Operator (in ChatGPT) | OpenAI | ~32.6% on complex tasks |
| Computer Use | Anthropic | ~26% on benchmark tasks |
| Project Mariner | Google | Gradually rolling out |
| Amazon Nova Act | Amazon | Claims 90%+ (AWS preview) |

Consumer-friendly options: Perplexity Comet browser, Google Dia, Opera Neon. All still early.

### API Pricing (March 2026)

| Model | Input/1M tokens | Output/1M tokens |
|---|---|---|
| Claude Haiku 4.5 | $1.00 | $5.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 |
| Claude Opus 4.6 | $5.00 | $25.00 |
| GPT-4.1 | $2.00 | $8.00 |
| Gemini 2.5 Flash | $0.30 | $2.50 |
| Gemini 2.5 Pro | $1.25 | $10.00 |

Key optimizations: prompt caching (40-60% input cost reduction), model routing (50-70% average cost reduction), batch API (50% discount for non-real-time).

### Business Model Comparisons

| Product | Price/user/month |
|---|---|
| Microsoft 365 Copilot | $18-30 |
| Google Workspace + Gemini | $26-54 |
| Notion AI | $20 |
| ChatGPT Plus | $20 |
| Claude Pro | $20 |

### Regulatory

- **EU AI Act**: Legal AI is NOT high-risk. Transparency disclosure required by Aug 2026 (must tell users they're talking to AI).
- **GDPR**: Standard compliance for email/file storage. Slovak Act No. 18/2018 mirrors EU regulation.
- **Penalties**: Up to EUR 35M or 7% turnover (AI Act); EUR 20M or 4% turnover (GDPR).

---

## Recommended MVP (8-10 weeks, $35-60K)

### Phase 1: File storage + AI chat + document editor

- Upload files (PDF, DOCX, images) → chat with them in Slovak
- Create/edit documents with AI assistance (rewrite, translate, summarize)
- Simple Google Drive-like UI
- No email, no computer use, no group chat yet

**Why:** Validates the core value prop ("AI that just works, in Slovak, for normal people") without the riskiest features. No third-party OAuth approvals needed.

### Suggested tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TipTap + Tailwind + Shadcn |
| Backend | FastAPI (Python) |
| AI | Claude Haiku 4.5 (simple) + Sonnet 4.6 (complex) with prompt caching |
| Storage | Supabase Storage or S3 |
| Database | Supabase (Postgres + pgvector) |
| Auth | Clerk or Supabase Auth |
| File parsing | unstructured.io or Apache Tika |

### Phase 2 (months 4-8)
- Email integration (Gmail first, then Outlook)
- Group chat with AI (WhatsApp-like)
- Mobile responsive / PWA

### Phase 3 (months 8-12+)
- Computer use / browser automation (once APIs mature)
- Enterprise features (SSO, audit logs, admin panel)
- Mobile native apps

---

## Bottom line

The idea is sound. The gap is real — non-technical Slovaks want AI but current tools are too complex or English-first. The risk is execution: you're building a multi-feature product in a small market with tight margins. **Start narrow** (files + docs + AI in Slovak), validate demand, then expand feature by feature.
