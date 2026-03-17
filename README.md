# Esperion — AI Implementation Agency

AI-powered business assistants for NZ SMBs. Setup + ongoing maintenance model.

## Folder Structure

```
esperion/
├── CLAUDE.md                   # Full project context for Claude Code
├── plans/                      # Business plans & strategy docs
│   ├── business-plan-v*.md     # Current active plan (highest version)
│   ├── v*-changes-summary.md   # Changelogs
│   └── archive/                # Previous plan versions
├── sites/                      # Landing pages per vertical
│   ├── aifortrades/            # Trades & Home Services
│   ├── aitools/          # General business
│   ├── aiforrealestate/        # Real estate
│   └── aiforstudents/          # Students & educators
├── docs/                       # Specs, assets, brand guidelines
└── README.md
```

## Verticals

| Vertical | Site | Domain (pending) |
|----------|------|-------------------|
| Trades/Home Services | `sites/aifortrades/` | trade.aitools.co.nz |
| General Business | `sites/aitools/` | aitools.co.nz |
| Real Estate | `sites/aiforrealestate/` | realestate.aitools.co.nz |
| Students & Educators | `sites/aiforstudents/` | student.aitools.co.nz |

## Tech Stack

- **AI Delivery:** OpenClaw + Vapi (voice AI)
- **Sites:** Static HTML, Tailwind CDN, single index.html per vertical
- **Hosting:** TBD (Cloudflare Pages / Vercel / manual)
