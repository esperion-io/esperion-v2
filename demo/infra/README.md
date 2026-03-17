# Esperion Demo VPS — Infrastructure

## Architecture
Dedicated VPS running OpenClaw with demo agents. Completely isolated from Ace's Mac Mini.

```
Esperion Sites (Vercel) → HTTPS → Caddy (VPS) → OpenClaw Gateway → Kimi K2.5 (OpenRouter)
```

## Files

| File | Purpose | Deploys to |
|------|---------|------------|
| `openclaw.json` | OpenClaw config (agents, models, CORS) | `/home/openclaw/.openclaw/openclaw.json` |
| `Caddyfile` | Reverse proxy + SSL + static files | `/etc/caddy/Caddyfile` |
| `openclaw-demo.service` | systemd service for OpenClaw | `/etc/systemd/system/openclaw-demo.service` |
| `setup.sh` | Automated server bootstrap | Run once on fresh Ubuntu 24.04 |

## Quick Deploy (after initial setup)

```bash
# From local machine, in the esperion repo root:
VPS=demo.esperion.io

# Deploy agent personas
scp demo/agents/mike/SOUL.md openclaw@$VPS:~/.openclaw/workspace/agents/mike/
scp demo/agents/bayview/SOUL.md openclaw@$VPS:~/.openclaw/workspace/agents/bayview/

# Deploy config
scp demo/infra/openclaw.json openclaw@$VPS:~/.openclaw/openclaw.json

# Deploy widget
scp demo/widget/* openclaw@$VPS:/var/www/widget/ 2>/dev/null || true

# Restart OpenClaw to pick up changes
ssh openclaw@$VPS "sudo systemctl restart openclaw-demo"
```

## Monitoring

```bash
# Check OpenClaw status
ssh openclaw@$VPS "openclaw status"

# View logs
ssh openclaw@$VPS "journalctl -u openclaw-demo -f"

# Check Caddy
ssh openclaw@$VPS "systemctl status caddy"
```
