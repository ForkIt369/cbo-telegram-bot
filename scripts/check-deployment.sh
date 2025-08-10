#!/bin/bash

echo "🔍 Checking Dual Bot Deployment Status"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Deployment Dashboard:${NC}"
echo "https://cloud.digitalocean.com/apps/253bebd7-497f-4efe-a7f0-bacbe71413ef"
echo ""

echo -e "${BLUE}🌐 Live URLs:${NC}"
echo "Main App: https://cbo-mcp-system-hs2sx.ondigitalocean.app"
echo "SDK App: https://cbo-mcp-system-hs2sx.ondigitalocean.app/sdk"
echo ""

echo -e "${BLUE}🤖 Telegram Bots:${NC}"
echo "Main Bot: https://t.me/cbo_DEVbot (@cbo_DEVbot)"
echo "SDK Bot: https://t.me/cbosdkbot (@cbosdkbot)"
echo ""

echo -e "${YELLOW}⏱️  Testing Health Endpoint...${NC}"
curl -s https://cbo-mcp-system-hs2sx.ondigitalocean.app/health 2>/dev/null | python3 -m json.tool 2>/dev/null

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Health check passed!${NC}"
else
  echo -e "${YELLOW}⚠️  Service may still be deploying...${NC}"
fi

echo ""
echo -e "${BLUE}📝 Quick Test Commands:${NC}"
echo "1. Test main bot: Send /start to @cbo_DEVbot"
echo "2. Test SDK bot: Send /start to @cbosdkbot"
echo "3. Open main mini-app: Click menu button in @cbo_DEVbot"
echo "4. Open SDK mini-app: Click menu button in @cbosdkbot"
echo ""

echo -e "${BLUE}🔧 Troubleshooting:${NC}"
echo "• If bots don't respond, wait 2-3 minutes for deployment"
echo "• Check logs at: https://cloud.digitalocean.com/apps/253bebd7-497f-4efe-a7f0-bacbe71413ef/runtime-logs"
echo "• Verify webhooks are set correctly"
echo ""

echo "Deployment usually takes 3-5 minutes. Current time: $(date '+%H:%M:%S')"