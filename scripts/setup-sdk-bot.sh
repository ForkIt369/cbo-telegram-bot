#!/bin/bash

echo "🤖 SDK Bot Setup Helper"
echo "========================"
echo ""
echo "This script will help you configure the SDK bot (@cbosdkbot)"
echo ""

# Check if we have main bot token
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "⚠️  Main bot token not found in environment"
fi

echo "📝 Step 1: Create the SDK Bot Token"
echo "------------------------------------"
echo "1. Open Telegram and go to @BotFather"
echo "2. Send: /newbot"
echo "3. Name it: CBO SDK Bot"
echo "4. Username: cbosdkbot"
echo "5. Copy the token that BotFather gives you"
echo ""
read -p "Paste the SDK bot token here: " SDK_TOKEN

if [ -z "$SDK_TOKEN" ]; then
  echo "❌ No token provided. Exiting."
  exit 1
fi

echo ""
echo "✅ Token received!"
echo ""

# Update local .env file
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
  # Check if SDK_BOT_TOKEN already exists
  if grep -q "SDK_BOT_TOKEN=" "$ENV_FILE"; then
    # Update existing
    sed -i.bak "s/SDK_BOT_TOKEN=.*/SDK_BOT_TOKEN=$SDK_TOKEN/" "$ENV_FILE"
    echo "✅ Updated SDK_BOT_TOKEN in .env"
  else
    # Add new
    echo "SDK_BOT_TOKEN=$SDK_TOKEN" >> "$ENV_FILE"
    echo "✅ Added SDK_BOT_TOKEN to .env"
  fi
else
  # Create new .env
  echo "SDK_BOT_TOKEN=$SDK_TOKEN" > "$ENV_FILE"
  echo "✅ Created .env with SDK_BOT_TOKEN"
fi

echo ""
echo "📱 Step 2: Configure DigitalOcean"
echo "----------------------------------"
echo "Now you need to add this token to DigitalOcean:"
echo ""
echo "1. Go to: https://cloud.digitalocean.com/apps/253bebd7-497f-4efe-a7f0-bacbe71413ef/settings"
echo "2. Click on 'Environment Variables'"
echo "3. Add a new variable:"
echo "   - Key: SDK_BOT_TOKEN"
echo "   - Value: $SDK_TOKEN"
echo "   - Type: Secret"
echo "   - Scope: Runtime"
echo "4. Also add MAIN_BOT_TOKEN with the same value as TELEGRAM_BOT_TOKEN"
echo "5. Click 'Save'"
echo ""
read -p "Press Enter when you've added the token to DigitalOcean..."

echo ""
echo "🚀 Step 3: Update App Configuration"
echo "------------------------------------"
echo "1. Go to: https://cloud.digitalocean.com/apps/253bebd7-497f-4efe-a7f0-bacbe71413ef/settings"
echo "2. Click on 'App Spec' tab"
echo "3. Click 'Edit'"
echo "4. Update the run_command to: node src/combined-server.js"
echo "5. Update the build_command to: npm install && cd ClaudeBROSDK/server && npm install && cd ../.. && npm run build"
echo "6. Click 'Save' and 'Deploy'"
echo ""
echo "OR run: ./deploy-combined.sh (if available)"
echo ""
read -p "Press Enter when deployment has started..."

echo ""
echo "🧪 Step 4: Test Both Bots"
echo "-------------------------"
echo "After deployment completes (3-5 minutes):"
echo ""
echo "Main Bot: https://t.me/cbo_DEVbot"
echo "SDK Bot: https://t.me/cbosdkbot"
echo ""
echo "Try sending /start to both bots!"
echo ""
echo "✅ Setup complete! Monitor deployment at:"
echo "https://cloud.digitalocean.com/apps/253bebd7-497f-4efe-a7f0-bacbe71413ef"