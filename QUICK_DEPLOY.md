# 🚀 Quick Deploy CBO Bot to DigitalOcean

## Current Status
- ✅ Bot working locally
- ✅ Real users actively using it
- ❌ Only available when your computer is on

## Fastest Deploy Method

### 1. Push to GitHub (5 min)
```bash
# Create repo first on GitHub.com, then:
git add .
git commit -m "CBO Bot with Claude Sonnet 4"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cbo-telegram-bot.git
git push -u origin main
```

### 2. Deploy via DigitalOcean Dashboard (5 min)
1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Choose **GitHub** → Select your repo
4. App Platform auto-detects Node.js
5. **Important**: Set environment variables:
   - `TELEGRAM_BOT_TOKEN` = `your_telegram_bot_token_here`
   - `ANTHROPIC_API_KEY` = `your_anthropic_api_key_here`
   - `NODE_ENV` = `production`
   - `PORT` = `3000`

6. Choose **Professional XS** plan ($12/mo) or **Starter** ($0 for 3 static sites + $5/mo per app)
7. **Deploy!**

### 3. Update Bot Webhook (2 min)
Once deployed, get your app URL (like `https://cbo-bot-xxxxx.ondigitalocean.app`), then:

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://cbo-bot-xxxxx.ondigitalocean.app/telegram-webhook"}'
```

## Alternative: Use Existing App

Update your existing `cbo-chat-telegram` app:
```bash
doctl apps update 5842af31-ff02-44f0-a59a-359e53aab8fc --spec app.yaml
```

## Cost Comparison

| Option | Cost | Pros |
|--------|------|------|
| App Platform Starter | $5/mo | Easy, auto-SSL |
| App Platform Pro XS | $12/mo | Better performance |
| Droplet | $6/mo | Full control |
| Your computer | $0 | Not 24/7 |

## 🎯 Your bot will be:
- Running 24/7
- Auto-restarting on crashes  
- Accessible worldwide
- Professionally hosted

Ready to go live? The bot is already handling real conversations - it just needs a permanent home!