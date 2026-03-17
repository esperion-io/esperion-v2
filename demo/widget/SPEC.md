# Esperion Chat Widget — Build Spec

## Overview
A lightweight, vanilla JS chat widget that embeds on Esperion landing sites as a floating chat bubble. It connects to an OpenClaw Gateway via WebSocket and provides a demo chat experience with a message cap and Calendly CTA.

## Architecture

```
Browser (widget JS) ──WebSocket──> demo.aitools.co.nz (Caddy) ──proxy──> OpenClaw Gateway (port 18789)
```

## OpenClaw Gateway WebSocket Protocol

The Gateway uses a JSON-framed WebSocket protocol:

### Connection
```
ws://host:port/ or wss://host:port/
```

### Frame Types
- **Request**: `{ "type": "req", "id": "<uuid>", "method": "<method>", "params": {...} }`
- **Response**: `{ "type": "res", "id": "<uuid>", "ok": true, "payload": {...} }` or `{ "type": "res", "id": "<uuid>", "ok": false, "error": {...} }`
- **Event**: `{ "type": "event", "event": "<name>", "payload": {...} }`

### Required Flow
1. First message MUST be a `connect` request:
```json
{
  "type": "req",
  "id": "1",
  "method": "connect",
  "params": {
    "auth": { "token": "<gateway_token>" }
  }
}
```
2. Wait for response with `ok: true`
3. Send messages via `chat.send`:
```json
{
  "type": "req",
  "id": "2",
  "method": "chat.send",
  "params": {
    "text": "Hello, I have a plumbing issue"
  }
}
```
4. Listen for `chat` events for streamed responses:
```json
{
  "type": "event",
  "event": "chat",
  "payload": {
    "role": "assistant",
    "text": "Hi there! I'd be happy to help..."
  }
}
```

Note: `chat.send` is non-blocking — it acks immediately with `{ runId, status: "started" }` and the response streams via `chat` events.

## Widget Behavior

### Embed API
```html
<script
  src="https://demo.aitools.co.nz/widget/esperion-chat.js"
  data-token="<gateway_token>"
  data-agent="mike"
  data-theme="trades"
  data-calendly="https://calendly.com/hello-esperion/30min"
  data-company="Mike's Plumbing"
  data-tagline="AI-Powered Customer Service Demo"
></script>
```

### UI Components
1. **Chat Bubble** — Floating button, bottom-right corner, 60x60px circle with chat icon
2. **Chat Panel** — Slides up from bubble on click
   - Header bar with company name + close button
   - Message area (scrollable)
   - Input bar with text field + send button
3. **Mobile** — Full-screen panel on viewports < 768px

### Visual Design
- Clean, modern, rounded corners (12px)
- Shadow for depth
- Two themes configurable via `data-theme`:
  - `trades`: Blue primary (#2563EB), amber accent (#F59E0B)
  - `realestate`: Dark primary (#1F2937), gold accent (#D4A843)
- Agent avatar: colored circle with first letter of company name
- User messages: right-aligned, primary color background, white text
- Agent messages: left-aligned, light gray background, dark text
- Typing indicator: animated dots while agent is responding

### Message Cap Flow
- Track message count in `localStorage` (key: `esperion-demo-{agent}-count`)
- **Messages 1-9**: Normal chat flow
- **Message 10**: Send the message, show the response, then show a soft CTA banner below:
  "Impressed? See how this could work for your business → [Book a Call]"
- **Messages 11+**: Input disabled. Show a full CTA panel:
  "Thanks for trying the demo! To explore how AI can transform your business, book a quick 30-minute call with our team."
  [Book a Call] button → opens Calendly link in new tab
  [Reset Demo] small text link → clears localStorage count, reconnects

### Session Handling
- Generate a random session ID on first load, store in `localStorage`
- Reconnect WebSocket on disconnect with exponential backoff (1s, 2s, 4s, max 30s)
- Show "Reconnecting..." status in header when disconnected
- On reset: clear localStorage, generate new session ID, fresh WebSocket connection

### Error Handling
- WebSocket connection failure: Show "Unable to connect. Please try again later." in chat area
- Agent timeout (no response in 30s): Show "Taking longer than expected..." 
- Empty message: Don't send, flash input border red briefly
- Network offline: Show "You're offline" banner at top of chat panel

## File Structure
```
demo/widget/
├── esperion-chat.js    ← Main widget (self-contained, includes CSS)
├── esperion-chat.css   ← Extracted CSS (for reference, but CSS is injected by JS)
└── README.md           ← Embed instructions
```

## Technical Constraints
- **Zero dependencies** — vanilla JS only, no frameworks, no build step
- **Self-contained** — single JS file injects its own CSS via `<style>` tag
- **Lightweight** — target < 15KB minified
- **Compatible** — ES2020+, works in Chrome/Firefox/Safari/Edge (last 2 versions)
- **Accessible** — keyboard navigation, ARIA labels, screen reader friendly
- **No conflicts** — all CSS scoped under `.esperion-chat-widget` namespace
- **CSP friendly** — no eval(), no inline event handlers in HTML strings

## Gateway Token
The token for the demo VPS gateway: `6b9fc73644f29e334808cfb13c3087f42d0668746fe4b10ca0f85eb2e2d3a9e4`

## Testing
Include a `test.html` file that embeds two widget instances (one for Mike's Plumbing, one for Bayview Realty) for local testing. Point at `wss://demo.aitools.co.nz`.
