# Esperion Demo Execution Plan — V2

**Date:** 2026-03-12
**Supersedes:** `archive/demo-execution-plan-v1.md`
**Parent doc:** `demo-portfolio-build-plan-v3.md`
**Goal:** Build the split-screen dashboard upgrade — live business owner view alongside the customer chat.

---

# Completed Work (V1 Milestones)

## M0 — Prep Work ✅
- Mike's Plumbing SOUL.md — written + deployed
- Bayview Realty SOUL.md — written + deployed
- Multi-agent OpenClaw config — written + deployed
- Caddy + systemd — written + deployed

## M1 — Widget Build ✅
- `esperion-inline-chat.js` — core inline widget built (vanilla JS, no deps)
- Floating bubble + mobile responsive + 10-message cap + Calendly CTA
- Floating bubble version archived (not in use)

## M2 — VPS Provisioning ✅
- DigitalOcean droplet: 209.38.29.230 (Sydney region)
- Ubuntu 24.04, Node.js 22, OpenClaw 2026.3.8
- Server hardened: firewall, SSH, 2GB swap
- Caddy reverse proxy + auto SSL
- `demo.aitools.co.nz` resolving

## M3 — Integration + Deployment ✅
- Widget deployed to VPS, served from demo.aitools.co.nz
- Embedded on trade.aitools.co.nz (agent=mike) + realestate.aitools.co.nz (agent=bayview)
- End-to-end working: site → chat → AI response → cap → CTA
- Trusted-proxy auth (no token in browser)

## M3.5 — Per-Agent Routing ✅ (was blocker)
- Session keys: agent:<agentId>:demo:<uuid>
- Each agent uses its own SOUL.md + workspace
- Bayview responds as real estate, Mike responds as plumber

## Bug Fixes ✅
- Response timeout: 30s → 90s (Kimi K2.5 cold start tolerance)
- Clear timeout on first streaming delta
- 30-min TTL auto-clear (matches server idle timeout)
- Unique session keys per conversation
- Clear chat button in header
- Floating bubble widget archived to avoid confusion
- Cache-Control headers on Caddy static files

## Knowledge Base Upgrade ✅
- Mike's Plumbing: rates, 20+ job pricing breakdowns, service areas, scheduling, credentials, 8 problem solutions
- Bayview Realty: 8 listings, 5 recent sales, fee structure, suburb valuations, conjunction policy, team bios
- Both agents now answer questions with real data instead of deflecting

---

# Current Priority: Dashboard Upgrade

## M4 — SOUL.md Metadata Instructions
**Goal:** Both agents output hidden structured data alongside their responses.

### Tasks
- [ ] Define JSON schemas for trades + real estate metadata
- [ ] Add metadata output instructions to Mike's SOUL.md
- [ ] Add metadata output instructions to Bayview's SOUL.md
- [ ] Test that Kimi K2.5 reliably produces valid JSON in the `<!-- DASHBOARD_DATA: {...} -->` format
- [ ] Deploy updated SOUL.md files to VPS

### Acceptance
- Agent responses include valid metadata blocks
- Metadata is cumulative (merges with previous turns)
- No metadata leaks into visible conversation text on the agent side

## M5 — Widget Redesign (Two-Panel Layout)
**Goal:** Rebuild `esperion-inline-chat.js` with split-screen chat + dashboard.

### Tasks
- [ ] Refactor widget to two-panel layout (left: chat, right: dashboard)
- [ ] Build trades dashboard component (job intake card)
  - Customer info fields (name, phone, suburb)
  - Job classification with colour-coded urgency badge
  - Revenue estimate display
  - Suggested schedule slot
  - Assigned team member
  - Status pipeline (New → Qualifying → Quoted → Booked)
- [ ] Build real estate dashboard component (lead qualification card)
  - Lead info fields (name, phone/email)
  - Lead type badge (Buyer/Seller/Browser)
  - Lead score indicator (Hot/Warm/Cold)
  - Buyer profile section (budget, suburbs, beds, timeline)
  - Seller profile section (address, type, estimated value)
  - Matched listings (count + addresses)
  - Recommended agent
  - Status pipeline (New → Qualifying → Qualified → Booked)
- [ ] ROI stats bar for both dashboard types (static/simulated numbers)
- [ ] Metadata parsing: strip `<!-- DASHBOARD_DATA: {...} -->` from display text
- [ ] Metadata → dashboard: parse JSON and update fields in real time
- [ ] Progressive animation: fields fade/slide in as data arrives
- [ ] Mobile responsive: tab toggle (💬 Chat / 📊 Dashboard) below 768px
- [ ] Graceful fallback: if metadata missing/invalid, dashboard shows last known state + skeleton placeholders
- [ ] Deploy to VPS

### Acceptance
- Both panels visible side-by-side on desktop
- Dashboard fields update in real time as conversation progresses
- No metadata visible in chat messages
- Mobile shows tabbed interface
- Clean, professional look — not a dev prototype

## M6 — Site Page Updates
**Goal:** Update both landing pages to accommodate the wider two-panel demo.

### Tasks
- [ ] Widen demo section container (was ~420px max, now ~820px)
- [ ] Update "Try It Live" heading/copy to explain both panels
- [ ] Add explanatory labels: "What your customer sees" / "What you see"
- [ ] Ensure responsive layout doesn't break existing page sections
- [ ] Deploy to Vercel

### Acceptance
- Demo section looks intentional and polished on the page
- Labels clearly communicate the two perspectives
- Page layout is clean at all viewports

## M7 — Pressure Testing
**Goal:** Verify dashboard reliability across many conversation scenarios.

### Test Scenarios (per vertical)
1. Happy path — customer provides all info naturally
2. Minimal info — customer is vague, AI has to qualify progressively
3. Off-topic — customer asks unrelated questions
4. Adversarial — tries to break the AI or extract weird responses
5. Quick abandonment — sends 1-2 messages then stops
6. Edge cases — empty messages, very long messages, special characters
7. Fee/pricing deep dive — tests knowledge base accuracy
8. Emergency scenario (trades) / hot lead scenario (real estate)
9. Conjunction enquiry (real estate) / after-hours emergency (trades)
10. Multi-turn qualification — 8-10 message conversation

### Cross-Platform
- Chrome desktop
- Safari desktop
- Firefox desktop
- iOS Safari (mobile)
- Android Chrome (mobile)

### Acceptance
- Dashboard correctly populates in 8/10 scenarios minimum
- No metadata leaks in any scenario
- Graceful degradation when metadata is missing
- Mobile tab toggle works on real devices

## M8 — Anthony Review
**Goal:** Anthony tests both demos personally and confirms prospect-ready.

### Gate Question
"Would we show this to a prospect in a sales call tomorrow?"
- If yes → move to Wave 2
- If no → iterate on specific feedback

---

# Estimated Timeline

| Milestone | Duration | Status |
|-----------|----------|--------|
| M0–M3.5 | — | ✅ Complete |
| Bug fixes + KB | — | ✅ Complete |
| M4 — Metadata instructions | 1–2 hrs | ⏳ Next |
| M5 — Widget redesign | 3–4 hrs | ⏳ Blocked by M4 |
| M6 — Site pages | 1 hr | ⏳ Blocked by M5 |
| M7 — Pressure testing | 2–3 hrs | ⏳ Blocked by M6 |
| M8 — Anthony review | 1 day | ⏳ Blocked by M7 |

**Total remaining:** ~7–10 hrs build + 1 day review
**Delegation:** Widget redesign (M5) is the biggest task — will use Claude Code for the frontend build.

---

# Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| VPS isolated from Mac Mini | Protect Ace's performance | 2026-03-10 |
| DigitalOcean Sydney region | Closest to NZ, Anthony's preference | 2026-03-10 |
| Kimi K2.5 as demo model | Cheapest viable via OpenRouter | 2026-03-10 |
| Inline chat widget (not floating bubble) | Embedded in page section, more natural demo flow | 2026-03-10 |
| 10-message cap | Limits cost, creates Calendly funnel | 2026-03-10 |
| Vanilla JS widget (no framework) | Lightweight, no build step, embeds anywhere | 2026-03-10 |
| 90s response timeout | Kimi K2.5 cold starts can exceed 30s | 2026-03-11 |
| Unique session keys per conversation | Prevents stale context, enables clean reset | 2026-03-11 |
| Smart fake data over API | No free NZ real estate/trades API exists | 2026-03-11 |
| Hidden metadata for dashboard | Real-time extraction from live chat, not simulated | 2026-03-12 |
| Split-screen two-panel layout | Industry standard for proving dual-sided value | 2026-03-12 |

---

# Open Items

- **Calendly link:** Still using generic `hello-esperion/30min`. Need vertical-specific links?
- **Model reliability:** Need to validate Kimi K2.5 consistently outputs valid JSON metadata. Fallback: bump to Sonnet if unreliable.
- **Mobile priority:** Confirm tab toggle is acceptable UX on phone, or if mobile should show dashboard as expandable accordion below chat instead.

---

*This plan tracks execution. The spec is in `demo-portfolio-build-plan-v3.md`. Both stay in sync.*
