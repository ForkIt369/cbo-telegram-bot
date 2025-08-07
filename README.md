# CBO Telegram Bot & Mini App

A sophisticated Telegram bot and mini-app for business optimization consulting powered by Claude Sonnet 4 and the BroVerse Biz Mental Model™ (BBMM).

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/ForkIt369/cbo-telegram-bot.git
cd cbo-telegram-bot
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your tokens

# 3. Run locally
npm run dev

# 4. Build mini-app
cd mini-app && npm install && npm run build
```

**Status**: ✅ Live in production
- **Bot**: Active on Telegram [@YourBotName]
- **Mini App**: https://cbo-mcp-system-hs2sx.ondigitalocean.app

## 🎯 What It Does

CBO-Bro (the green cube character with glasses) helps businesses optimize through Four Flows analysis:
- 💎 **Value Flow** - Customer delivery & revenue optimization
- 📊 **Info Flow** - Data systems & decision-making
- ⚡ **Work Flow** - Operations & process efficiency
- 💰 **Cash Flow** - Financial health & liquidity

## 📱 Features

### Telegram Bot
- **Natural Language Interface** - Chat naturally about business challenges
- **Context Memory** - Maintains conversation history across sessions
- **Flow Analysis** - Identifies which of the 4 flows needs attention
- **Access Control** - Whitelist-based security system
- **Admin Commands** - User management capabilities

### Mini App (New!)
- **Modern UI** - Polished glassmorphic design with CBO brand colors
- **CBO Character** - Features the iconic green cube avatar with glasses
- **Mobile-First** - Optimized for Telegram's in-app browser
- **Quick Actions** - Pre-defined prompts for common business challenges
- **Flow Indicators** - Visual feedback showing which flow is being analyzed
- **Coming Soon** - Voice input, file uploads, and analytics dashboard

## 🛠️ Configuration

Required environment variables:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
ANTHROPIC_API_KEY=your_claude_api_key
PORT=3003
NODE_ENV=production
WEBHOOK_URL=https://your-app.ondigitalocean.app
```

## 📚 Documentation

- **[Setup Guide](docs/setup/quick-start.md)** - Detailed setup instructions
- **[Deployment](docs/deployment/)** - Production deployment guides
- **[Architecture](docs/development/architecture-overview.md)** - Technical details
- **[All Docs](docs/)** - Complete documentation

## 🚢 Deployment

The bot is configured for DigitalOcean App Platform:

1. Push to GitHub
2. Connect to DigitalOcean
3. Deploy automatically

Configuration: `.do/app.yaml`

## 📝 Bot Commands

**User Commands:**
- `/start` - Begin conversation
- `/help` - Show commands
- `/status` - Check bot health
- `/clear` - Reset context

**Admin Commands:**
- `/whitelist` - View authorized users
- `/adduser` - Grant access
- `/removeuser` - Revoke access

## 🏗️ Project Structure

```
├── src/                 # Core bot application
│   ├── index.js        # Main bot entry point & Express server
│   ├── handlers/       # Message & command handlers
│   └── memory/         # Conversation persistence
├── agents/             # CBO business logic
│   └── cbo-agent.js   # Claude Sonnet 4 integration
├── mini-app/           # Telegram Mini App (React + Vite)
│   ├── src/           # React components
│   ├── public/        # Static assets (CBO character PNG)
│   └── dist/          # Production build
├── config/            # Configuration files
├── docs/              # Documentation
└── demos/             # Demo implementations
```

## 🎨 Design System

The app uses the **CBO Brand Design System**:
- **Primary Color**: #30D158 (Fresh Green)
- **Secondary Color**: #00C851 (Deep Green)
- **Dark Theme**: #0D1117 background
- **Character**: Green cube with glasses (cbo-character.png)
- **Typography**: Inter, SF Pro Display
- **Effects**: Glassmorphism, subtle animations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Test thoroughly
4. Submit pull request

## 📄 License

Private repository - All rights reserved

---

**Need help?** Check the [documentation](docs/) or open an issue.