# 🚀 CBO Bot Deployment Guide

## Current Status: Running Locally
- Bot works but only when your computer is on
- Stops when you close terminal or shut down
- Not accessible 24/7

## Option 1: DigitalOcean App Platform (Recommended)
**Cost**: $5-12/month | **Difficulty**: Easy | **Time**: 15 minutes

### Steps:
1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial CBO bot"
   git remote add origin https://github.com/YOUR_USERNAME/cbo-telegram-bot.git
   git push -u origin main
   ```

2. **Create DigitalOcean App**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect GitHub repo
   - Auto-detect Node.js app

3. **Configure Environment Variables**
   In DigitalOcean dashboard, add:
   - `TELEGRAM_BOT_TOKEN` = your token
   - `ANTHROPIC_API_KEY` = your key
   - `NODE_ENV` = production
   - `WEBHOOK_URL` = (will be provided after deploy)

4. **Deploy**
   - Click "Deploy"
   - Get your app URL: `https://cbo-bot-xxxxx.ondigitalocean.app`
   - Update WEBHOOK_URL with this URL

## Option 2: DigitalOcean Droplet (More Control)
**Cost**: $6/month | **Difficulty**: Medium | **Time**: 30 minutes

### Quick Setup Script:
```bash
#!/bin/bash
# Save as setup.sh and run on new droplet

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone your repo
git clone https://github.com/YOUR_USERNAME/cbo-telegram-bot.git
cd cbo-telegram-bot

# Install dependencies
npm install

# Create .env file
cat > .env << EOL
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3000
NODE_ENV=production
EOL

# Start with PM2
pm2 start src/index.js --name cbo-bot
pm2 save
pm2 startup
```

## Option 3: Quick Deploy with DigitalOcean CLI

### Using DO CLI:
```bash
# Install DO CLI
brew install doctl

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec app.yaml

# List apps
doctl apps list

# Get app URL
doctl apps get YOUR_APP_ID
```

## 🔧 Post-Deployment Setup

### 1. Set Webhook (Production Only)
```bash
curl -X POST "https://api.telegram.org/bot8139049417:AAEfmoNXmUhz4y842SdtKL8SjPwgYzIXDNI/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.ondigitalocean.app/telegram-webhook"}'
```

### 2. Verify Deployment
```bash
# Check bot status
curl https://your-app.ondigitalocean.app/health

# Check Telegram webhook
curl https://api.telegram.org/bot8139049417:AAEfmoNXmUhz4y842SdtKL8SjPwgYzIXDNI/getWebhookInfo
```

## 📊 Monitoring

### DigitalOcean Dashboard shows:
- CPU/Memory usage
- Request logs
- Error tracking
- Deployment history

### Add monitoring endpoint:
```javascript
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeUsers: conversations.size
  });
});
```

## 🎯 Quick Decision Guide

| Need | Choose |
|------|--------|
| Easiest setup | App Platform |
| Lowest cost | Droplet ($6/mo) |
| Auto-scaling | App Platform |
| Full control | Droplet |
| Multiple bots | Kubernetes |

## 🚨 Important Security Notes

1. **Never commit .env file** - Use environment variables
2. **Set up alerts** for high usage
3. **Enable backups** in DigitalOcean
4. **Use webhook in production** (not polling)

## Ready to Deploy?

1. Choose your method above
2. Follow the steps
3. Your bot will be live 24/7!

Need help? The bot is already working locally, so deployment is just moving it to the cloud!