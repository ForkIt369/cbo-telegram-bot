# Dual Bot Deployment on DigitalOcean

## Overview
This guide explains how to deploy both the main CBO bot (@cbo_DEVbot) and the SDK bot (@cbosdkbot) on a single DigitalOcean App Platform instance without additional costs.

## Architecture

```
DigitalOcean App (Single Instance)
├── Main Bot (@cbo_DEVbot)
│   ├── Webhook: /webhook/main
│   ├── Mini App: / (root)
│   └── API: /api/*
├── SDK Bot (@cbosdkbot)
│   ├── Webhook: /webhook/sdk
│   ├── Mini App: /sdk/*
│   └── API: /sdk/api/*
└── Admin Panel: /admin/*
```

## Setup Steps

### 1. Create SDK Bot Token
1. Open [@BotFather](https://t.me/botfather) in Telegram
2. Create new bot: `/newbot`
3. Name it: `CBO SDK Bot`
4. Username: `cbosdkbot`
5. Save the token for later

### 2. Update DigitalOcean Environment Variables
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Select `cbo-demo-miniapp`
3. Go to Settings → Environment Variables
4. Add new variable:
   - Key: `SDK_BOT_TOKEN`
   - Value: (paste token from BotFather)
   - Type: Secret
   - Scope: Runtime

### 3. Deploy Combined Server

#### Option A: Manual Deployment
```bash
# Commit changes
git add .
git commit -m "Add dual bot support with combined server"
git push origin master
```

#### Option B: Update App Spec
1. Go to App Settings → App Spec
2. Replace with content from `.do/app-combined.yaml`
3. Click "Save" and "Deploy"

### 4. Configure Bot Webhooks
After deployment, the combined server will automatically:
- Set main bot webhook to: `https://cbo-mcp-system-hs2sx.ondigitalocean.app/webhook/main`
- Set SDK bot webhook to: `https://cbo-mcp-system-hs2sx.ondigitalocean.app/webhook/sdk`
- Configure mini app buttons for both bots

### 5. Test Both Bots
1. **Main Bot**: Open [@cbo_DEVbot](https://t.me/cbo_DEVbot)
   - Send `/start` 
   - Click menu button to open main mini app
   
2. **SDK Bot**: Open [@cbosdkbot](https://t.me/cbosdkbot)
   - Send `/start`
   - Click menu button to open SDK mini app

## Resource Usage

### Single Instance Limits
- **CPU**: 1 vCPU (shared between both bots)
- **RAM**: 1GB (sufficient for both Node.js processes)
- **Bandwidth**: 1TB/month (more than enough)
- **Build Minutes**: 400/month (shared)

### Performance Optimization
- Both bots share the same Express server
- Common dependencies loaded once
- Shared Claude AI handler reduces memory usage
- Static files served efficiently

## Alternative Approaches

### Option 2: Process Manager (PM2)
Use PM2 to manage multiple processes:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'main-bot',
      script: 'src/index.js',
      env: { BOT_TYPE: 'main' }
    },
    {
      name: 'sdk-bot',
      script: 'ClaudeBROSDK/server/index.js',
      env: { BOT_TYPE: 'sdk', PORT: 3004 }
    }
  ]
};
```

### Option 3: Docker Multi-Container (Requires Upgrade)
```yaml
# docker-compose.yml
services:
  main-bot:
    build: .
    ports: ["3003:3003"]
  sdk-bot:
    build: ./ClaudeBROSDK
    ports: ["3004:3004"]
```

## Monitoring

Check health status:
```bash
curl https://cbo-mcp-system-hs2sx.ondigitalocean.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-10T10:00:00.000Z",
  "bots": {
    "main": "active",
    "sdk": "active"
  }
}
```

## Troubleshooting

### Bot Not Responding
1. Check environment variables in DigitalOcean
2. View logs: App → Runtime Logs
3. Verify webhook URLs are accessible

### Mini App Not Loading
1. Check static file paths in combined server
2. Verify build process includes both apps
3. Check browser console for errors

### Memory Issues
If hitting memory limits:
1. Implement response caching
2. Reduce concurrent webhook processing
3. Consider upgrading to 2GB instance ($12/month)

## Cost Analysis

### Current Setup (No Additional Cost)
- **Plan**: Professional ($12/month)
- **Instance**: 1x apps-s-1vcpu-1gb
- **Both bots**: Run on same instance
- **Limitation**: Shared resources

### Upgrade Options
1. **More Memory**: apps-s-1vcpu-2gb ($24/month)
2. **More CPU**: apps-s-2vcpu-4gb ($48/month)
3. **Separate Apps**: 2x $12 = $24/month

## Deployment Script

Create `deploy-dual-bot.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying Dual Bot Setup..."

# Check for required tokens
if [ -z "$SDK_BOT_TOKEN" ]; then
  echo "❌ SDK_BOT_TOKEN not set"
  exit 1
fi

# Build both apps
echo "📦 Building apps..."
npm install
cd ClaudeBROSDK/server && npm install && cd ../..
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Deploy
echo "🚢 Pushing to master..."
git add .
git commit -m "Deploy dual bot setup"
git push origin master

echo "✅ Deployment initiated! Check DigitalOcean dashboard for status."
```

## Security Considerations

1. **Token Security**: Both bot tokens stored as secrets
2. **Webhook Validation**: Verify requests are from Telegram
3. **Rate Limiting**: Implement per-bot rate limits
4. **Error Isolation**: Catch errors to prevent one bot affecting the other

## Next Steps

1. Create SDK bot token from BotFather
2. Add `SDK_BOT_TOKEN` to DigitalOcean env vars
3. Deploy combined server
4. Test both bots
5. Monitor resource usage