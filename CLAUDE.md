# CLAUDE.md — Esperion Project Context

## Project
Esperion is an AI agency selling AI receptionist/assistant solutions to NZ businesses. This repo contains the landing sites and demo infrastructure.

## Repo Structure
- `sites/` — Vercel-hosted landing pages (static HTML/CSS/JS)
- `demo/widget/` — Chat widget JS served from VPS
- `demo/agents/` — Agent persona files (SOUL.md, knowledge bases)
- `demo/infra/` — VPS config (OpenClaw, Caddy, systemd)
- `plans/` — Project plans and specs

## Key File
- `demo/widget/esperion-inline-chat.js` — THE live widget. Self-contained vanilla JS (zero deps). Embeds an inline chat panel into a page section. Connects to OpenClaw Gateway via WebSocket.

## Tech Stack
- Vanilla JS (ES2020+), zero dependencies, no build step
- All CSS injected via JS (scoped with `.eci-` prefix)
- WebSocket connection to OpenClaw Gateway
- Served as static JS from Caddy on VPS

## Code Style
- Self-contained IIFE
- Scoped CSS prefix: `.eci-` (Esperion Chat Inline)
- No external CSS files — all styles in the JS file
- Clean, readable, well-commented
- Mobile-first responsive design
