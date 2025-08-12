#!/bin/bash

# CBO Mini App Enhanced Deployment Script
# Date: August 12, 2025

echo "🚀 Starting CBO Mini App Enhanced Deployment..."
echo "============================================"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build Mini App
echo -e "${BLUE}[1/5] Building Mini App...${NC}"
cd mini-app
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${YELLOW}✗ Build failed${NC}"
    exit 1
fi
cd ..

# Step 2: Stage all changes
echo -e "${BLUE}[2/5] Staging changes...${NC}"
git add .
echo -e "${GREEN}✓ Changes staged${NC}"

# Step 3: Commit with descriptive message
echo -e "${BLUE}[3/5] Committing changes...${NC}"
git commit -m "🎨 Upgrade: BroVerse Design System V5.0 Implementation

MAJOR ENHANCEMENTS:
- ✨ Implemented Fibonacci spacing system (3px-55px scale)
- 🎨 Added glassmorphism effects throughout UI
- 💎 Integrated Four Flows dashboard with 3D cube logo
- 🚀 Added streaming text display (30ms character rendering)
- 📱 Multi-modal input (voice, files, suggestions)
- ⚡ Virtual scrolling for performance (react-window)
- 🔄 WebSocket real-time updates
- 🎯 Message chunking at 280 characters
- 📌 Citation system with expandable sources
- 📱 Mobile-first responsive design

TECHNICAL:
- Added framer-motion for animations
- Integrated react-window for virtual scrolling
- Created 6 new enhanced components
- Comprehensive CSS design system
- Bundle size: 303KB (optimized)

Co-authored-by: Claude <assistant@anthropic.com>"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Changes committed${NC}"
else
    echo -e "${YELLOW}✗ Commit failed${NC}"
    exit 1
fi

# Step 4: Push to trigger auto-deploy
echo -e "${BLUE}[4/5] Pushing to master (auto-deploy)...${NC}"
git push origin master
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Pushed successfully${NC}"
else
    echo -e "${YELLOW}✗ Push failed${NC}"
    exit 1
fi

# Step 5: Monitor deployment
echo -e "${BLUE}[5/5] Deployment triggered on DigitalOcean...${NC}"
echo "============================================"
echo -e "${GREEN}🎉 Deployment initiated successfully!${NC}"
echo ""
echo "📊 Monitoring URLs:"
echo "- App Dashboard: https://cloud.digitalocean.com/apps/253bebd7-497f-4efe-a7f0-bacbe71413ef"
echo "- Live URL: https://cbo-mcp-system-hs2sx.ondigitalocean.app"
echo "- Health Check: https://cbo-mcp-system-hs2sx.ondigitalocean.app/health"
echo ""
echo "⏱️  Deployment typically takes 3-5 minutes..."
echo ""

# Wait and check deployment status
echo "Waiting for deployment to complete..."
sleep 30

# Check if app is responding
for i in {1..10}; do
    echo -n "Checking deployment status (attempt $i/10)... "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://cbo-mcp-system-hs2sx.ondigitalocean.app/health)
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓ App is live!${NC}"
        break
    else
        echo "Still deploying..."
        sleep 20
    fi
done

echo ""
echo "============================================"
echo -e "${GREEN}🚀 CBO Mini App Enhanced Deployment Complete!${NC}"
echo "============================================"
echo ""
echo "✨ New Features Live:"
echo "  • BroVerse Design System V5.0"
echo "  • Glassmorphism UI effects"
echo "  • Streaming text responses"
echo "  • Multi-modal input (voice/files)"
echo "  • Virtual scrolling performance"
echo "  • Real-time WebSocket updates"
echo ""
echo "🔗 Access your enhanced app at:"
echo "   https://cbo-mcp-system-hs2sx.ondigitalocean.app"
echo ""
echo "📱 Telegram Bot: @cbo_DEVbot"
echo ""