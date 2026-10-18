#!/usr/bin/env bash
# Spot-Undoo: Automated Ollama LLM Deployment Script for DigitalOcean Droplets
# Designed for Hacktoberfest DigitalOcean credits / GPU & CPU Droplets

set -euo pipefail

echo "=========================================================="
echo "🌴 Spot-Undoo Ollama Cloud Node Setup (DigitalOcean)"
echo "=========================================================="

# 1. Update OS packages
echo "📦 Updating base system..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl ufw htop git jq

# 2. Configure Firewall (allow SSH, HTTP, HTTPS, and Ollama port 11434 if opened)
echo "🛡️ Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 11434/tcp
sudo ufw --force enable

# 3. Install Ollama standalone binary
echo "🦙 Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# 4. Configure Ollama systemd service to listen on 0.0.0.0 and accept CORS
echo "⚙️ Configuring Ollama service with open host & CORS for mobile/web app..."
sudo mkdir -p /etc/systemd/system/ollama.service.d
cat << 'EOF' | sudo tee /etc/systemd/system/ollama.service.d/override.conf
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
Environment="OLLAMA_KEEP_ALIVE=24h"
EOF

sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl restart ollama

echo "⏳ Waiting for Ollama to start..."
sleep 4

# 5. Pull lightweight models optimized for mobile/cloud inference
echo "📥 Pulling optimized models for Spot-Undoo..."
ollama pull qwen2.5:3b

# 6. Verify health
echo "🔍 Verifying running models..."
curl -s http://localhost:11434/api/tags | jq .

PUBLIC_IP=$(curl -s https://ifconfig.me || echo "YOUR_DROPLET_IP")

echo ""
echo "=========================================================="
echo "✅ Ollama Cloud Node is LIVE!"
echo "Droplet Public Endpoint: http://${PUBLIC_IP}:11434"
echo "Test with: curl http://${PUBLIC_IP}:11434/api/tags"
echo "To use in Spot-Undoo Mobile/Web: Set Ollama URL in Settings to http://${PUBLIC_IP}:11434"
echo "=========================================================="
