# CBO Telegram Bot

A Telegram bot interface for the Chief Business Optimization (CBO) agent using the BroVerse Biz Mental Model™ (BBMM).

## Features

- 🤖 Telegram bot interface for business optimization queries
- 📊 Four Flows analysis (Value, Info, Work, Cash)
- 💡 Pattern recognition and recommendations
- 🚀 Scalable architecture ready for DigitalOcean deployment

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Run locally:
```bash
npm run dev
```

## Deployment Options

### Option 1: DigitalOcean App Platform (Recommended)

1. Push code to GitHub
2. Create new app in DigitalOcean App Platform
3. Connect GitHub repository
4. Set environment variables in app settings
5. Deploy!

Cost: ~$5-12/month

### Option 2: DigitalOcean Droplet

1. Create Ubuntu droplet ($6/month)
2. Install Node.js 18+
3. Clone repository
4. Install PM2: `npm install -g pm2`
5. Start bot: `pm2 start src/index.js --name cbo-bot`
6. Setup Nginx reverse proxy
7. Configure SSL with Let's Encrypt

### Option 3: Docker on Droplet

```bash
# Build image
docker build -t cbo-bot .

# Run container
docker run -d \
  --name cbo-bot \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  cbo-bot
```

## Bot Commands

- `/start` - Welcome message
- `/help` - Show available commands
- `/status` - Check bot status
- `/clear` - Clear conversation context

## Architecture

```
src/
├── index.js              # Main bot entry point
├── handlers/
│   └── cboAgentHandler.js # CBO agent integration
└── utils/
    └── logger.js         # Logging utility

agents/
└── cbo-agent.js         # CBO business logic
```

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `WEBHOOK_URL` - Full webhook URL (production only)
- `CBO_AGENT_PATH` - Path to CBO agent module

## Next Steps

1. Enhance CBO agent with more sophisticated analysis
2. Add database for conversation persistence
3. Implement user authentication
4. Add analytics and monitoring
5. Create admin interface