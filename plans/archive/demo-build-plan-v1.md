# Esperion — Demo Build Plan (V1)

**Date:** 2026-03-10
**Approach:** CEO + Contractors — phased delegation with clear success criteria per phase
**V1 Goal:** Prove OpenClaw-powered isolated sessions work in the site. Minimal UI. No custom polish until the core is proven.

---

## Architecture Summary

```
Browser → Vercel Edge Proxy → Tailscale Funnel → OpenClaw Gateway → Kimi K2.5
                                                   (demo agent)
```

- **OpenClaw Gateway** hosts a `demo` agent with no tools, sandboxed, using Kimi K2.5
- **Chat Completions API** (`/v1/chat/completions`) enabled on the Gateway
- **Tailscale Funnel** exposes the Gateway to the internet over HTTPS
- **Vercel Edge Function** proxies requests, holds auth token server-side, enforces rate limits
- **Frontend** is a minimal chat widget embedded in the landing pages

---

## Phase 0: Gateway Configuration (Ace — not delegated)

**Why not delegated:** Requires Gateway config changes on the live system. Must be done by Ace.

### Tasks:

1. **Add `demo` agent to OpenClaw config:**
   ```json5
   {
     agents: {
       list: [
         // ... existing main agent ...
         {
           id: "demo",
           name: "Esperion Demo",
           model: "openrouter/moonshotai/kimi-k2.5",
           workspace: null,  // no workspace access
           tools: { deny: ["*"] },  // no tools at all
           sandbox: { mode: "off" },
           heartbeat: { every: "0m" },  // no heartbeat
           skipBootstrap: true,  // no AGENTS.md, SOUL.md, etc.
         }
       ]
     }
   }
   ```

2. **Enable Chat Completions endpoint:**
   ```json5
   {
     gateway: {
       http: {
         endpoints: {
           chatCompletions: { enabled: true }
         }
       }
     }
   }
   ```

3. **Enable Tailscale Funnel** (if not already):
   ```json5
   {
     gateway: {
       tailscale: { mode: "funnel" },
       auth: { mode: "password" }  // or token — required for Funnel
     }
   }
   ```

4. **Test locally:**
   ```bash
   curl -sS http://127.0.0.1:18789/v1/chat/completions \
     -H 'Authorization: Bearer <token>' \
     -H 'Content-Type: application/json' \
     -H 'x-openclaw-agent-id: demo' \
     -d '{
       "model": "openclaw",
       "messages": [
         {"role": "system", "content": "You are a helpful plumber receptionist."},
         {"role": "user", "content": "I have a leaking tap"}
       ]
     }'
   ```

5. **Verify session isolation:** Send two requests with different `x-openclaw-session-key` values, confirm they have independent conversation histories.

### Success criteria:
- [ ] `demo` agent responds via Chat Completions API
- [ ] Agent uses Kimi K2.5 (not default model)
- [ ] Agent has zero tools available
- [ ] Two different session keys maintain independent conversations
- [ ] Gateway accessible via Tailscale Funnel URL

### Unknowns to resolve:
- Does `skipBootstrap: true` prevent system prompt injection from workspace files? (Should — no workspace set)
- Does the Chat Completions endpoint accept `x-openclaw-session-key` for session routing? (Docs say yes, needs verification)
- Can we pass a system prompt via the messages array AND have the agent use it? (Standard OpenAI pattern — should work)
- Does `workspace: null` work, or do we need to omit the field entirely? Try omitting it + `skipBootstrap: true`. If that fails, try `/tmp/esperion-demo-noop` as a throwaway path.
- **Session key + messages array interaction**: The Chat Completions endpoint is "stateless per request" by default, but using `x-openclaw-session-key` may cause the Gateway to maintain internal conversation history. If the client ALSO sends full message history, there could be duplication. Test: send request 1 with key `test1`, then request 2 with same key including full conversation — check if the Gateway sees the conversation twice. If it does, either drop the session key (stateless per request) or don't send history (let Gateway maintain it).
- **OpenRouter provider**: Verify OpenRouter API key is configured and `openrouter/moonshotai/kimi-k2.5` is accessible. Check model catalog / provider config.

---

## Phase 1: Vercel Proxy API (Claude Code — Session 1)

**Role:** Backend API developer
**Task:** Build a Vercel Edge Function that proxies chat requests to the OpenClaw Gateway, holding auth credentials server-side and enforcing rate limits + message caps.

### Claude Code Prompt:

```
You are building a Vercel Edge Function API proxy for the Esperion AI demo system.

PROJECT: ~/Projects/esperion
SCOPE: api/ directory only — do NOT modify anything in sites/

## What you're building

A single Vercel serverless API route that:
1. Receives chat messages from the frontend
2. Proxies them to an OpenClaw Gateway Chat Completions endpoint
3. Holds the auth token server-side (never exposed to browser)
4. Enforces rate limits and message caps
5. Streams the response back to the client

## Technical spec

### Endpoint: POST /api/demo/chat

Request body:
{
  "sessionId": "uuid-v4",       // Generated client-side, unique per visitor
  "message": "string",          // User's chat message  
  "demoId": "trades" | "realestate",  // Which demo vertical
  "messageCount": 1-10          // Client-reported count (server validates too)
}

Response (streaming SSE):
- Content-Type: text/event-stream
- The proxy receives standard OpenAI SSE format from the Gateway (data: <json> with delta objects, ending with data: [DONE])
- The proxy TRANSFORMS this into a simpler format for the frontend:
  - data: {"chunk": "text"} for each content delta
  - data: {"done": true, "messageCount": N} as the final event
- This keeps the frontend simple and decoupled from the OpenAI format
- Parse each SSE event from Gateway, extract choices[0].delta.content, re-emit as {"chunk": content}

### System prompts

The system prompt is determined by `demoId`:
- "trades" → Mike's Plumbing AI receptionist prompt (see below)
- "realestate" → Bayview Realty AI assistant prompt (see below)

Store these as constants in a separate file: `api/lib/prompts.ts`

TRADES SYSTEM PROMPT:
"""
You are the AI receptionist for Mike's Plumbing, a residential plumbing business in Auckland, New Zealand. You answer enquiries from homeowners.

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
- Common jobs: blocked drains ($180–350), hot water cylinder ($800–2500 installed), leaking taps ($120–250), toilet repairs ($150–300), gas fitting (quote required)
- Response time: usually same-day or next-day for standard jobs
- Emergency: available 24/7 for burst pipes, gas leaks, flooding — $150 call-out fee

Rules:
- You are a DEMO. This is not a real business.
- If asked about this being real: "This is a live demo of the AI receptionist that Esperion builds for trade businesses. Everything you're seeing is exactly what your customers would experience."
- Never mention OpenClaw, Kimi, or any technical infrastructure.
- Stay on topic. If asked unrelated questions, redirect politely.
- Do not make up specific appointment times. Say "I'll check Mike's calendar and get back to you with available slots."
"""

REALESTATE SYSTEM PROMPT:
"""
You are the AI assistant for Bayview Realty, a mid-size real estate agency in Auckland, New Zealand. You handle inbound enquiries from buyers and sellers.

Your job:
1. Greet professionally and ask how you can help
2. For BUYERS: ask what they're looking for (suburbs, bedrooms, budget range), qualify their timeline, offer to arrange viewings
3. For SELLERS: ask about their property (suburb, type, bedrooms, situation), offer a free market appraisal
4. Capture their contact preference and availability
5. Hand off to the right agent

Your personality:
- Professional, warm, knowledgeable about Auckland property
- Use NZ English and NZ property terminology ("flat" not "apartment", "section" not "lot", "rates" not "property tax")
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
- If asked: "This is a live demo of the AI assistant that Esperion builds for real estate agencies. What you're seeing is exactly how your buyer and seller enquiries would be handled."
- Never mention OpenClaw, Kimi, or any infrastructure.
- Stay on property topics. Redirect off-topic questions politely.
- Do not fabricate specific agent names beyond "one of our senior agents."
"""

### Server-side message cap enforcement (IMPORTANT)

Vercel Edge Functions are STATELESS — in-memory Maps reset on every invocation. Do NOT use in-memory state.

Instead, count messages from the request payload:
- Count the number of `role: "user"` messages in the `messages[]` array
- If count >= 10, reject the request with `{ error: "cap_reached", ctaUrl: "..." }`
- This is tamper-resistant enough for V1 — a malicious user could strip messages, but the $10 OpenRouter hard cap limits damage

### Rate limiting (V1 — lightweight)

- Use Vercel's built-in edge rate limiting if available, otherwise skip for V1
- The $10/month OpenRouter spend cap is the real safety net
- V2 will add Vercel KV (Upstash Redis) for proper per-IP rate limiting

### Input validation (SECURITY — MANDATORY)

Before forwarding to the Gateway:
- Strip any messages with `role: "system"` from the client input — the proxy adds the system prompt itself
- Only allow `role: "user"` and `role: "assistant"` messages from the client
- Reject requests where messages array length > 25 (10 user + 10 assistant + buffer)
- Never forward arbitrary headers from the client to the Gateway

### OpenClaw Gateway connection

Environment variables (set in Vercel):
- OPENCLAW_GATEWAY_URL — e.g., https://<tailscale-funnel-hostname>
- OPENCLAW_GATEWAY_TOKEN — bearer auth token

Proxy request to: POST {OPENCLAW_GATEWAY_URL}/v1/chat/completions
Headers:
- Authorization: Bearer {OPENCLAW_GATEWAY_TOKEN}
- Content-Type: application/json
- x-openclaw-agent-id: demo
- x-openclaw-session-key: demo:{demoId}:{sessionId}

Body:
{
  "model": "openclaw",
  "stream": true,
  "messages": [
    {"role": "system", "content": "<system prompt based on demoId>"},
    ...conversation history from client or from session...
  ]
}

IMPORTANT: The OpenClaw Gateway maintains conversation history per session key.
But the Chat Completions API is stateless per request — we need to pass the conversation
history in each request. The client should maintain and send the full conversation history.

Updated request body from client:
{
  "sessionId": "uuid",
  "demoId": "trades" | "realestate",
  "messages": [
    {"role": "user", "content": "I have a leaking tap"},
    {"role": "assistant", "content": "...previous AI response..."},
    {"role": "user", "content": "It's in the kitchen"}
  ]
}

The proxy prepends the system prompt and forwards to Gateway.

### CORS

Allow origins:
- https://aifortrades.com (and www)
- https://aiforrealestate.com (and www)
- http://localhost:* (dev only)

### Error handling

- Gateway timeout → return { error: "Demo temporarily unavailable. Please try again." }
- Rate limit hit → return { error: "Too many requests. Please wait a moment." }
- Message cap hit → return { error: "cap_reached", ctaUrl: "https://calendly.com/esperion" }

### File structure

api/
├── demo/
│   └── chat.ts          # Main edge function
├── lib/
│   ├── prompts.ts       # System prompts per vertical
│   ├── ratelimit.ts     # Rate limiting logic
│   └── types.ts         # TypeScript types
├── package.json
└── vercel.json

### Testing

Write a simple test script (api/test.sh) that:
1. Sends a message to the local dev server
2. Verifies SSE streaming works
3. Verifies message cap enforcement
4. Verifies rate limiting

## Constraints
- TypeScript, Edge Runtime compatible (no Node.js-only APIs)
- No frameworks — raw Vercel Edge Functions
- No database for V1 — stateless message counting from request payload
- Must handle SSE streaming properly (transform Gateway OpenAI SSE → simple chunk format)

## Failure handling
- If you hit a blocker (dependency missing, API incompatibility, Edge Runtime limitation), document it in `api/BLOCKERS.md` and complete everything else
- If SSE proxying proves difficult on Edge Runtime, fall back to non-streaming (collect full response, return as JSON)
- Test with a mock Gateway endpoint if the real one isn't available yet

## Success criteria
- POST /api/demo/chat returns streaming AI responses
- System prompt correctly injected based on demoId
- Message cap enforced at 10 (server rejects 11+)
- Rate limiting works (3 sessions/IP/hour)
- CORS properly configured
- Error responses are clean JSON
- No auth token exposure in responses or client-visible headers

When completely finished, run: openclaw system event --text "Done: Vercel demo proxy API complete. Ready for frontend integration." --mode now
```

### Success criteria:
- [ ] Streaming responses from Gateway through Vercel proxy
- [ ] System prompts correct per vertical
- [ ] Message cap enforced server-side
- [ ] Rate limiting functional
- [ ] No auth token leakage
- [ ] Clean error handling

---

## Phase 2: Minimal Chat Frontend (Claude Code — Session 2)

**Depends on:** Phase 0 (Gateway config) + Phase 1 (Vercel proxy)

**Role:** Frontend developer
**Task:** Build a minimal chat widget (vanilla JS, no framework) that connects to the Vercel proxy API and renders a basic chat UI. NOT the WhatsApp-exact clone — just enough to prove the demo works.

### Claude Code Prompt:

```
You are building a minimal chat widget for the Esperion AI demo system.

PROJECT: ~/Projects/esperion
SCOPE: sites/shared/ directory — create shared components used by both landing pages

## What you're building

A lightweight, embeddable chat widget that:
1. Opens a chat interface (floating button or embedded section)
2. Sends messages to the Vercel proxy API
3. Renders streaming AI responses in real-time
4. Enforces 10-message cap with CTA
5. Supports both "trades" and "realestate" demo verticals

## V1 constraint: MINIMAL UI
This is NOT the WhatsApp-exact clone. That's V2. For V1:
- Clean, modern chat bubbles (left = AI, right = user)
- Simple header with business name + avatar placeholder
- Basic typing indicator (animated dots)
- Message count indicator ("3 of 10 messages")
- CTA button after cap
- Responsive (works on mobile)
- No WhatsApp branding, no tick marks, no wallpaper — just clean functional chat

## Technical spec

### Initialization

The widget is initialized with:
```js
EsperionDemo.init({
  containerId: 'demo-chat',        // DOM element to mount in
  demoId: 'trades',                // or 'realestate'
  businessName: "Mike's Plumbing", // Display name in header
  apiUrl: '/api/demo/chat',        // Vercel proxy endpoint
  ctaUrl: 'https://calendly.com/esperion',  // Post-cap CTA
  openingMessage: "👋 Hey! Thanks for messaging...",  // Auto-sent on open
  mode: 'embedded' | 'floating'    // Embedded section or floating button
});
```

### Message flow

1. Widget generates UUID v4 session ID (stored in sessionStorage)
2. Opening message auto-displays (with 1-second delay)
3. User types message → appears immediately as user bubble
4. Widget sends POST to apiUrl with:
   {
     "sessionId": "<uuid>",
     "demoId": "<vertical>",
     "messages": [full conversation history]
   }
5. Streaming response renders token-by-token in AI bubble
6. After message 10, AI sends closing CTA, input locks, CTA button appears
7. "New conversation" link resets session

### SSE handling

The Vercel proxy returns a simplified SSE format (it transforms the OpenAI format internally):
- data: {"chunk": "text"} — append text to the current AI bubble
- data: {"done": true, "messageCount": N} — finalize the message, update counter

Use fetch with ReadableStream to consume SSE (not EventSource — we need POST with body).

### File structure

sites/shared/
├── demo-widget.js     # Main widget logic (vanilla JS, single IIFE)
├── demo-widget.css    # All styling
└── demo-widget.html   # Test page for standalone development

### Styling guidelines

- Max width: 440px (centered on desktop, full-width on mobile)
- Max height: 500px (embedded), 600px (floating popup)
- AI bubbles: light grey background (#F0F0F0), left-aligned
- User bubbles: blue (#007AFF) with white text, right-aligned
- Header: dark (#1A1A1A), white text, business name
- Input: bottom bar with rounded input field + send button
- Typing indicator: three animated dots in a grey bubble
- Message counter: subtle "3/10" in bottom-right of input bar
- Responsive: on mobile (<768px), floating mode goes full-screen
- Font: system font stack (-apple-system, BlinkMacSystemFont, etc.)

### Floating mode

When mode='floating':
- Show a blue circular FAB (💬 icon) in bottom-right corner
- Click opens chat popup above/beside the button
- Close button (×) in header returns to FAB
- Pulse animation on FAB to attract attention

### Embedded mode

When mode='embedded':
- Render directly inside the container element
- No FAB, no popup — chat is always visible
- Container should have a heading above it (provided by the page HTML)

### Error handling

- API error → show "Something went wrong. Try sending again." in chat
- Network offline → show "You're offline. Reconnect to continue." 
- Rate limited → show "Too many conversations. Please wait a moment."

### No dependencies

- Pure vanilla JavaScript (no React, no framework)
- No build step required — single JS + CSS file
- Must work when loaded via <script> and <link> tags

## Constraints
- Zero external dependencies
- Single JS file + single CSS file
- No build step
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Accessible: keyboard navigation, ARIA labels, screen reader friendly

## Failure handling
- If SSE consumption proves tricky, fall back to polling or non-streaming (fetch full response as JSON, display all at once with a typing animation)
- If you hit a blocker, document it in `sites/shared/BLOCKERS.md` and complete everything else
- The test page should work with a mock API endpoint (hardcoded responses) for standalone development

## Success criteria
- Chat widget renders and accepts messages
- Messages stream in real-time from the API
- 10-message cap enforced with CTA display
- Both embedded and floating modes work
- Mobile responsive
- Clean, professional appearance (not ugly, but not WhatsApp-polished)
- test page (demo-widget.html) works standalone for development

When completely finished, run: openclaw system event --text "Done: Minimal chat frontend widget complete. Ready for page integration." --mode now
```

### Success criteria:
- [ ] Chat widget renders in both modes (embedded + floating)
- [ ] Messages stream in real-time
- [ ] Message cap with CTA
- [ ] Mobile responsive
- [ ] No external dependencies
- [ ] Test page works standalone

---

## Phase 3: Page Integration (Claude Code — Session 3)

**Depends on:** Phase 2 (frontend widget)

**Role:** Frontend integrator
**Task:** Integrate the demo widget into both landing pages with appropriate section layout and copy.

### Claude Code Prompt:

```
You are integrating the Esperion demo chat widget into two landing pages.

PROJECT: ~/Projects/esperion
SCOPE: sites/aifortrades/ and sites/aiforrealestate/ only

## What you're doing

Add a demo section to each landing page that:
1. Has a compelling heading and subtext
2. Embeds the demo chat widget (embedded mode)
3. Also adds a floating chat button (floating mode, different instance)
4. Matches the existing page design language

## For AI for Trades (sites/aifortrades/index.html):

Add a new section AFTER the "How It Works" section and BEFORE the pricing/CTA section.

Section HTML structure:
```html
<section id="demo" class="demo-section">
  <div class="container">
    <h2>See It In Action — Right Now</h2>
    <p class="demo-subtitle">This is a working AI receptionist for a plumbing business. 
    Message it like a real customer — ask about a leaking tap, a blocked drain, 
    anything. This is exactly what your customers would experience.</p>
    <div id="demo-chat-embedded"></div>
  </div>
</section>
```

Add script initialization at bottom:
```html
<link rel="stylesheet" href="/shared/demo-widget.css">
<script src="/shared/demo-widget.js"></script>
<script>
  // Embedded demo in the section
  EsperionDemo.init({
    containerId: 'demo-chat-embedded',
    demoId: 'trades',
    businessName: "Mike's Plumbing",
    apiUrl: '/api/demo/chat',
    ctaUrl: 'https://calendly.com/esperion',
    openingMessage: "👋 Hey! Thanks for messaging Mike's Plumbing. I'm Mike's AI assistant — I handle enquiries so Mike can stay on the tools. How can I help you today?",
    mode: 'embedded'
  });

  // Floating button (always visible)
  EsperionDemo.init({
    containerId: 'demo-chat-floating',
    demoId: 'trades',
    businessName: "Mike's Plumbing",
    apiUrl: '/api/demo/chat',
    ctaUrl: 'https://calendly.com/esperion',
    openingMessage: "👋 Hey! Thanks for messaging Mike's Plumbing. I'm Mike's AI assistant — I handle enquiries so Mike can stay on the tools. How can I help you today?",
    mode: 'floating'
  });
</script>
<div id="demo-chat-floating"></div>
```

## For AI for Real Estate (sites/aiforrealestate/index.html):

Same pattern, different content:

```html
<section id="demo" class="demo-section">
  <div class="container">
    <h2>See It In Action — Right Now</h2>
    <p class="demo-subtitle">This is a working AI assistant for a real estate agency. 
    Ask about properties, book a viewing, request an appraisal — just like a real 
    buyer or seller would. This is exactly what your leads would experience.</p>
    <div id="demo-chat-embedded"></div>
  </div>
</section>
```

Initialize with:
- demoId: 'realestate'
- businessName: "Bayview Realty"
- openingMessage: "Hello! Welcome to Bayview Realty. I'm the team's AI assistant — I help with property enquiries, viewing bookings, and appraisal requests. Are you looking to buy, sell, or just exploring the Auckland market?"

## Styling

Add demo section CSS that:
- Centers the widget within a max-width container
- Has subtle background differentiation from surrounding sections
- Heading is large, bold, compelling
- Subtitle is smaller, descriptive, builds context
- Responsive on mobile
- Matches the existing page's design language (inspect the CSS to match fonts, colors, spacing)

## Constraints
- Do NOT modify the demo widget code (sites/shared/*)
- Do NOT modify any other sections — only ADD the demo section
- Match existing page design patterns (inspect styles first)
- Heading copy must match the AI agency positioning

## Failure handling
- If the existing page structure is hard to modify safely, add the demo section at the bottom rather than risk breaking layout
- If you hit a blocker, document it in `sites/BLOCKERS.md` and complete what you can

## Success criteria
- Demo section appears in correct position on both pages
- Both embedded and floating modes work on each page
- Styling matches existing page design
- Mobile responsive
- No broken layouts

When completely finished, run: openclaw system event --text "Done: Demo integrated into both landing pages. Ready for end-to-end testing." --mode now
```

### Success criteria:
- [ ] Demo section visible on both pages in correct position
- [ ] Both modes working per page
- [ ] Styling matches page design
- [ ] Mobile works

---

## Phase 4: End-to-End Testing & Deploy (Ace — not delegated)

**Why not delegated:** Requires Gateway access, Vercel deployment, and holistic verification.

### Tasks:

1. **Deploy Vercel proxy:**
   - Set env vars: `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_TOKEN`
   - Deploy with `vercel --prod`
   - Verify API responds

2. **End-to-end test:**
   - Open trades page → embedded demo → send 10 messages → verify cap + CTA
   - Open trades page → floating button → same test
   - Open realestate page → same tests
   - Open two tabs simultaneously → verify session isolation (different conversations)
   - Test on mobile (responsive)
   - Verify proxy timeout (10-15s) returns graceful error when Gateway is unreachable
   - Measure first-token latency (target: <2s)
   - Test message array tampering: send a request with injected `system` role messages — verify proxy strips them

3. **Verify Gateway logs:**
   - Sessions appear with `demo:trades:*` and `demo:realestate:*` keys
   - Model is Kimi K2.5
   - No tools invoked
   - No workspace access

4. **Anthony review:**
   - Send screenshot + live URL in #ace-esperion
   - Get feedback

### Success criteria:
- [ ] Full conversation works end-to-end (browser → Vercel → Gateway → Kimi → back)
- [ ] Session isolation confirmed
- [ ] Message cap works
- [ ] Rate limiting works
- [ ] Both pages, both modes, desktop + mobile
- [ ] Anthony approves

---

## Execution Order

```
Phase 0: Gateway Config (Ace)           ← FIRST — must be done before anything else
    │
    ▼
Phase 1: Vercel Proxy API (Claude Code) ← Can start after Phase 0 verified
    │
    ▼
Phase 2: Chat Frontend (Claude Code)    ← Can start in parallel with Phase 1
    │                                      (uses mock API during dev)
    ▼
Phase 3: Page Integration (Claude Code) ← Depends on Phase 2
    │
    ▼
Phase 4: E2E Testing & Deploy (Ace)     ← Depends on all above
```

**Phases 1 and 2 can run in parallel** — the frontend uses its test page with a mock API endpoint during development, then connects to the real Vercel proxy once both are done.

### Quality Gates (Mandatory between phases)

After each Claude Code session completes:
1. **Ace reviews output** against success criteria (not fire-and-forget)
2. **Verify** — run the code, check the output, test edge cases
3. **Accept** or **re-delegate** with refined instructions
4. **Only then** proceed to the next dependent phase

For Phase 0 (Gateway config) — this is high-stakes architecture work. Use highest available reasoning to verify the config is correct before applying.

---

## Delegation Summary

| Phase | Who | Session Type | Estimated Time |
|-------|-----|-------------|---------------|
| 0 - Gateway Config | Ace (direct) | Main session | 30 min |
| 1 - Vercel Proxy API | Claude Code (subagent) | Isolated | 2–3 hours |
| 2 - Chat Frontend | Claude Code (subagent) | Isolated | 2–3 hours |
| 3 - Page Integration | Claude Code (subagent) | Isolated | 1 hour |
| 4 - E2E Test & Deploy | Ace (direct) | Main session | 1 hour |
| **Total** | | | **~6–8 hours** |

---

## V2 Roadmap (After V1 Proven)

Once V1 proves OpenClaw session isolation works in the site:

1. **WhatsApp-exact UI** — pixel-perfect replica (green header, bubbles, ticks, wallpaper)
2. **Floating WhatsApp FAB** — green circle with WhatsApp icon, pulse animation
3. **Typing animation polish** — randomized 1–3s delay, three-dot animation
4. **Message progress** — "7 of 10 messages" counter
5. **Sound effects** — WhatsApp message sounds (optional)
6. **Analytics** — track engagement, completion, CTA clicks
7. **A/B testing** — test different cap numbers, CTAs, opening messages

V2 is a single Claude Code session focused purely on UI polish — the backend doesn't change.

---

*Build plan created 2026-03-10. Execute in order. Phases 1+2 can run parallel.*
