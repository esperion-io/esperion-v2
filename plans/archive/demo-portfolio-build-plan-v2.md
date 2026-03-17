# Esperion Demo Portfolio Build Plan — V2

**Date:** 2026-03-10
**Supersedes:** `archive/demo-section-plan-v1.md`, `archive/demo-build-plan-v1.md`
**Key change from V1:** Demo agents run on a dedicated VPS, completely isolated from Ace's Mac Mini. No shared resources.

---

# 1. Architecture Decision — Isolated VPS

## Why
Running demo agents on Ace's Mac Mini risks performance degradation to Ace if demos get hammered, and vice versa. Complete infrastructure separation eliminates this.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Ace's Mac Mini (UNTOUCHED)                         │
│  ┌───────────────────────────────────────────────┐  │
│  │ OpenClaw Gateway — Ace (main agent)           │  │
│  │ Model: Claude Opus 4.6                        │  │
│  │ Purpose: Business partner, all existing work  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

        ↕ ZERO CONNECTION — fully independent ↕

┌─────────────────────────────────────────────────────┐
│  Demo VPS (DigitalOcean — Sydney)                   │
│  ┌───────────────────────────────────────────────┐  │
│  │ OpenClaw Gateway — Demo Agents                │  │
│  │ Model: Kimi K2.5 via OpenRouter               │  │
│  │ Agents:                                       │  │
│  │   • mike — Mike's Plumbing (Trades)           │  │
│  │   • bayview — Bayview Realty (Real Estate)     │  │
│  │   • pacific — Pacific PM (Property Mgmt)      │  │
│  │   • studymate — StudyMate NZ (Education)      │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

        ↕ HTTPS (public IP + Caddy reverse proxy) ↕

┌─────────────────────────────────────────────────────┐
│  Esperion Sites (Vercel-hosted)                     │
│  • aifortrades.co.nz — embeds Mike's Plumbing demo │
│  • aiforrealestate.co.nz — embeds Bayview demo     │
│  • (future) PM + Education sites                    │
│                                                     │
│  Each site loads the chat widget which connects     │
│  directly to the Demo VPS via HTTPS                 │
└─────────────────────────────────────────────────────┘
```

## Cost Estimate
- VPS: ~$6-8 NZD/month (DigitalOcean $4 USD/month droplet, Sydney region)
- Model: ~$1-3 NZD/month at 1,000 demo conversations (Kimi K2.5 via OpenRouter)
- Vercel: Free tier (low traffic)
- **Total: Under $10 NZD/month**

---

# 2. Project Folder Structure

All demo code lives in `~/Projects/esperion/demo/` alongside the existing sites.

```
esperion/
├── CLAUDE.md                          ← Project context
├── README.md
├── plans/
│   ├── business-plan-v7.md            ← Current business plan
│   ├── demo-portfolio-build-plan-v2.md ← THIS FILE
│   └── archive/                       ← Previous plan versions
│       ├── demo-section-plan-v1.md
│       └── demo-build-plan-v1.md
├── sites/                             ← Vercel-hosted landing pages
│   ├── aifortrades/
│   │   └── index.html                 ← Includes widget script tag
│   ├── aiforrealestate/
│   │   └── index.html                 ← Includes widget script tag
│   ├── aiforbusiness/
│   │   └── index.html
│   └── aiforstudents/
│       └── index.html
├── demo/                              ← ALL DEMO CODE LIVES HERE
│   ├── widget/                        ← Chat widget (JS/CSS)
│   │   ├── esperion-chat.js           ← Main widget script
│   │   ├── esperion-chat.css          ← Widget styles
│   │   └── README.md                  ← Widget usage/embed docs
│   ├── agents/                        ← Agent personas (deployed to VPS)
│   │   ├── mike/
│   │   │   └── SOUL.md               ← Mike's Plumbing persona
│   │   ├── bayview/
│   │   │   └── SOUL.md               ← Bayview Realty persona
│   │   ├── pacific/
│   │   │   └── SOUL.md               ← Pacific PM persona
│   │   └── studymate/
│   │       └── SOUL.md               ← StudyMate NZ persona
│   └── infra/                         ← VPS infrastructure configs
│       ├── openclaw.json              ← OpenClaw config for VPS
│       ├── Caddyfile                  ← Caddy reverse proxy config
│       ├── openclaw-demo.service      ← systemd service file
│       ├── setup.sh                   ← Automated VPS setup script
│       └── README.md                  ← VPS setup instructions
└── docs/                              ← Specs, assets, brand guidelines
```

### How Code Gets to the Right Place

| Code | Lives in repo at | Deployed to | How |
|------|-----------------|-------------|-----|
| Chat widget | `demo/widget/` | Served from VPS via Caddy OR bundled inline in sites | Caddy serves static files from `/var/www/widget/` on VPS; OR widget JS is copied into each site's `index.html` as inline script |
| Agent personas | `demo/agents/*/SOUL.md` | VPS at `/home/openclaw/.openclaw/workspace/agents/` | SCP/rsync from repo to VPS during deploy |
| VPS OpenClaw config | `demo/infra/openclaw.json` | VPS at `/home/openclaw/.openclaw/openclaw.json` | SCP during setup |
| Caddy config | `demo/infra/Caddyfile` | VPS at `/etc/caddy/Caddyfile` | SCP during setup |
| systemd service | `demo/infra/openclaw-demo.service` | VPS at `/etc/systemd/system/` | SCP during setup |
| Site HTML | `sites/*/index.html` | Vercel | Git push → Vercel auto-deploy |

### Deployment Flow
```
1. Edit agent persona in demo/agents/mike/SOUL.md
2. Push to GitHub
3. SSH into VPS → pull latest → rsync agents to workspace
   (or: run deploy script that does this automatically)
4. OpenClaw picks up changes on next session

For widget changes:
1. Edit demo/widget/esperion-chat.js
2. Push to GitHub
3. If widget served from VPS: rsync to /var/www/widget/
   If widget inline in sites: rebuild site, Vercel auto-deploys
```

---

# 3. Build Objective

Build a demo portfolio that Esperion can use immediately in real prospect conversations.

## First success condition
Two live, convincing, pressure-testable demos used in outreach:
1. **Mike's Plumbing** (Trades)
2. **Bayview Realty** (Real Estate)

## Second success condition
After the first two are stable, extend into:
3. **Pacific Property Management**
4. **StudyMate NZ / AI for Students NZ**

## The rule
**Ship credibility first. Expand second. Polish third.**

---

# 4. What We Are Building

Four live demo products, each with:
- A real interaction channel (web chat embedded on the Esperion vertical site)
- A vertical-specific AI persona with domain knowledge
- A 10-message session cap with Calendly CTA after cap
- Enough robustness to survive live prospect testing

We are **not** building:
- A full production SaaS platform
- A CRM backend
- Voice/phone integration (in this pass)
- Every integration from day one

---

# 5. Build Strategy — Fastest Path

## Stage A — Provision and configure the Demo VPS
One server, one OpenClaw instance, all demo agents.

## Stage B — Build the two launch-critical demo agents
- Mike's Plumbing first
- Bayview Realty second

## Stage C — Build the web chat widget + embed it on sites

## Stage D — Pressure test those two until usable in live sales

## Stage E — Extend into Property Management and Education

---

# 6. Execution Principles

1. **Reuse aggressively** — One OpenClaw instance, shared config patterns, per-agent persona customization only
2. **Real channels beat fake UI** — Web chat on real sites, not mock interfaces
3. **Show both layers** — Front-end interaction AND operator/EA value behind the scenes
4. **"Good enough to sell" threshold** — Would we confidently show this to a prospect tomorrow?
5. **Cut anything that delays first usable demos**

---

# 7. VPS Setup — Detailed Steps

### Recommended Spec
- **Provider:** DigitalOcean
- **Plan:** Basic Droplet — 1 vCPU, 1GB RAM, 25GB SSD — $6 USD/month (or $4 USD/month for 512MB if available)
- **OS:** Ubuntu 24.04 LTS
- **Region:** Sydney (SYD1) — closest to NZ

### What Anthony Needs To Do (can't be done by Ace)

| # | Task | Why Ace can't do it |
|---|------|-------------------|
| 1 | Create DigitalOcean account | Requires payment method |
| 2 | Provision the server (select plan, region, Ubuntu 24.04, add SSH key) | Needs account access |
| 3 | Share SSH access with Ace (server IP + SSH key or password) | Ace needs remote access to configure |
| 4 | Point subdomain at VPS IP (e.g. `demo.aitools.co.nz` → VPS IP) | DNS is managed by Anthony |
| 5 | Confirm OpenRouter API key reuse (or provide a separate one for demos) | Security decision |
| 6 | Review + approve agent personas before go-live | Quality gate |

### What Ace Does (everything else)

Once Anthony provides SSH access, Ace handles all remaining setup:

#### Step 1 — Server Hardening (~5 min)
```bash
apt update && apt upgrade -y
adduser openclaw
usermod -aG sudo openclaw
# SSH hardening — disable root login, password auth
ufw allow 22/tcp
ufw allow 443/tcp
ufw allow 80/tcp
ufw enable
```

#### Step 2 — Install Node.js + OpenClaw (~5 min)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs
npm install -g openclaw
openclaw --version
```

#### Step 3 — Deploy OpenClaw Config (~15 min)
- SCP `demo/infra/openclaw.json` to VPS
- SCP `demo/agents/*/SOUL.md` to VPS workspace
- Set `OPENROUTER_API_KEY` env var
- Verify config with `openclaw doctor`

#### Step 4 — Set Up systemd Service (~5 min)
- SCP `demo/infra/openclaw-demo.service` to `/etc/systemd/system/`
- `systemctl enable openclaw-demo && systemctl start openclaw-demo`

#### Step 5 — SSL/HTTPS via Caddy (~10 min)
- Install Caddy
- SCP `demo/infra/Caddyfile` to `/etc/caddy/Caddyfile`
- Caddy auto-provisions Let's Encrypt SSL cert for `demo.aitools.co.nz`

#### Step 6 — Build Web Chat Widget (~2-4 hrs)
- Build `demo/widget/esperion-chat.js` — lightweight JS widget
- Embeds as chat bubble on Esperion sites
- Connects to VPS via HTTPS
- Tracks message count, shows Calendly CTA after 10 messages
- Configurable per-site (agent ID, branding via data attributes)
- Mobile responsive

#### Step 7 — Embed Widget on Sites (~30 min)
Add to each site's `index.html`:
```html
<script
  src="https://demo.aitools.co.nz/widget/esperion-chat.js"
  data-agent="mike"
  data-theme="trades"
></script>
```
- `aifortrades.co.nz` → `data-agent="mike"`
- `aiforrealestate.co.nz` → `data-agent="bayview"`

#### Step 8 — Pressure Test (~2-4 hrs)
- Unclear inputs, bad phrasing, off-topic questions
- "How much does this cost?" / "How does this work for my business?"
- Edge cases: rapid messages, empty messages, very long messages
- Message cap behavior — Calendly CTA appears cleanly?
- Mobile responsiveness
- Cross-browser testing

---

# 8. Build Order

## Wave 1 — Infrastructure + Flagship Demos (Target: 1-2 days after VPS access)
1. VPS setup + hardening + OpenClaw install
2. Mike's Plumbing agent persona + config
3. Bayview Realty agent persona + config
4. Web chat widget build
5. Deploy widget to both sites
6. Pressure test both demos

## Wave 2 — Expansion (After Wave 1 is stable)
7. Pacific Property Management agent
8. StudyMate NZ agent
9. Deploy to respective sites

## Wave 3 — Sales Packaging
10. "Try it now" entry points on each site
11. Short walkthrough recordings / GIFs
12. ROI/proof blocks per vertical
13. Objection handling support assets

---

# 9. Demo Agent Definitions

## Mike's Plumbing (Trades)
- **Agent ID:** `mike`
- **Persona:** Friendly, efficient receptionist for a busy plumbing business
- **Must prove:** Missed calls captured, urgent vs standard jobs distinguished, follow-up feels fast, owner gets useful summary
- **Workflow:** Greet → qualify job type → capture details (location, issue, urgency) → offer booking/callback → summarise for owner
- **Proof layer:** "One saved job per week pays for this" / revenue leakage framing
- **Config:** `demo/agents/mike/SOUL.md`

## Bayview Realty (Real Estate)
- **Agent ID:** `bayview`
- **Persona:** Professional, knowledgeable real estate assistant for a boutique agency
- **Must prove:** Instant response, buyer/seller intent qualification, next-step booking, principal-facing value
- **Workflow:** Greet → qualify intent (buying/selling/renting) → handle property questions → offer appraisal/viewing → summarise for principal
- **Proof layer:** Response speed → lead conversion / commission upside framing
- **Config:** `demo/agents/bayview/SOUL.md`

## Pacific Property Management (Wave 2)
- **Agent ID:** `pacific`
- **Persona:** Helpful, organised property management assistant
- **Must prove:** Rental + maintenance flows work, structured summaries, doesn't feel like generic chatbot
- **Workflow:** Identify enquiry type → handle rental FAQ/viewing booking OR maintenance intake → summarise + prioritise for manager
- **Config:** `demo/agents/pacific/SOUL.md`

## StudyMate NZ (Wave 2)
- **Agent ID:** `studymate`
- **Persona:** Smart, supportive study + career partner for NZ students
- **Must prove:** Handles both study and career requests, shows continuity, feels like personal assistant not narrow tool
- **Workflow:** Study help (notes, planning, exam prep) + career help (CV, interview prep, job planning) — seamless across both
- **Config:** `demo/agents/studymate/SOUL.md`

---

# 10. Message Cap + CTA Design

Each demo session:
1. **Messages 1-8:** Normal conversation
2. **Message 9:** AI naturally wraps up — "I can help with much more — want to see how this works for your business?"
3. **Message 10:** Final response + Calendly CTA — "To explore how [vertical] AI can work for your business, book a quick call with our team: [Calendly link]"
4. **Messages 11+:** Polite cap message — "This demo session has ended. Book a call to continue the conversation: [Calendly link]"

---

# 11. Minimum Viable Demo Thresholds

## Mike's Plumbing is usable when:
- Chat feels like talking to a real receptionist
- Job qualification mostly works
- Session cap + Calendly CTA fires cleanly
- No demo-killing failures under pressure testing

## Bayview Realty is usable when:
- Inbound response is immediate and credible
- Buyer/seller qualification works
- Next steps are offered clearly
- The demo supports real conversation about value to an agency

---

# 12. What To Cut (First Pass)

- Voice/phone integration (future)
- SMS follow-up (future)
- Operator dashboard (future — proof-of-concept via logs first)
- Full CRM integration
- Multiple channels per demo on day one
- Complex branding/UI beyond clean chat widget
- Analytics before demo quality exists

---

# 13. Build Roles

## Anthony
- Provision VPS + share SSH access
- Provide DNS subdomain
- Confirm OpenRouter API key usage
- Review + approve agent personas
- Final QA on demo realism
- Product direction decisions

## Ace
- VPS configuration + hardening
- OpenClaw install + agent setup
- Agent persona drafting
- Chat widget build + deployment
- Site integration
- Pressure testing + iteration
- All code in `demo/` directory

---

# 14. Immediate Next Actions

1. **Anthony:** Provision DigitalOcean droplet (Sydney, Ubuntu 24.04)
2. **Anthony:** Share SSH access with Ace (IP + SSH key)
3. **Anthony:** Point a subdomain (e.g. `demo.aitools.co.nz`) at VPS IP
4. **Ace:** Configure VPS, install OpenClaw, deploy agent configs
5. **Ace:** Build chat widget in `demo/widget/`
6. **Ace:** Embed widget on `aifortrades` + `aiforrealestate` sites
7. **Ace:** Pressure test both flagship demos
8. **Anthony:** Review demos, give feedback
9. **Iterate until "would we show this to a prospect tomorrow?" = yes**

---

**Bottom line:** Same strategy as V1 — build one engine, ship two flagship demos first, pressure test hard, then extend. The change is WHERE it runs (dedicated VPS, not Ace's Mac Mini) and WHERE the code lives (`demo/` directory in the esperion repo, deployed to VPS). Complete isolation, negligible cost (~$10/month), and the demos run on the same tech stack we're selling.
