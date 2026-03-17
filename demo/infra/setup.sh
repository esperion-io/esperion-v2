#!/usr/bin/env bash
# Esperion Demo VPS — Automated Setup Script
# Run as root on a fresh Ubuntu 24.04 server
# Usage: ssh root@<VPS_IP> 'bash -s' < setup.sh

set -euo pipefail

echo "=== Esperion Demo VPS Setup ==="
echo "Starting at $(date)"

# --- 1. System Updates ---
echo ">>> Updating system..."
apt update && apt upgrade -y
apt install -y curl wget git ufw fail2ban unattended-upgrades

# --- 2. Create openclaw user ---
echo ">>> Creating openclaw user..."
if ! id "openclaw" &>/dev/null; then
    adduser --disabled-password --gecos "OpenClaw Demo" openclaw
    usermod -aG sudo openclaw
    # Copy SSH keys from root
    mkdir -p /home/openclaw/.ssh
    cp /root/.ssh/authorized_keys /home/openclaw/.ssh/
    chown -R openclaw:openclaw /home/openclaw/.ssh
    chmod 700 /home/openclaw/.ssh
    chmod 600 /home/openclaw/.ssh/authorized_keys
fi

# --- 3. SSH Hardening ---
echo ">>> Hardening SSH..."
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# --- 4. Firewall ---
echo ">>> Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# --- 5. Install Node.js 22 ---
echo ">>> Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# --- 6. Install OpenClaw ---
echo ">>> Installing OpenClaw..."
npm install -g openclaw
echo "OpenClaw version: $(openclaw --version)"

# --- 7. Install Caddy ---
echo ">>> Installing Caddy..."
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

# --- 8. Create directory structure ---
echo ">>> Creating directory structure..."
mkdir -p /home/openclaw/.openclaw/workspace/agents/{mike,bayview,pacific,studymate}
mkdir -p /var/www/widget
mkdir -p /var/log/caddy
chown -R openclaw:openclaw /home/openclaw/.openclaw
chown -R openclaw:openclaw /var/www/widget

# --- 9. Create .env file (placeholder — edit with actual API key) ---
echo ">>> Creating environment file..."
cat > /home/openclaw/.openclaw/.env << 'EOF'
# OpenRouter API Key — replace with actual key
OPENROUTER_API_KEY=sk-or-REPLACE-ME

# OpenClaw Gateway Auth Token — used by the chat widget to authenticate
# Generate with: openssl rand -hex 32
OPENCLAW_AUTH_TOKEN=REPLACE-ME
EOF
chown openclaw:openclaw /home/openclaw/.openclaw/.env
chmod 600 /home/openclaw/.openclaw/.env

# --- 10. Enable automatic security updates ---
echo ">>> Enabling unattended upgrades..."
dpkg-reconfigure -plow unattended-upgrades

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit /home/openclaw/.openclaw/.env — set OPENROUTER_API_KEY"
echo "2. SCP openclaw.json to /home/openclaw/.openclaw/openclaw.json"
echo "3. SCP agent SOUL.md files to /home/openclaw/.openclaw/workspace/agents/<name>/SOUL.md"
echo "4. SCP Caddyfile to /etc/caddy/Caddyfile"
echo "5. SCP openclaw-demo.service to /etc/systemd/system/"
echo "6. SCP widget files to /var/www/widget/"
echo "7. Run: systemctl daemon-reload && systemctl enable --now openclaw-demo"
echo "8. Run: systemctl restart caddy"
echo "9. Test: curl https://demo.esperion.io/health"
echo ""
echo "Done at $(date)"
