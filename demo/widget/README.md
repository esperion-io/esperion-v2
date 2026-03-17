# Esperion Chat Widget

Lightweight embeddable chat widget that connects to OpenClaw Gateway via WebSocket. Self-contained — single JS file with no dependencies.

## Embed

```html
<script
  src="https://demo.aitools.co.nz/widget/esperion-chat.js"
  data-token="<gateway_token>"
  data-agent="mike"
  data-theme="trades"
  data-company="Mike's Plumbing"
  data-tagline="AI-Powered Customer Service Demo"
  data-calendly="https://calendly.com/hello-esperion/30min"
></script>
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-token` | Yes | OpenClaw Gateway auth token |
| `data-agent` | No | Agent preset: `mike`, `bayview`, `pacific`, `studymate` (default: `mike`) |
| `data-theme` | No | Visual theme: `trades`, `realestate`, `pm`, `education` (default: `trades`) |
| `data-company` | No | Company name shown in header (overrides agent preset) |
| `data-tagline` | No | Subtitle shown in header (default: `Powered by Esperion`) |
| `data-calendly` | No | Calendly URL for CTA buttons |
| `data-cap` | No | Message cap before CTA (default: `10`) |
| `data-mock` | No | Set to `true` for mock mode (no WebSocket, for testing) |

## WebSocket Protocol

The widget connects to `wss://<script-host>/` and follows the OpenClaw Gateway protocol:

1. On socket open → sends `connect` request with auth token
2. Waits for `{ type: "res", id: "connect", ok: true }` acknowledgement
3. User messages sent via `chat.send` requests
4. Agent responses arrive as `chat` events: `{ type: "event", event: "chat", payload: { role: "assistant", text: "..." } }`

The WebSocket URL is derived automatically from `script.src`. If the widget is served from `https://demo.aitools.co.nz/widget/esperion-chat.js`, it connects to `wss://demo.aitools.co.nz`.

## Message Cap

- **Messages 1–9**: Normal chat flow
- **Message 10**: After response, a soft CTA banner appears: *"Impressed? See how this could work for your business → Book a Call"*. Input remains active.
- **Message 11+**: Input disabled. Full CTA card shown with [Book a Call] and [Reset Demo] options.

## Session Handling

- Session ID stored in `localStorage` under `esperion-demo-{agent}-session`
- Chat history persisted in `localStorage` under `esperion-demo-{agent}`
- Panel open/closed state persisted in `sessionStorage`
- WebSocket reconnects automatically with exponential backoff (1s → 2s → 4s → … → 30s max)
- Header subtitle shows "Reconnecting..." when disconnected

## Files

| File | Purpose |
|------|---------|
| `esperion-chat.js` | Self-contained widget — injects its own CSS, zero dependencies |
| `esperion-chat.css` | Extracted CSS reference (not loaded separately) |
| `test.html` | Local test page with two widget instances and live controls |

## Local Testing

Open `test.html` in a browser. The test controls panel (top-left) lets you:
- Switch between agent presets
- Change themes live (no reload)
- Toggle between mock mode and live WebSocket
- Reset all chat history

In **mock mode** (`data-mock="true"`), the widget simulates responses locally — no WebSocket connection needed. In **live WS mode**, it connects to `wss://demo.aitools.co.nz` using the gateway token.

## Gateway Token

Demo token: `6b9fc73644f29e334808cfb13c3087f42d0668746fe4b10ca0f85eb2e2d3a9e4`

## Browser Support

Chrome, Firefox, Safari, Edge — last 2 versions. ES2020+. No polyfills required.
