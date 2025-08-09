# ClaudeBRO SDK - Telegram Mini App

A sophisticated Telegram Mini App that provides AI-powered business optimization consulting through the BroVerse Biz Mental Model™ (BBMM) framework, powered by Claude 3.5 Sonnet.

## 🌟 Features

- **AI Business Consultant**: Powered by Claude 3.5 Sonnet with real-time streaming
- **Four Flows Analysis**: Value Flow, Info Flow, Work Flow, and Cash Flow optimization
- **Telegram Integration**: Full mini app support with webhook integration
- **Real-time Communication**: WebSocket-based streaming for instant responses
- **Session Persistence**: Redis-backed conversation history
- **Pure Vanilla Stack**: No framework dependencies - just HTML, CSS, and JavaScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis server
- Telegram Bot Token (create via @BotFather)
- Anthropic API Key
- ngrok account (for Telegram integration)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd ClaudeBROSDK

# Install dependencies
npm install
cd server && npm install && cd ..

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your credentials
```

### Running Locally

```bash
# Start Redis
redis-server

# Run local development server
./scripts/local-test.sh

# Open in browser
open http://localhost:8082
```

### Telegram Integration

```bash
# Configure ngrok
npx ngrok config add-authtoken YOUR_AUTHTOKEN

# Start with Telegram webhook
./scripts/start-telegram-bot.sh

# Chat with bot
# Open Telegram and search for @cbosdkbot
```

## 📱 Architecture

### Tech Stack
- **Backend**: Node.js, Express, WebSocket
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Anthropic Claude 3.5 Sonnet API
- **Storage**: Redis for session management
- **Tunneling**: ngrok for public URL exposure

### Project Structure
```
ClaudeBROSDK/
├── server/              # Backend application
├── src/                 # Frontend application
├── scripts/             # Utility scripts
├── docker/              # Docker configuration
├── docs/                # Documentation
└── HANDOVER.md         # Complete handover documentation
```

## 🔧 Configuration

### Environment Variables

Create a `server/.env` file:

```env
# Anthropic API
ANTHROPIC_API_KEY=your_api_key_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
NGROK_AUTHTOKEN=your_ngrok_token

# Server
PORT=8082
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379
```

## 📚 Documentation

- [HANDOVER.md](./HANDOVER.md) - Complete project handover documentation
- [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) - Current deployment status
- [SPARC Implementation](./docs/SPARC-IMPLEMENTATION.md) - Technical implementation details
- [Architecture](./docs/architecture.md) - System architecture overview

## 🤖 Bot Commands

- `/start` - Initialize the bot
- `/help` - Show help information
- `/about` - About the CBO BRO
- `/status` - Check bot status

## 🔐 Security

- API keys stored in environment variables
- CORS configured for Telegram domains
- WebSocket origin validation
- Session timeout management

## 🚦 Status

Current Status: **🟢 Operational (Local)** | **⚠️ Telegram Integration (Needs ngrok token)**

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

## 📞 Support

For issues and questions:
- Check [HANDOVER.md](./HANDOVER.md) for detailed documentation
- Review [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) for current issues
- Open an issue on GitHub

---

**Built with ❤️ using Claude 3.5 Sonnet and pure vanilla JavaScript**