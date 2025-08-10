#!/bin/bash

echo "🚀 Deploying Combined Bot Server"
echo "================================="
echo ""

# Check for SDK token
if [ -f .env ]; then
  source .env
fi

if [ -z "$SDK_BOT_TOKEN" ]; then
  echo "⚠️  WARNING: SDK_BOT_TOKEN not found in .env"
  echo "The SDK bot won't work without it."
  read -p "Continue anyway? (y/n): " CONTINUE
  if [ "$CONTINUE" != "y" ]; then
    echo "Run ./scripts/setup-sdk-bot.sh first"
    exit 1
  fi
fi

echo "📦 Building mini-apps..."
npm run build

echo ""
echo "📝 Updating app configuration..."
echo "The deployment will:"
echo "  - Run both bots on single instance"
echo "  - Main bot at: /"
echo "  - SDK bot at: /sdk"
echo ""

# Create a temporary app spec update
cat > /tmp/app-spec-update.yaml << 'EOF'
name: cbo-demo-miniapp
region: nyc
services:
- environment_slug: node-js
  github:
    branch: master
    deploy_on_push: true
    repo: ForkIt369/cbo-telegram-bot
  # Build both apps
  build_command: npm install && cd ClaudeBROSDK/server && npm install && cd ../.. && npm run build
  # Run combined server
  run_command: node src/combined-server.js
  http_port: 3003
  instance_count: 1
  instance_size_slug: apps-s-1vcpu-1gb
  name: telegram-bot
  health_check:
    http_path: /health
    initial_delay_seconds: 10
    period_seconds: 30
    timeout_seconds: 5
    success_threshold: 1
    failure_threshold: 3
alerts:
- rule: DEPLOYMENT_FAILED
- rule: DOMAIN_FAILED
ingress:
  rules:
  - match:
      path:
        prefix: /
    component:
      name: telegram-bot
features:
- buildpack-stack=ubuntu-22
EOF

echo ""
echo "📤 Committing and pushing changes..."
git add -A
git commit -m "Deploy combined bot server with dual bot support" || true
git push origin master

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📊 Monitor deployment at:"
echo "https://cloud.digitalocean.com/apps/253bebd7-497f-4efe-a7f0-bacbe71413ef"
echo ""
echo "⏱️  Deployment usually takes 3-5 minutes"
echo ""
echo "🧪 After deployment, test both bots:"
echo "  Main: https://t.me/cbo_DEVbot"
echo "  SDK: https://t.me/cbosdkbot"
echo ""
echo "📝 IMPORTANT REMINDERS:"
echo "1. Add SDK_BOT_TOKEN to DigitalOcean env vars"
echo "2. Add MAIN_BOT_TOKEN (copy of TELEGRAM_BOT_TOKEN)"
echo "3. Update run_command in DO to: node src/combined-server.js"