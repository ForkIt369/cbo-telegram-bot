# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start bot in development mode with auto-reload (nodemon)
- `npm start` - Start bot in production mode
- `npm test` - Run Jest test suite
- `npm run build` - Build entire project including mini-app

### Mini App Development
```bash
cd mini-app
npm install        # Install dependencies
npm run dev        # Start development server on port 3002
npm run build      # Build for production to dist/
```

### Deployment
```bash
./deploy.sh        # Automated deployment script
# OR manually:
git add .
git commit -m "Your commit message"
git push origin master  # Triggers auto-deploy to DigitalOcean
```

### Environment Setup
- Copy `.env.example` to `.env` and configure required variables
- Required: `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`
- Optional: `PORT` (default: 3000), `NODE_ENV`, `WEBHOOK_URL`

## File Structure & Key Locations

### Bot Core Files
```
/src/
├── index.js                    # Main bot entry point, Express server
├── handlers/
│   └── cboAgentHandler.js     # Conversation management, context handling
├── memory/
│   └── memoryBank.js          # File-based storage for conversations
└── utils/
    └── logger.js              # Winston logging configuration
```

### AI Agent
```
/agents/
└── cbo-agent.js               # Claude Sonnet 4 integration, BBMM logic
```

### Mini App (React + Vite)
```
/mini-app/
├── src/
│   ├── App.jsx                # Main app with Telegram theme integration
│   ├── main.jsx              # Entry point
│   ├── index.css             # Global styles with CBO design system
│   ├── components/
│   │   ├── ChatInterface.jsx     # Main chat UI container
│   │   ├── ChatInterface.css     # Chat interface styles
│   │   ├── MessageList.jsx       # Enhanced message display with formatting
│   │   ├── MessageList.css       # Message bubble styles
│   │   ├── TypingIndicator.jsx   # AI thinking animation
│   │   ├── TypingIndicator.css   # Typing indicator styles
│   │   ├── FlowIndicator.jsx     # Four Flows status display
│   │   └── FlowIndicator.css     # Flow indicator styles
│   └── hooks/
│       └── useChat.js            # Chat state management, API calls
├── public/
│   └── cbo-character.png        # CBO avatar (green cube with glasses)
├── dist/                         # Production build output (gitignored)
├── package.json                  # Mini-app dependencies
└── vite.config.js               # Vite configuration
```

### Configuration Files
```
/
├── .env                          # Environment variables (not committed)
├── .env.example                  # Template for environment variables
├── .gitignore                    # Git ignore rules
├── package.json                  # Main project dependencies
├── deploy.sh                     # Deployment automation script
└── .do/
    └── app.yaml                  # DigitalOcean App Platform config
```

## Deployment Setup

### GitHub Repository
- **Repository**: `ForkIt369/cbo-telegram-bot`
- **Default Branch**: `master`
- **Auto-deploy**: Enabled (pushes to master trigger deployment)

### DigitalOcean App Platform
- **App Name**: `cbo-demo-miniapp`
- **App ID**: `253bebd7-497f-4efe-a7f0-bacbe71413ef`
- **Live URL**: https://cbo-mcp-system-hs2sx.ondigitalocean.app
- **Region**: NYC (New York)
- **Tier**: Professional
- **Instance**: 1x apps-s-1vcpu-1gb

### Environment Variables (Set in DigitalOcean)
```
NODE_ENV=production
PORT=3003
TELEGRAM_BOT_TOKEN=[encrypted]
ANTHROPIC_API_KEY=[encrypted]
WEBHOOK_URL=https://cbo-mcp-system-hs2sx.ondigitalocean.app
ENABLE_MCP_TOOLS=true
SERVICE_NAME=telegram-bot
```

### Build & Deploy Process
1. **Build Command**: `npm install && npm run build`
2. **Run Command**: `node src/index.js`
3. **Health Check**: `/health` endpoint
4. **Source Directory**: `/` (root)

### Monitoring
- **App Dashboard**: https://cloud.digitalocean.com/apps/253bebd7-497f-4efe-a7f0-bacbe71413ef
- **Deployment History**: Available in DigitalOcean dashboard
- **Alerts**: Configured for deployment failures and domain issues

## Architecture Overview

This is a Telegram bot with an integrated mini-app that provides business optimization consulting through the BroVerse Biz Mental Model™ (BBMM) framework, powered by Claude Sonnet 4.

### Key Components

1. **Bot Entry Point** (`src/index.js`): Telegraf bot handling commands and messages
   - Webhook mode in production, polling in development
   - Express server for health checks and mini-app serving
   - Serves mini-app from `/mini-app/dist` in production

2. **CBO Agent Handler** (`src/handlers/cboAgentHandler.js`): Manages conversations and context
   - Maintains conversation state per user
   - Extracts insights from conversations
   - Integrates with memory bank for persistence

3. **CBO Agent** (`agents/cbo-agent.js`): Claude Sonnet 4 integration
   - Analyzes business problems through Four Flows: Value, Info, Work, Cash
   - Maintains conversation context with message history
   - Formats responses for Telegram readability

4. **Memory Bank** (`src/memory/memoryBank.js`): File-based storage system
   - Saves conversations, insights, and patterns
   - Provides user history and pattern detection

5. **Mini App** (`mini-app/`): React + Vite Telegram Web App
   - Modern UI with CBO brand design system
   - Features CBO character (green cube with glasses)
   - Mobile-optimized for Telegram's in-app browser
   - Enhanced message formatting (bold, italic, code blocks)
   - Progressive typing animation with cognitive pauses
   - Chunked message display for long content
   - Telegram theme integration (dark/light mode)
   - Haptic feedback support
   - Timestamps and typing indicators

### Recent Enhancements (Aug 8, 2025)

#### Mini App UI Improvements
- **Message Formatting**: Support for markdown-style formatting
  - Bold (**text**), italic (*text*), code blocks, quotes
  - Links and inline code rendering
- **Progressive Typing**: Natural word-by-word display with variable speeds
- **Chunked Messages**: Long responses broken into 280-char segments
- **Mobile Optimization**: 
  - Responsive bubble widths (80% max, 85% mobile)
  - 44px minimum touch targets
  - Optimized padding and font sizes
- **Telegram Integration**:
  - Dynamic theme color application
  - Haptic feedback on message send/receive
  - High contrast and reduced motion support
- **Enhanced Components**:
  - `MessageList.jsx`: Full formatting support, timestamps
  - `TypingIndicator.jsx`: Cognitive delays, "AI thinking" status
  - `App.jsx`: Telegram WebApp theme listener

### Key Patterns

- **Error Handling**: All async operations wrapped in try-catch with Winston logging
- **Context Management**: Conversation state maintained in-memory with periodic saves
- **Response Formatting**: Claude responses cleaned for Telegram (no markdown, length limits)
- **Deployment Modes**: Production uses webhooks, development uses polling
- **Message IDs**: Unique IDs with role prefix (user-timestamp, assistant-timestamp)
- **Flow Detection**: Automatic categorization based on keyword analysis

### Testing Approach

- Jest is configured but tests not yet implemented
- Manual testing via Telegram bot commands
- Health endpoint at `/health` for monitoring
- Build verification: `npm run build` before deployment

### Telegram Bot Setup

1. **BotFather Configuration**:
   - Bot username: As configured in BotFather
   - Menu button: Set to mini-app URL after deployment
   - Commands: `/start`, `/help`, `/clear`

2. **Webhook Setup** (Production):
   - Automatically configured via `WEBHOOK_URL` env variable
   - HTTPS required for Telegram webhooks
   - Webhook endpoint: `/telegram-webhook`

3. **Mini App Access**:
   - Direct URL: https://cbo-mcp-system-hs2sx.ondigitalocean.app
   - Via Telegram: Menu button in bot chat
   - Mobile-optimized for Telegram WebView