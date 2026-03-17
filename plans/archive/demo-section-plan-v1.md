# Esperion — Live Demo Section Plan (V1)

**Date:** 2026-03-10
**Status:** ✅ LOCKED — all decisions confirmed, ready for build
**Scope:** AI for Trades (`aifortrades`) + AI for Real Estate (`aiforrealestate`)

---

## Decisions (Locked 2026-03-10)

| # | Decision | Outcome |
|---|----------|---------|
| 1 | Message cap | **10 messages** per session |
| 2 | Hosting | **Vercel serverless** (free tier, zero-infra proxy) |
| 3 | CTA after cap | **Calendly booking link** (placeholder URL until live) |
| 4 | Placement | **Both** — embedded demo section + floating WhatsApp FAB |
| 5 | Heading copy | Ace writes — matches page tone + AI agency positioning |

**V1 Directive:** Prove OpenClaw-powered isolated sessions work in the site *before* building any custom UI. V1 is the proof of concept. V2 is the WhatsApp-exact polish.

---

## 1. What This Is

A live, interactive AI demo embedded directly into the Esperion landing pages. When a prospect visits the site, they can open a chat and talk to a working AI assistant — the same kind of assistant we'd build for their business.

**The demo is not about OpenClaw.** The prospect never sees "OpenClaw." They see an AI receptionist handling real enquiries in their industry. The message is: *"This is what your customers would experience if you hired us."*

---

## 2. Why This Matters for Sales

- **Trades:** Average tradie loses $15,048/month to missed calls. The demo lets them *feel* instant response.
- **Real Estate:** First response in <5 min = 10× conversion vs 30+ min. The demo proves sub-60-second response.
- **V7 Guardrail #3:** *"Before cold outreach, have the demo built."* This is that demo.

A prospect who has *used* the AI is 5–10× more likely to book a call than one who just read copy about it. The demo replaces the sales deck — it *is* the pitch.

---

## 3. Architecture

### 3.1 Core Principles

| Principle | Detail |
|-----------|--------|
| **OpenClaw-powered sessions** | Each visitor gets an isolated OpenClaw agent session via the Gateway's Chat Completions API. Full OpenClaw agent pipeline — not a raw API wrapper. |
| **Fully isolated** | Every visitor gets a unique session key (`demo:trades:<uuid>` or `demo:realestate:<uuid>`). Zero shared memory or context. Sessions are ephemeral. |
| **Message cap** | Hard limit of **10 messages per visitor per session**. After 10, the AI delivers a closing CTA and the chat locks. Controls cost and creates sales urgency. |
| **Model** | **Kimi K2.5** via OpenRouter (`moonshotai/kimi-k2.5`). Strong reasoning, very low cost (~$0.001–0.003 per conversation). |
| **WhatsApp-exact UI** (V2) | V1 uses a clean minimal UI to prove isolation works. V2 upgrades to pixel-accurate WhatsApp replica. |
| **No OpenClaw branding** | Prospect sees "Mike's Plumbing AI" or "Bayview Realty AI" — never "OpenClaw" or "Esperion." |

### 3.2 System Architecture

```
┌─────────────────────────────────────────────┐
│  Esperion Landing Page (static HTML)        │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Chat Widget (HTML/CSS/JS)            │  │
│  │  V1: Clean minimal chat bubbles       │  │
│  │  V2: WhatsApp-exact replica           │  │
│  │                                       │  │
│  │  • Generates unique session UUID      │  │
│  │  • Tracks message count client-side   │  │
│  │  • Locks at 10 messages               │  │
│  │  • Shows typing indicator             │  │
│  └───────────┬───────────────────────────┘  │
│              │                               │
└──────────────┼───────────────────────────────┘
               │ HTTPS POST /api/demo/chat
               ▼
┌─────────────────────────────────────────────┐
│  Vercel Edge Function (Proxy)               │
│                                             │
│  • Holds Gateway auth token (server-side)   │
│  • Rate limiting per IP                     │
│  • Server-side message cap enforcement      │
│  • Routes to OpenClaw Gateway               │
│  • Adds x-openclaw-agent-id: demo           │
│  • Adds x-openclaw-session-key: demo:<uuid> │
│  • Streams response back to client          │
└───────────────┬─────────────────────────────┘
                │ HTTPS (Tailscale Funnel)
                ▼
┌─────────────────────────────────────────────┐
│  OpenClaw Gateway (Mac Mini)                │
│                                             │
│  Agent: "demo"                              │
│  • Model: Kimi K2.5 via OpenRouter          │
│  • Tools: NONE (deny all)                   │
│  • Sandboxed, no workspace access           │
│  • System prompt per vertical               │
│  • Full session isolation per session key   │
│  • Chat Completions API endpoint            │
└─────────────────────────────────────────────┘
```

### 3.3 Why OpenClaw Instead of Raw API Proxy

Anthony's directive: *"For V1 I just want to see if we can have those isolated OpenClaws in the site."*

Using OpenClaw as the backend (vs a custom Node.js proxy to OpenRouter) gives us:

1. **Proper session management** — OpenClaw handles conversation history, context windows, session isolation natively
2. **Agent configuration** — system prompts, model routing, tool restrictions all managed in OpenClaw config
3. **Extensibility** — once proven, we can add tools to the demo agent (CRM lookups, booking APIs) without rebuilding the backend
4. **Monitoring** — all demo conversations flow through the Gateway, visible in logs and status
5. **Model flexibility** — swap Kimi for any model without code changes, just config
6. **Proof of product** — we're literally using our own product to sell our product

### 3.4 Session Isolation

Each demo session is **completely sandboxed**:

- **Unique session key** generated client-side (UUID v4), prefixed with `demo:<vertical>:`
- **OpenClaw Gateway maintains separate conversation history** per session key
- **No tools** — the demo agent has `tools: { deny: ["*"] }`, cannot read files, run commands, or access any system resources
- **No workspace** — demo agent has no workspace directory
- **No cross-session leakage** — each session key is independent in the Gateway
- **Session reset** — visitor can click "New conversation" to start fresh with a new UUID
- **No PII storage** — demo conversations are ephemeral

### 3.5 Message Cap & Cost Control

| Control | Detail |
|---------|--------|
| **Hard cap: 10 messages** | Both client-side (UI locks) and server-side (Vercel proxy rejects message 11+). |
| **Closing message** | After message 10, the AI sends: *"Thanks for trying [Business]'s AI assistant! Want this built for YOUR business? [Book a Free Demo →]"* |
| **Chat locks** | Input field disabled after cap. Only CTA button or "Start new conversation." |
| **Rate limiting** | Max 3 sessions per IP per hour (Vercel proxy enforced). |
| **Cost per conversation** | ~$0.001–0.003 NZD (Kimi K2.5). 1,000 conversations/month = ~$1–3 total. |
| **OpenRouter monthly cap** | $10 NZD hard limit. |

---

## 4. The Two Demos

### 4.1 AI for Trades — "Mike's Plumbing" Demo

**Character:** AI receptionist for Mike's Plumbing (Auckland residential plumber).
**Visitor role:** Homeowner with a plumbing problem.

**System prompt:**

```
You are the AI receptionist for Mike's Plumbing, a residential plumbing business 
in Auckland, New Zealand. You answer enquiries from homeowners.

Your job:
1. Greet warmly and ask what plumbing issue they're experiencing
2. Qualify the job: what's the problem, where in the house, how urgent
3. Confirm their suburb (you serve all of Auckland)
4. Capture their availability for a visit
5. Provide a rough indication ("most jobs like this are $X–$Y range")
6. Offer to book them in

Your personality:
- Friendly, professional, efficient — like a great office manager
- Use plain NZ English (not American)
- Keep responses concise (2–4 sentences max)
- Never use emojis excessively — one occasionally is fine

Business knowledge:
- Service area: All of Auckland
- Hours: Mon–Fri 7am–6pm, emergency after-hours available
- Common jobs: blocked drains ($180–350), hot water cylinder ($800–2500 installed), 
  leaking taps ($120–250), toilet repairs ($150–300), gas fitting (quote required)
- Response time: usually same-day or next-day for standard jobs
- Emergency: available 24/7 for burst pipes, gas leaks, flooding — $150 call-out fee

Rules:
- You are a DEMO. This is not a real business.
- If asked about this being real: "This is a live demo of the AI receptionist 
  that Esperion builds for trade businesses. Everything you're seeing is exactly 
  what your customers would experience."
- Never mention OpenClaw, Kimi, or any technical infrastructure.
- Stay on topic. If asked unrelated questions, redirect politely.
- Do not make up specific appointment times. Say "I'll check Mike's calendar and 
  get back to you with available slots."
```

**Opening message:** "👋 Hey! Thanks for messaging Mike's Plumbing. I'm Mike's AI assistant — I handle enquiries so Mike can stay on the tools. How can I help you today?"

### 4.2 AI for Real Estate — "Bayview Realty" Demo

**Character:** AI lead assistant for Bayview Realty (Auckland real estate agency).
**Visitor role:** Buyer or seller enquiring about property.

**System prompt:**

```
You are the AI assistant for Bayview Realty, a mid-size real estate agency in 
Auckland, New Zealand. You handle inbound enquiries from buyers and sellers.

Your job:
1. Greet professionally and ask how you can help
2. For BUYERS: ask what they're looking for (suburbs, bedrooms, budget range), 
   qualify their timeline, offer to arrange viewings
3. For SELLERS: ask about their property (suburb, type, bedrooms, situation), 
   offer a free market appraisal
4. Capture their contact preference and availability
5. Hand off to the right agent

Your personality:
- Professional, warm, knowledgeable about Auckland property
- Use NZ English and NZ property terminology ("flat" not "apartment", 
  "section" not "lot", "rates" not "property tax")
- Concise but thorough (3–5 sentences per response)
- Confident about market knowledge

Market knowledge (Auckland, 2025–2026):
- Median house price: ~$808,000 (REINZ)
- Market recovering: 80,655 transactions in 2025, up 10.3%
- Hot suburbs: Ponsonby, Grey Lynn, Mt Eden, Devonport (premium)
- Growth areas: Hobsonville, Long Bay, Flat Bush, Papakura (value)
- Average days on market: 35–45 days
- Typical commission: 2–3% + GST

Active listings (demo data):
- 14 Kauri St, Grey Lynn — 3-bed villa, $1.45M CV, open home Sat 1–1:45pm
- 8/22 Marina View, Hobsonville — 2-bed townhouse, offers over $780K
- 56 Ridge Rd, Mt Eden — 4-bed character home, auction 28 March
- 3 Ocean Parade, Devonport — 5-bed waterfront, price by negotiation

Rules:
- You are a DEMO. This is not a real agency.
- If asked: "This is a live demo of the AI assistant that Esperion builds for 
  real estate agencies. What you're seeing is exactly how your buyer and seller 
  enquiries would be handled."
- Never mention OpenClaw, Kimi, or any infrastructure.
- Stay on property topics. Redirect off-topic questions politely.
- Do not fabricate specific agent names beyond "one of our senior agents."
```

**Opening message:** "Hello! Welcome to Bayview Realty. I'm the team's AI assistant — I help with property enquiries, viewing bookings, and appraisal requests. Are you looking to buy, sell, or just exploring the Auckland market?"

---

## 5. Page Placement (V2)

### Embedded Demo Section

A full-width section between "How It Works" and "Pricing":

```
[Hero]
[Problem / Stats]
[Solution Features]
[How It Works]
─────────────────
[DEMO SECTION]
  Heading: "See It In Action — Right Now"
  Subtext: "This AI is handling enquiries for [Business Name].
            Message it like a real customer would."
  [Chat Widget — embedded]
─────────────────
[ROI Calculator]
[Pricing]
[FAQ]
[Final CTA]
```

### Floating WhatsApp FAB

Green WhatsApp-style button pinned bottom-right on every scroll position. Opens the same demo in a popup overlay.

**Both** — embedded section for the guided journey, floating button for the impatient.

---

## 6. Sales Funnel

```
Visitor lands on page
        │
Reads problem / solution / stats
        │
Sees demo section: "See It In Action"
        │
Opens chat, sends first message
        │
Has real conversation with AI
(qualification, pricing, booking)
        │
Hits 10-message cap
        │
AI delivers: "Want this for YOUR business?"
        │
CTA: "Book Your Free Demo — 15 Minutes"
        │
Prospect books Calendly call
(already convinced — they've USED the product)
```

---

## 7. Cost Projection

| Metric | Estimate |
|--------|----------|
| Cost per conversation | ~$0.001–0.003 NZD |
| 100 conversations/month | ~$0.10–0.30 NZD |
| 1,000 conversations/month | ~$1–3 NZD |
| 10,000 conversations/month | ~$10–30 NZD |
| **OpenRouter monthly hard cap** | **$10 NZD** |

Effectively free. Even at scale, negligible compared to a single converted lead ($2,000+ setup fee).

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Demo engagement rate (% visitors who open chat) | >15% |
| Demo completion rate (% who send 5+ messages) | >60% of openers |
| Demo → CTA click rate | >25% of completers |
| Demo → booked call rate | >10% of CTA clickers |
| Model cost per month | <$10 NZD |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI says something off-brand | Tight system prompt with guardrails. Demo-specific knowledge only. |
| Prospect asks "is this real?" | Honest disclosure built into system prompt. Builds trust. |
| Abuse / spam | Rate limiting (3 sessions/IP/hour), message cap, session ephemeral. |
| Cost spike | OpenRouter hard spend limit ($10). Kimi K2.5 makes this nearly impossible. |
| Gateway down | Mac Mini runs 24/7. Vercel proxy returns graceful "demo temporarily unavailable" on Gateway timeout. |
| Auth token exposure | Token held server-side in Vercel env var. Never in client-side JS. |
| Demo too good → prospect thinks they don't need us | Demo is intentionally scoped (10 messages, single-channel, no CRM). Full product = voice, CRM, nurture, multi-channel. |

---

## 10. Extensibility

Once trades + real estate demos work:
1. **AI for Business** — generic assistant demo
2. **AI for Students** — study assistant demo
3. **AI for Property Management** — tenant enquiry demo
4. **AI for Medical/Dental** — appointment booking demo

Each new demo = one new system prompt in the demo agent config. Infrastructure is shared.

---

*Plan locked 2026-03-10. See `demo-build-plan-v1.md` for the phased build plan.*
