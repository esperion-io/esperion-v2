# Esperion Demo Execution Plan — V1

**Date:** 2026-03-10
**Parent docs:** `demo-portfolio-build-plan-v2.md` (architecture + spec), `business-plan-v7.md` (strategy)
**Goal:** Ship two live, pressure-tested demo chat experiences (Mike's Plumbing + Bayview Realty) embedded on real Esperion sites.

---

# Problem Decomposition

## What exists
- 4 landing sites (HTML, live on Vercel)
- Repo structure scaffolded (`demo/agents/`, `demo/widget/`, `demo/infra/`) — all empty
- Architecture locked: Dedicated VPS → OpenClaw Gateway → Kimi K2.5 via OpenRouter
- Widget spec: embedded web chat, 10-message cap, Calendly CTA

## What needs to be built
1. **Agent personas** — SOUL.md files that make each demo agent believable
2. **VPS infrastructure** — server, OpenClaw, Caddy, SSL, systemd
3. **Chat widget** — lightweight JS/CSS that embeds on sites and talks to VPS
4. **OpenClaw config** — multi-agent config for the VPS instance
5. **Site integration** — widget script tags in existing landing pages
6. **Pressure testing** — break it until it's solid

## Critical path (what blocks what)
```
Agent Personas ──────────────────────────────────────────────────┐
                                                                  ├→ Deploy agents to VPS ──→ End-to-end test ──→ Pressure test
VPS Provision (Anthony) → VPS Setup (Ace) → OpenClaw install ────┘            ↑
                                                                              │
Chat Widget (build + local test) ─────────────→ Deploy widget to VPS ─────────┘
                                                              ↑
OpenClaw Config (write) ──────────────────────→ Deploy to VPS ┘
                                                              ↑
DNS Subdomain (Anthony) ──────────────────────→ Caddy SSL ────┘
```

## Parallelizable work (no Anthony dependency)
- Agent persona SOUL.md files
- OpenClaw VPS config (`openclaw.json`)
- Caddyfile + systemd service + setup script
- Chat widget design + build + local testing

## Blocked on Anthony
- VPS provisioning (account + payment)
- SSH access handoff
- DNS subdomain → VPS IP
- OpenRouter API key confirmation
- Persona review + approval
- Final QA

---

# Milestones

## M0 — Prep Work (No blockers — Ace starts immediately)
**Target:** Complete within 24 hours
**Deliverables:**
- [ ] Mike's Plumbing `SOUL.md` — complete agent persona
- [ ] Bayview Realty `SOUL.md` — complete agent persona
- [ ] `demo/infra/openclaw.json` — VPS OpenClaw config (multi-agent, Kimi K2.5, 10-msg cap)
- [ ] `demo/infra/Caddyfile` — reverse proxy config (placeholder domain)
- [ ] `demo/infra/openclaw-demo.service` — systemd unit file
- [ ] `demo/infra/setup.sh` — automated VPS bootstrap script
- [ ] `demo/infra/README.md` — setup instructions
- [ ] Chat widget architecture doc (how it connects, message flow, state management)

**Success criteria:** All config files committed to repo. Personas ready for Anthony's review. Widget architecture locked.

---

## M1 — Chat Widget Build (No blockers — parallel with M0)
**Target:** 2-4 hours after M0 starts
**Deliverables:**
- [ ] `demo/widget/esperion-chat.js` — core widget script
- [ ] `demo/widget/esperion-chat.css` — widget styles
- [ ] `demo/widget/README.md` — embed instructions
- [ ] Local test page (widget works against mock/local endpoint)

**Widget spec:**
- Floating chat bubble (bottom-right, configurable position)
- Opens chat panel with agent-branded header
- Configurable via `data-*` attributes: agent ID, theme/colors, Calendly URL
- Message counter tracks session (localStorage for persistence)
- Messages 1-8: normal flow
- Message 9: agent wraps up naturally (handled in agent persona, not widget)
- Message 10: final response + Calendly CTA rendered by widget
- Messages 11+: widget blocks input, shows Calendly-only view
- Mobile responsive (full-screen on mobile)
- Connects to VPS via HTTPS REST or WebSocket
- Lightweight — no framework dependencies, vanilla JS
- Accessible (keyboard nav, ARIA labels, screen reader friendly)

**Success criteria:** Widget renders correctly in local browser, handles message flow including cap + CTA, styled to match Esperion brand. Ready to point at live VPS.

**Delegation decision:** Widget build is a bounded coding task with clear spec — candidate for Claude Code delegation. Single phase, testable output.

---

## M2 — VPS Provisioning (BLOCKED: Anthony)
**Target:** Same day Anthony provides access
**Anthony's checklist:**
- [ ] Create DigitalOcean account
- [ ] Provision droplet: Ubuntu 24.04, Sydney (SYD1) region, Basic $6/month (1 vCPU, 1GB RAM)
- [ ] Add SSH key during provisioning
- [ ] Share with Ace: server IP, SSH credentials
- [ ] Point DNS: `demo.aitools.co.nz` A record → VPS IP (or alternate subdomain)
- [ ] Confirm: reuse existing OpenRouter API key or provide separate one for demos

**Ace's work (once access received):**
- [ ] SSH in, run `setup.sh` (server hardening, Node.js, OpenClaw, Caddy, systemd)
- [ ] Deploy `openclaw.json` + agent `SOUL.md` files
- [ ] Verify `openclaw doctor` passes
- [ ] Verify Caddy auto-provisions SSL cert
- [ ] Test: `curl https://demo.aitools.co.nz/health` returns 200

**Success criteria:** OpenClaw running on VPS, HTTPS working, agents responding to API calls.

---

## M3 — Integration + Deployment
**Target:** 1-2 hours after M2 completes
**Depends on:** M1 (widget built) + M2 (VPS live)
**Deliverables:**
- [ ] Deploy widget files to VPS (`/var/www/widget/`)
- [ ] Widget served from `https://demo.aitools.co.nz/widget/esperion-chat.js`
- [ ] Embed widget in `sites/aifortrades/index.html` (agent=mike)
- [ ] Embed widget in `sites/aiforrealestate/index.html` (agent=bayview)
- [ ] Push to GitHub → Vercel auto-deploys sites
- [ ] End-to-end test: visit site → open chat → talk to agent → message cap fires → Calendly CTA appears

**Success criteria:** Both demos functional on live sites. Full chat flow works end-to-end.

---

## M4 — Pressure Testing
**Target:** 2-4 hours after M3
**Depends on:** M3 complete (demos live)
**Test categories:**

### Conversation quality
- [ ] Unclear/vague inputs ("I need help", "something's broken")
- [ ] Off-topic questions ("what's the weather?", "tell me a joke")
- [ ] Competitor questions ("why not just use ChatGPT?")
- [ ] Pricing/cost questions ("how much does this cost?")
- [ ] "How does this work for MY business?" questions
- [ ] Rude/adversarial inputs
- [ ] Non-English inputs

### Technical robustness
- [ ] Rapid-fire messages (spam 10 in 5 seconds)
- [ ] Empty messages
- [ ] Very long messages (1000+ chars)
- [ ] Message cap boundary (messages 9, 10, 11 behave correctly)
- [ ] Session persistence (close widget, reopen — history preserved?)
- [ ] Multiple tabs open simultaneously
- [ ] Network disconnect mid-conversation

### Cross-platform
- [ ] Desktop: Chrome, Firefox, Safari
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Tablet responsive behavior
- [ ] Widget doesn't break site layout/scrolling

### Mike's Plumbing specific
- [ ] Urgent vs routine job distinction
- [ ] Correct detail capture (location, issue type, timing)
- [ ] Appropriate booking/callback offers
- [ ] Stays in character as trade receptionist

### Bayview Realty specific
- [ ] Buyer vs seller vs renter intent qualification
- [ ] Property-related question handling
- [ ] Appraisal/viewing booking offers
- [ ] Stays in character as RE assistant

**Success criteria:** No demo-killing failures. Agent stays in character under pressure. Message cap + CTA works reliably. Widget renders correctly across browsers/devices.

---

## M5 — Anthony Review + Iteration
**Target:** 1 day after M4
**Deliverables:**
- [ ] Anthony tests both demos personally
- [ ] Feedback captured and triaged (critical vs nice-to-have)
- [ ] Critical fixes implemented
- [ ] Re-test after fixes

**Success criteria:** Anthony answers "Would we show this to a prospect tomorrow?" with yes.

---

## M6 — Wave 2 Expansion (After M5 sign-off)
**Target:** 1-2 days after M5
**Deliverables:**
- [ ] Pacific PM `SOUL.md` persona
- [ ] StudyMate NZ `SOUL.md` persona
- [ ] Add agents to VPS OpenClaw config
- [ ] Deploy + test
- [ ] Embed on respective sites (when ready)

---

# Execution Order (What Ace Does Now)

### Immediate (tonight / tomorrow morning)
1. **Write Mike's Plumbing SOUL.md** — grounded in V7 plan trades vertical data
2. **Write Bayview Realty SOUL.md** — grounded in V7 plan RE vertical data
3. **Write VPS OpenClaw config** — `openclaw.json` with multi-agent setup
4. **Write infra files** — Caddyfile, systemd service, setup.sh
5. **Design widget architecture** — connection protocol, state management, message flow

### Next (parallel / same day)
6. **Build chat widget** — delegate to Claude Code with tight spec from step 5
7. **Local test widget** — verify all states (normal chat, cap, CTA, mobile)

### Waiting on Anthony
8. **VPS provisioning** — Anthony creates server + shares SSH
9. **DNS** — Anthony points subdomain
10. **Deploy everything** — Ace configures VPS, deploys agents + widget
11. **Embed on sites** — Ace adds script tags, pushes to Vercel
12. **Pressure test** — Ace runs full test suite
13. **Anthony review** — final QA gate

---

# Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| VPS provisioning delayed | Blocks M2-M5 | M0+M1 are independent — Ace builds everything locally first. Zero wasted time. |
| OpenClaw doesn't support multi-agent on single instance cleanly | Blocks architecture | Verify in OpenClaw docs BEFORE assuming. Fallback: separate OpenClaw process per agent via systemd. |
| Kimi K2.5 quality too low for convincing demos | Demos feel cheap | Test persona quality early (M0). Fallback: bump to Sonnet 4 (higher cost but still cheap for demos). |
| Widget CORS issues with VPS | Widget can't connect | Caddy config handles CORS headers. Test early in M3. |
| 10-message cap feels abrupt | Bad UX, prospect annoyed | Message 9 is a soft wind-down (persona handles this). Message 10 is a natural close + CTA. Not a hard wall. |
| Demo agent goes off-script under adversarial input | Embarrassing in live demo | Strong system prompts + pressure testing in M4. Hard guardrails in persona. |

---

# Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| VPS isolated from Mac Mini | Protect Ace's performance, no shared resources | 2026-03-10 |
| DigitalOcean (not Hetzner) | Anthony's preference. Sydney region = closest to NZ. | 2026-03-10 |
| Kimi K2.5 as demo model | Cheapest viable model via OpenRouter, sufficient for demo quality | 2026-03-10 |
| Web chat first, voice later | Fastest to build, lowest complexity, sufficient for proof of concept | 2026-03-10 |
| 10-message cap | Limits cost exposure, creates natural Calendly funnel | 2026-03-10 |
| Vanilla JS widget (no framework) | Lightweight, no build step, embeds anywhere, fast to ship | 2026-03-10 |

---

# Estimated Timeline

| Milestone | Duration | Depends on | Status |
|-----------|----------|------------|--------|
| M0 — Prep work | 3-4 hrs | Nothing | 🔜 Starting now |
| M1 — Widget build | 2-4 hrs | Nothing (parallel with M0) | 🔜 Starting now |
| M2 — VPS provision + setup | 1-2 hrs | Anthony (VPS + SSH + DNS) | ⏳ Blocked |
| M3 — Integration | 1-2 hrs | M1 + M2 | ⏳ Waiting |
| M4 — Pressure testing | 2-4 hrs | M3 | ⏳ Waiting |
| M5 — Anthony review | 1 day | M4 | ⏳ Waiting |
| M6 — Wave 2 expansion | 1-2 days | M5 sign-off | ⏳ Future |

**Best case (Anthony provisions VPS today):** Demos live within 24-36 hours.
**Realistic case (VPS tomorrow):** Demos live within 48-72 hours.

---

# Open Questions for Anthony

1. ~~**VPS provider preference?**~~ *DECIDED: DigitalOcean, Sydney region.*
2. ~~**Subdomain?**~~ *DECIDED: `demo.aitools.co.nz` — live, resolving to 209.38.29.230*
3. **Calendly link?** Need the actual booking URL for the CTA. Or should we create one?
4. **OpenRouter API key:** Reuse your existing key or create a separate one for demos? (Separate = cleaner cost tracking)

---

*This plan is the execution layer. The spec is in `demo-portfolio-build-plan-v2.md`. The strategy is in `business-plan-v7.md`. All three stay in sync.*
