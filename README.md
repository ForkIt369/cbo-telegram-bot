# CBO Telegram Bot

A Telegram bot for business optimization consulting powered by Claude Sonnet 4 and the BroVerse Biz Mental Model™ (BBMM).

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
```

**Status**: ✅ Live in production on DigitalOcean

## 🤖 What It Does

The CBO Bot helps businesses optimize through Four Flows analysis:
- 💰 **Value Flow** - Revenue and pricing optimization
- 📊 **Info Flow** - Data and communication systems
- ⚙️ **Work Flow** - Process efficiency
- 💵 **Cash Flow** - Financial health monitoring

## 📱 Features

- **Telegram Bot** - Natural conversation interface
- **Mini App** - Beautiful web UI within Telegram
- **AI Analysis** - Powered by Claude Sonnet 4
- **Memory System** - Remembers context across sessions
- **Access Control** - Whitelist-based security

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
├── src/              # Core bot application
├── agents/           # CBO business logic
├── mini-app/         # Telegram Mini App
├── config/           # Configuration files
├── docs/             # Documentation
└── experimental/     # Optional features
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Test thoroughly
4. Submit pull request

## 📄 License

Private repository - All rights reserved

---

**Need help?** Check the [documentation](docs/) or open an issue.