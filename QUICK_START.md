# 🚀 CBO Bot Quick Start Guide

## Your CBO-Bro is Ready!

```
     🤖 CBO-BRO
   ┌─────────────┐
   │ ■     ■     │  <- Green cube head with glasses
   │      ___    │
   └─────────────┘
         │├─┤│      <- Black suit with orange tie
     📱──┤   ├──    <- Holding phone with charts
         │   │
        💵 💵 💵    <- Standing on money
```

## 🎯 Deploy in 3 Steps

### 1. Add Your Avatar
```bash
# Save your green business robot image as:
mini-app/public/cbo-avatar.png

# Or run:
./setup-avatar.sh
```

### 2. Configure Environment
```bash
# Copy and edit environment file
cp .env.example .env

# Add your keys:
# - TELEGRAM_BOT_TOKEN (from @BotFather)
# - ANTHROPIC_API_KEY (from Claude)
```

### 3. Deploy to DigitalOcean
```bash
# Run the deployment script
./deploy.sh

# This will:
# ✅ Install all dependencies
# ✅ Build the Mini App
# ✅ Push to GitHub
# ✅ Trigger DigitalOcean deployment
```

## 📱 Setup Mini App Button

After deployment:
1. Open @BotFather in Telegram
2. Select your bot → Bot Settings → Menu Button
3. Set URL: `https://your-app.ondigitalocean.app`

## 🎨 What You Get

### Bot Interface
- Text commands in Telegram chat
- Quick responses
- Business optimization advice

### Mini App (NEW!)
- Beautiful chat interface
- Your CBO-Bro avatar everywhere
- Animated flow indicators
- Smooth user experience

## 🛠️ Local Development

```bash
# Run everything locally
npm run dev:all

# Bot runs on: http://localhost:3000
# Mini App runs on: http://localhost:3002
```

## 📊 Test Your Deployment

```bash
# Check bot health
curl https://your-app.ondigitalocean.app/health

# Check Mini App
curl https://your-app.ondigitalocean.app/
```

## 🆘 Need Help?

1. **Avatar not showing?**
   - Make sure image is at `mini-app/public/cbo-avatar.png`
   - Run `npm run build` again

2. **Deployment failed?**
   - Check DigitalOcean build logs
   - Ensure all environment variables are set

3. **Mini App not loading?**
   - Clear browser cache
   - Check console for errors

## 🎉 Success!

Your CBO-Bro is now live with:
- ✅ Telegram bot functionality
- ✅ Beautiful Mini App interface
- ✅ Your custom avatar
- ✅ No extra hosting costs!

Ready to optimize some businesses! 💼📈