# Esperion Demo Portfolio Build Plan — V3

**Date:** 2026-03-12
**Supersedes:** `archive/demo-portfolio-build-plan-v2.md`, `archive/demo-execution-plan-v1.md`
**Key change from V2:** Split-screen dashboard upgrade — customer chat + live business owner dashboard showing real-time lead/job analysis and ROI proof.

---

# 1. Architecture — Isolated VPS (Unchanged from V2)

```
┌─────────────────────────────────────────────────────┐
│  Ace's Mac Mini (UNTOUCHED)                         │
│  ┌───────────────────────────────────────────────┐  │
│  │ OpenClaw Gateway — Ace (main agent)           │  │
│  │ Model: Claude Opus 4.6                        │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

        ↕ ZERO CONNECTION — fully independent ↕

┌─────────────────────────────────────────────────────┐
│  Demo VPS (DigitalOcean — Sydney)                   │
│  IP: 209.38.29.230 | demo.aitools.co.nz            │
│  ┌───────────────────────────────────────────────┐  │
│  │ OpenClaw Gateway — Demo Agents                │  │
│  │ Model: Kimi K2.5 via OpenRouter               │  │
│  │ Agents: mike, bayview, pacific, studymate     │  │
│  └───────────────────────────────────────────────┘  │
│  Caddy reverse proxy → SSL auto-provisioned         │
└─────────────────────────────────────────────────────┘

        ↕ HTTPS / WSS ↕

┌─────────────────────────────────────────────────────┐
│  Esperion Sites (Vercel-hosted)                     │
│  • trade.aitools.co.nz → Mike's Plumbing demo        │
│  • realestate.aitools.co.nz → Bayview Realty demo      │
│  • (future) PM + Education sites                    │
│  Widget JS served from VPS (demo.aitools.co.nz)     │
└─────────────────────────────────────────────────────┘
```

**Cost:** ~$10 NZD/month (VPS $6-8 + model $1-3)

---

# 2. Project Structure

```
esperion/
├── plans/
│   ├── demo-portfolio-build-plan-v3.md  ← THIS FILE
│   ├── demo-execution-plan-v2.md        ← Milestone tracker
│   ├── business-plan-v7.md
│   └── archive/                         ← All previous versions
├── sites/                               ← Vercel-hosted landing pages
│   ├── aifortrades/index.html
│   ├── aiforrealestate/index.html
│   ├── aiforbusiness/index.html
│   └── aiforstudents/index.html
├── demo/
│   ├── widget/
│   │   ├── esperion-inline-chat.js      ← LIVE inline chat + dashboard widget
│   │   ├── SPEC.md                      ← Widget technical spec
│   │   ├── README.md
│   │   └── archive/                     ← Retired floating bubble widget
│   ├── agents/
│   │   ├── mike/
│   │   │   ├── SOUL.md                  ← Mike's persona + behaviour rules
│   │   │   └── knowledge-base.md        ← Rates, job pricing, service areas, solutions
│   │   ├── bayview/
│   │   │   ├── SOUL.md                  ← Bayview persona + behaviour rules
│   │   │   ├── knowledge-base.md        ← Fees, valuations, conjunction, team
│   │   │   └── listings.md              ← Active listings + recent sales
│   │   ├── pacific/                     ← Wave 2 (future)
│   │   └── studymate/                   ← Wave 2 (future)
│   └── infra/
│       ├── openclaw.json                ← VPS gateway config
│       ├── Caddyfile                    ← Reverse proxy config
│       ├── openclaw-demo.service        ← systemd service (user-level)
│       ├── setup.sh                     ← Automated VPS setup
│       └── README.md
└── docs/
```

---

# 3. What We Are Building

## Demo = Two Panels

Each demo is a **split-screen experience** embedded in the site page:

### Left Panel — "Customer View" (Chat)
What exists today. The visitor chats with the AI as if they were a customer of the demo business. The AI answers questions, gives pricing, qualifies the lead, and suggests next steps.

### Right Panel — "Business Dashboard" (NEW)
What the business owner would see on their end. Updates in **real time** as the conversation happens on the left. This is the ROI proof — it shows the prospect "here's what YOU get while the AI handles the customer."

The dashboard data is **live-extracted from the actual chat** — not pre-populated, not simulated. If the customer says "I've got a blocked drain in Browns Bay", the dashboard immediately shows the job classification, suburb, revenue estimate, and scheduling recommendation. The two panels must always be in sync.

---

# 4. Dashboard Specifications

## 4a. Trades Dashboard (Mike's Plumbing)

The right panel shows a **Job Intake Card** that populates progressively:

| Field | Source | Example |
|-------|--------|---------|
| **Customer Name** | Extracted from chat | "Sarah Mitchell" |
| **Phone** | Extracted from chat | "021 555 0192" |
| **Suburb** | Extracted from chat | "Browns Bay" |
| **Job Type** | AI classification | "Blocked Drain" |
| **Urgency** | AI assessment | 🟢 Standard / 🟡 Urgent / 🔴 Emergency |
| **Revenue Estimate** | From pricing guide | "$130–$260" |
| **Suggested Slot** | Based on urgency + availability | "Thu 14 Mar, AM" |
| **Assigned To** | Based on job type + area | "Josh (standard repairs)" |
| **Status** | Pipeline stage | New → Qualifying → Quoted → Booked |

**ROI Stats Bar** (bottom of dashboard, static/simulated):
- ⏱️ Avg intake: 2 min (vs 8 min phone)
- 📞 Jobs this week: 47
- 💰 Revenue captured: $18,400
- 🚫 After-hours calls saved: 12

**Key message to prospect:** "Your AI handles the intake, qualifies the job, estimates the price, and slots it into the schedule. You just show up and do the work."

## 4b. Real Estate Dashboard (Bayview Realty)

The right panel shows a **Lead Qualification Card** that populates progressively:

| Field | Source | Example |
|-------|--------|---------|
| **Lead Name** | Extracted from chat | "David Chen" |
| **Phone/Email** | Extracted from chat | "021 888 0234" |
| **Lead Type** | AI classification | 🏠 Buyer / 💰 Seller / 🔍 Browser |
| **Lead Score** | AI assessment | 🔥 Hot / 🟡 Warm / 🔵 Cold |
| **Budget** | Extracted (buyers) | "$1.2M–$1.5M" |
| **Target Suburbs** | Extracted (buyers) | "Takapuna, Milford" |
| **Requirements** | Extracted (buyers) | "3+ bed, close to schools" |
| **Property Details** | Extracted (sellers) | "4 bed villa, Devonport, 650m²" |
| **Estimated Value** | AI assessment (sellers) | "$1.9M–$2.2M" |
| **Matched Listings** | From listings.md | "2 properties match" (with addresses) |
| **Recommended Agent** | Based on suburb | "Sarah Chen (Takapuna specialist)" |
| **Status** | Pipeline stage | New → Qualifying → Qualified → Booked |

**ROI Stats Bar** (bottom, static/simulated):
- ⏱️ Avg qualification: 3 min (vs 15 min phone)
- 📊 Leads this week: 23
- 🔥 Hot leads: 8 (35%)
- 📅 Appraisals booked: 5

**Key message to prospect:** "Every enquiry is qualified, scored, and matched to the right agent — before you even pick up the phone."

---

# 5. Technical Implementation — Live Metadata Extraction

## How the Dashboard Gets Its Data

The AI agent includes a **hidden metadata JSON block** at the end of each response. The widget strips this before displaying the message text, and parses the JSON to update the dashboard panel in real time.

### Metadata Format

```html
<!-- DASHBOARD_DATA: {"customer":{"name":"Sarah Mitchell","phone":"021 555 0192"},"job":{"type":"Blocked Drain","urgency":"standard","suburb":"Browns Bay","revenueEstimate":"$130–$260","suggestedSlot":"Thu 14 Mar, AM","assignedTo":"Josh"},"status":"qualifying"} -->
```

### How It Works
1. Customer sends message → AI processes and responds
2. AI response includes visible text + hidden `<!-- DASHBOARD_DATA: {...} -->` comment
3. Widget receives the full response via WebSocket stream
4. Widget strips the `<!-- DASHBOARD_DATA: ... -->` block from displayed text
5. Widget parses the JSON and updates the dashboard panel fields
6. Dashboard fields animate in (fade/slide) as they populate
7. Fields persist across messages — each update merges with previous data (new fields add, existing fields update, nothing disappears)

### SOUL.md Integration
Both agent SOUL.md files get new instructions:
- After every response, append a `<!-- DASHBOARD_DATA: {...} -->` block
- Include all fields known so far (cumulative — merge with previous)
- Use null for unknown fields (dashboard shows placeholder/skeleton)
- The metadata block MUST be valid JSON
- The metadata block is NEVER shown to the customer

### Metadata Schemas

**Trades (Mike's Plumbing):**
```json
{
  "customer": { "name": null, "phone": null, "suburb": null },
  "job": {
    "type": null,
    "urgency": "unknown",
    "description": null,
    "revenueEstimate": null,
    "suggestedSlot": null,
    "assignedTo": null
  },
  "status": "new"
}
```

**Real Estate (Bayview Realty):**
```json
{
  "lead": { "name": null, "phone": null, "email": null },
  "type": "unknown",
  "score": "unknown",
  "buyer": {
    "budget": null,
    "suburbs": [],
    "beds": null,
    "propertyType": null,
    "timeline": null
  },
  "seller": {
    "address": null,
    "propertyType": null,
    "beds": null,
    "estimatedValue": null,
    "timeline": null
  },
  "matchedListings": [],
  "recommendedAgent": null,
  "status": "new"
}
```

---

# 6. Widget Upgrade — Split-Screen Layout

## Current State
- `esperion-inline-chat.js` — single panel inline chat
- Embedded in a `<div id="demo-chat">` on each site page

## Target State
- Same `esperion-inline-chat.js` — upgraded to two-panel layout
- Left panel: chat (existing, restyled to fit)
- Right panel: dashboard (new, vertical-specific)
- Dashboard type determined by `data-agent` attribute (mike → trades dashboard, bayview → realestate dashboard)
- Responsive: on mobile, dashboard collapses below the chat (stacked) or into a toggle tab

## Layout Spec

### Desktop (>768px)
```
┌──────────────────────────────────────────────────────────────┐
│ Header: [Avatar] Agent Name — "AI Demo — Powered by Esperion" [↻] │
├─────────────────────────┬────────────────────────────────────┤
│                         │                                    │
│    💬 Customer Chat     │    📊 Business Dashboard           │
│                         │                                    │
│  [message bubbles]      │  [Job Card / Lead Card]            │
│  [typing indicator]     │  [fields populate live]            │
│                         │  [status pipeline]                 │
│                         │                                    │
│  [input] [send]         │  [ROI stats bar]                   │
│                         │                                    │
├─────────────────────────┴────────────────────────────────────┤
│ Hint text / Message count                                    │
└──────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────┐
│ Header + tab toggle      │
│ [💬 Chat] [📊 Dashboard] │
├──────────────────────────┤
│                          │
│  Active tab content      │
│                          │
│  [input if chat tab]     │
│                          │
└──────────────────────────┘
```

## Sizing
- Desktop: max-width 820px (was 420px), height 520px (unchanged)
- Left panel: ~45% width
- Right panel: ~55% width
- Mobile: full width, tabbed

---

# 7. Site Page Updates

Both `aifortrades/index.html` and `aiforrealestate/index.html` need:
1. Update the "Try It Live" section heading/copy to reference the split view
2. Widen the demo container to accommodate the two-panel layout
3. Add explanatory text: "Left: what your customer sees. Right: what you see."
4. Ensure the demo section is responsive and doesn't break at any viewport

---

# 8. Build Order

## Completed (V1 + V2 work)
- ✅ VPS provisioned, hardened, OpenClaw installed (209.38.29.230)
- ✅ Caddy reverse proxy + SSL (demo.aitools.co.nz)
- ✅ Agent personas: Mike + Bayview with full knowledge bases
- ✅ Inline chat widget (esperion-inline-chat.js) — live on both sites
- ✅ Per-agent session routing (agent:<agentId>:demo:<id>)
- ✅ 30-min TTL auto-clear + clear button + unique session keys
- ✅ 90s response timeout + delta-cancellation fix
- ✅ Floating bubble widget archived

## Phase 1 — Dashboard Widget Build (Current Priority)
1. Update both SOUL.md files with metadata output instructions
2. Redesign `esperion-inline-chat.js` to two-panel layout
3. Build trades dashboard component (job intake card + ROI stats)
4. Build real estate dashboard component (lead card + ROI stats)
5. Add metadata parsing logic (strip from display, parse JSON, update dashboard)
6. Add progressive field animation (fields fade in as data arrives)
7. Mobile responsive (tab toggle for chat/dashboard)
8. Deploy widget to VPS
9. Update site pages (wider container, explanatory copy)
10. Deploy sites to Vercel

## Phase 2 — Pressure Testing
11. Test metadata extraction reliability (does Kimi K2.5 consistently output valid JSON?)
12. Test dashboard sync (do fields update correctly across multi-turn conversations?)
13. Edge cases: short messages, off-topic, adversarial input
14. Cross-browser + mobile testing
15. Anthony review + iteration

## Phase 3 — Wave 2 Expansion (After Phase 2 Sign-off)
16. Pacific Property Management agent + dashboard
17. StudyMate NZ agent + dashboard
18. Deploy to respective sites

## Phase 4 — Sales Packaging
19. "Try it now" entry points refined per vertical
20. Walkthrough recordings / GIFs
21. ROI proof blocks per vertical page
22. Objection handling content

---

# 9. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Kimi K2.5 doesn't reliably output valid JSON metadata | Dashboard shows stale/missing data | Strong SOUL.md instructions with exact format. Fallback: widget gracefully handles missing metadata (shows last known state). Secondary fallback: client-side heuristic extraction. |
| Two-panel layout breaks on some viewports | Bad UX on prospect's device | Mobile-first responsive design. Tab toggle on small screens. Test on real devices. |
| Metadata block leaks into visible chat text | Unprofessional, breaks illusion | Strict regex stripping before display. Multiple strip passes. Fallback: hide any message containing raw `DASHBOARD_DATA` marker. |
| Dashboard feels "too perfect" / obviously scripted | Prospect doesn't trust it's real | It IS real — live extraction from the actual chat. The data genuinely comes from the conversation. Imperfect/partial data is fine — it shows the system working, not a polished mockup. |
| Response time increases with metadata overhead | Slower chat experience | Metadata is small (~200 bytes). Kimi K2.5 token overhead is negligible. Monitor TTFT. |

---

# 10. Demo Agent Definitions (Updated)

## Mike's Plumbing (Trades)
- **Agent ID:** `mike`
- **Persona:** Friendly, efficient AI receptionist for a busy plumbing business
- **Knowledge base:** Rates ($95–$185/hr), 20+ job pricing breakdowns, service areas, scheduling, credentials, 8 common problem solutions
- **Dashboard type:** Job Intake Card
- **Must prove:** Captures job details, classifies urgency, estimates revenue, suggests scheduling — tradie just shows up
- **Config files:** `demo/agents/mike/SOUL.md`, `demo/agents/mike/knowledge-base.md`

## Bayview Realty (Real Estate)
- **Agent ID:** `bayview`
- **Persona:** Professional, knowledgeable real estate assistant for a boutique agency
- **Knowledge base:** 8 active listings, 5 recent sales, fee structure, suburb valuations, conjunction policy, team bios
- **Dashboard type:** Lead Qualification Card
- **Must prove:** Qualifies buyer/seller, scores lead, matches listings, recommends agent — principal gets a pre-qualified lead
- **Config files:** `demo/agents/bayview/SOUL.md`, `demo/agents/bayview/knowledge-base.md`, `demo/agents/bayview/listings.md`

---

# 11. Build Roles

## Anthony
- Product direction decisions
- Final QA on demo realism + dashboard accuracy
- Site copy review
- Go/no-go for prospect-facing use

## Ace
- Widget redesign (two-panel layout + dashboard)
- SOUL.md metadata instruction updates
- Dashboard UI components
- Site page updates
- VPS deployment
- Pressure testing
- All code in `demo/` and `sites/` directories

---

# 12. Success Criteria

## Phase 1 is done when:
- [ ] Both sites show split-screen: chat left, dashboard right
- [ ] Dashboard fields populate in real time from the live chat
- [ ] Trades dashboard shows: customer info, job type, urgency, revenue estimate, scheduling, assignment
- [ ] Real estate dashboard shows: lead info, type, score, requirements, matched listings, agent recommendation
- [ ] ROI stats bar visible on both dashboards
- [ ] Mobile responsive (tabbed on small screens)
- [ ] No metadata leaks into visible chat text
- [ ] Deployed to VPS + Vercel

## Phase 2 is done when:
- [ ] Anthony tests both demos and confirms "would show this to a prospect"
- [ ] 10+ conversation test scenarios per vertical without dashboard failures
- [ ] Cross-browser tested (Chrome, Safari, Firefox, mobile Safari, mobile Chrome)

---

**Bottom line:** The chat proves the AI can talk. The dashboard proves the AI can think. Together they prove the ROI — "your AI handles the customer AND gives you the intel. You just do your job."
