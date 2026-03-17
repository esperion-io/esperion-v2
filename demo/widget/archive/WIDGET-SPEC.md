# Esperion Chat Widget — Build Spec

## Overview
A lightweight, embeddable chat widget that connects to an OpenClaw gateway via the OpenAI-compatible `/v1/chat/completions` endpoint. Vanilla JS + CSS, no framework dependencies.

## Files to Create
- `esperion-chat.js` — main widget script (single file, self-contained)
- `esperion-chat.css` — widget styles (separate file, loaded by the JS)
- `test.html` — local test page for development

## How It Works

### Embedding
Site owners add one script tag:
```html
<script
  src="https://demo.esperion.io/widget/esperion-chat.js"
  data-api="https://demo.esperion.io"
  data-agent="mike"
  data-token="abc123"
  data-theme="trades"
  data-calendly="https://calendly.com/esperion/demo"
></script>
```

The script auto-initializes on DOMContentLoaded. It loads the CSS file from the same directory as the JS.

### Configuration (data attributes)
| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-api` | Yes | Base URL of the OpenClaw gateway (e.g., `https://demo.esperion.io`) |
| `data-agent` | Yes | Agent ID — determines which persona to use (`mike`, `bayview`, `pacific`, `studymate`) |
| `data-token` | Yes | Bearer token for gateway auth |
| `data-theme` | No | Color theme: `trades` (blue/amber), `realestate` (dark/gold), `pm` (teal), `education` (violet). Default: `trades` |
| `data-calendly` | No | Calendly URL shown after message cap. Default: `https://calendly.com/esperion/demo` |
| `data-position` | No | Widget position: `bottom-right` (default), `bottom-left` |
| `data-greeting` | No | Initial greeting message from the agent. If omitted, uses a default based on agent ID. |
| `data-cap` | No | Message cap (default: 10) |

### Agent System Prompts
The widget must prepend the correct system prompt based on `data-agent`. The system prompts are NOT fetched from the server — they are embedded in the widget JS as a lookup object. This keeps things simple and avoids an extra API call.

The system prompts should be loaded from the SOUL.md files during build, but for now hardcode them as strings in the JS. We'll extract them later.

**Important:** For the chat completions endpoint, the system prompt goes as the first message with `role: "system"` in the messages array.

### Default Greetings (per agent)
- `mike`: "Hey there! 👋 Thanks for reaching out to Mike's Plumbing. How can I help?"
- `bayview`: "Hi there! 👋 Thanks for getting in touch with Bayview Realty. How can I help you today?"
- `pacific`: "Hello! 👋 Welcome to Pacific Property Management. How can I help?"
- `studymate`: "Hey! 👋 I'm your StudyMate — here to help with study and career stuff. What can I help with?"

### UI Components

#### 1. Chat Bubble (collapsed state)
- Floating circular button, bottom-right (or bottom-left)
- 56px diameter on desktop, 48px on mobile
- Chat icon (SVG, inline — no external dependencies)
- Subtle pulse animation on first load (draws attention, stops after 3 seconds)
- Badge with unread count (if agent sent greeting while closed)
- Click opens the chat panel

#### 2. Chat Panel (expanded state)
- Fixed position panel above the bubble
- **Desktop:** 380px wide × 520px tall, rounded corners, shadow
- **Mobile (< 640px):** Full screen overlay
- Components:
  - **Header bar:** Agent name + vertical icon, "Powered by Esperion" small text, close (X) button
  - **Message area:** Scrollable, auto-scrolls to bottom on new messages
  - **Input area:** Text input + send button, disabled after cap

#### 3. Message Bubbles
- **Agent messages:** Left-aligned, light background, agent avatar (small colored circle with initial)
- **User messages:** Right-aligned, themed color background, white text
- **Typing indicator:** Three animated dots, shown while waiting for API response
- **Timestamps:** Relative ("just now", "2m ago"), shown on hover or after gaps > 5 min

#### 4. Message Cap Flow
- **Messages 1-8:** Normal conversation
- **Message 9:** Normal — the agent's persona handles the soft wind-down
- **Message 10:** User sends, gets response, then input is disabled
- **After cap:** Show a CTA card in the chat:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━
  ✨ Want to see more?

  Book a quick call to explore how
  AI can work for your business.

  [Book a Demo Call →]  (links to Calendly)
  ━━━━━━━━━━━━━━━━━━━━━━
  ```
- Input field shows "Demo complete — book a call to continue" (disabled)
- "Start new chat" small link below CTA (resets session)

### API Integration

#### Sending Messages
```
POST {data-api}/v1/chat/completions
Authorization: Bearer {data-token}
Content-Type: application/json

{
  "model": "openrouter/moonshotai/kimi-k2.5",
  "messages": [
    {"role": "system", "content": "<agent system prompt>"},
    {"role": "assistant", "content": "<greeting>"},
    {"role": "user", "content": "I have a leaky tap"},
    {"role": "assistant", "content": "...previous response..."},
    {"role": "user", "content": "It's in my kitchen"}
  ],
  "stream": true,
  "max_tokens": 500,
  "temperature": 0.7
}
```

- Use **streaming** (SSE) for real-time response display
- Parse SSE chunks and append to the current assistant message bubble in real-time
- Full conversation history sent each time (stateless API — widget maintains state)

#### Error Handling
- Network error: show "Connection lost. Trying again..." with retry (3 attempts, exponential backoff)
- 429 rate limit: show "Busy right now — try again in a moment"
- 500 server error: show "Something went wrong. Please try again."
- Timeout (30s): abort request, show "Response took too long. Please try again."

### State Management
- **Conversation history:** Stored in `localStorage` keyed by `esperion-chat-{agent}`
- **Message count:** Tracked in localStorage, persists across page loads
- **Panel open/closed:** Stored in `sessionStorage` (resets per browser session)
- **Session reset:** "Start new chat" clears localStorage for this agent, resets count

### Styling Requirements

#### Color Themes
```css
/* Trades (Mike's Plumbing) */
--primary: #2563EB;      /* Blue-600 */
--primary-hover: #1D4ED8; /* Blue-700 */
--accent: #F59E0B;        /* Amber-500 */

/* Real Estate (Bayview Realty) */
--primary: #1F2937;       /* Gray-800 */
--primary-hover: #111827;  /* Gray-900 */
--accent: #D97706;         /* Amber-600 / Gold */

/* Property Management */
--primary: #0D9488;        /* Teal-600 */
--primary-hover: #0F766E;  /* Teal-700 */
--accent: #06B6D4;         /* Cyan-500 */

/* Education */
--primary: #7C3AED;        /* Violet-600 */
--primary-hover: #6D28D9;  /* Violet-700 */
--accent: #EC4899;         /* Pink-500 */
```

#### Typography
- Font: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- Message text: 14px
- Header: 16px semi-bold
- Input: 14px
- Timestamps: 11px, muted color

#### Accessibility
- Keyboard navigation (Tab through elements, Enter to send, Escape to close)
- ARIA labels on all interactive elements
- Focus management (focus input when panel opens)
- Reduced motion: disable animations if `prefers-reduced-motion` is set
- Sufficient color contrast (WCAG AA)

#### Z-index
- Chat bubble: 9998
- Chat panel: 9999
- Ensure it sits above most site content but below browser-native overlays

### Performance
- Total widget size: < 30KB (JS + CSS combined, uncompressed)
- No external dependencies (no jQuery, no React, no icon fonts)
- All SVG icons inline
- CSS loaded asynchronously (non-render-blocking)
- Lazy-load: don't connect to API until user opens the chat panel

### Browser Support
- Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- iOS Safari 14+, Android Chrome 90+

## Test Page (test.html)
Create a simple test page that:
- Loads the widget with mock configuration
- Has a fake landing page behind it (just enough content to test z-index / scrolling)
- Can switch between themes via buttons
- Shows console logs for debugging

For local testing without a live API, include a mock mode (`data-mock="true"`) that returns canned responses after a 500-1500ms delay. This lets us test the full UI flow without needing the VPS.

## What NOT to Build
- No analytics/tracking
- No user authentication
- No file upload
- No rich media (images, cards) in messages
- No typing-awareness from user side
- No sound effects
- No cookie consent (widget uses localStorage only, no cookies)
