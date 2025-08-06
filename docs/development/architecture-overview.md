# CBO-Bro Telegram Bot Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CBO-BRO TELEGRAM BOT SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────────────────────┐  │
│  │   TELEGRAM USERS    │         │      DIGITALOCEAN APP PLATFORM      │  │
│  │                     │         │                                     │  │
│  │  👤 User sends      │         │  🌐 https://cbo-demo-miniapp-        │  │
│  │     message to      │ ──────> │     hs2sx.ondigitalocean.app       │  │
│  │     @cbo_DEVbot     │         │                                     │  │
│  │                     │         │  ┌─────────────────────────────┐   │  │
│  │  📱 Opens Mini App  │ ──────> │  │    EXPRESS SERVER:3003    │   │  │
│  │     via menu        │         │  │                           │   │  │
│  └─────────────────────┘         │  │  ┌───────────────────┐   │   │  │
│                                  │  │  │ TELEGRAM WEBHOOK  │   │   │  │
│                                  │  │  │ /telegram-webhook │   │   │  │
│  ┌─────────────────────┐         │  │  └───────────────────┘   │   │  │
│  │   TELEGRAM API      │         │  │                           │   │  │
│  │                     │         │  │  ┌───────────────────┐   │   │  │
│  │  🔔 Webhook URL:    │ <────── │  │  │   TELEGRAF BOT    │   │   │  │
│  │  /telegram-webhook  │         │  │  │  - /start         │   │   │  │
│  │                     │         │  │  │  - /help          │   │   │  │
│  │  🎯 Bot Token:      │         │  │  │  - /status        │   │   │  │
│  │  8139049417:AAE... │         │  │  │  - /clear         │   │   │  │
│  │                     │         │  │  │  - message handler │   │   │  │
│  │  📲 Mini App:       │         │  │  └───────────────────┘   │   │  │
│  │  Configured in      │         │  │                           │   │  │
│  │  BotFather          │         │  │  ┌───────────────────┐   │   │  │
│  └─────────────────────┘         │  │  │  MINI APP API     │   │   │  │
│                                  │  │  │  /api/chat/*      │   │   │  │
│                                  │  │  └───────────────────┘   │   │  │
│                                  │  │                           │   │  │
│                                  │  │  ┌───────────────────┐   │   │  │
│                                  │  │  │  STATIC SERVING   │   │   │  │
│                                  │  │  │  /mini-app/dist   │   │   │  │
│                                  │  │  └───────────────────┘   │   │  │
│                                  │  └─────────────────────────────┘   │  │
│                                  │                                     │  │
│                                  │  ┌─────────────────────────────┐   │  │
│  ┌─────────────────────┐         │  │     CLAUDE SERVICE        │   │  │
│  │   ANTHROPIC API     │         │  │                           │   │  │
│  │                     │         │  │  🤖 Model:                │   │  │
│  │  🔑 API Key:        │ <────── │  │  claude-3-haiku-20240307  │   │  │
│  │  (Encrypted in DO)  │         │  │                           │   │  │
│  │                     │         │  │  📊 CBO-Bro Persona:      │   │  │
│  │  🧠 Processes:      │         │  │  - Value Flow            │   │  │
│  │  Business queries   │         │  │  - Info Flow             │   │  │
│  │  via BBMM framework │         │  │  - Work Flow             │   │  │
│  │                     │         │  │  - Cash Flow             │   │  │
│  └─────────────────────┘         │  └─────────────────────────────┘   │  │
│                                  │                                     │  │
│                                  │  ┌─────────────────────────────┐   │  │
│                                  │  │    MINI APP (REACT)       │   │  │
│                                  │  │                           │   │  │
│                                  │  │  📱 Built with:           │   │  │
│                                  │  │  - React + Vite           │   │  │
│                                  │  │  - Telegram UI Kit        │   │  │
│                                  │  │  - Tailwind CSS           │   │  │
│                                  │  │                           │   │  │
│                                  │  │  🎨 Features:             │   │  │
│                                  │  │  - Chat interface         │   │  │
│                                  │  │  - Quick actions          │   │  │
│                                  │  │  - CBO-Bro avatar        │   │  │
│                                  │  │  - Dark theme             │   │  │
│                                  │  └─────────────────────────────┘   │  │
│                                  └─────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         ENVIRONMENT VARIABLES                        │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  NODE_ENV=production                                                │  │
│  │  PORT=3003                                                          │  │
│  │  TELEGRAM_BOT_TOKEN=***** (encrypted)                               │  │
│  │  ANTHROPIC_API_KEY=***** (encrypted)                                │  │
│  │  WEBHOOK_URL=https://cbo-mcp-system-hs2sx.ondigitalocean.app       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                            DATA FLOW                                 │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  1. User sends message to @cbo_DEVbot                               │  │
│  │  2. Telegram API sends webhook POST to /telegram-webhook            │  │
│  │  3. Telegraf bot processes message                                  │  │
│  │  4. CBO Agent Handler manages conversation context                  │  │
│  │  5. Claude Service processes business query via API                 │  │
│  │  6. Response sent back to user via Telegram API                     │  │
│  │                                                                      │  │
│  │  Mini App Flow:                                                     │  │
│  │  1. User opens Mini App from bot menu                              │  │
│  │  2. Mini App loads from /mini-app/dist                             │  │
│  │  3. Chat interface uses /api/chat/* endpoints                      │  │
│  │  4. Same backend processing as bot messages                        │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         DEPLOYMENT STATUS                            │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  🟢 Bot Service: HEALTHY                                            │  │
│  │  🟢 Health Check: OK (/health endpoint)                             │  │
│  │  🟢 Webhook: Configured                                             │  │
│  │  🟢 Mini App: Served at root path                                   │  │
│  │  🟡 Mini App URL: Needs BotFather configuration                     │  │
│  │                                                                      │  │
│  │  GitHub Repo: ForkIt369/cbo-telegram-bot                            │  │
│  │  Last Commit: Fix Claude service initialization                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Telegram Bot (@cbo_DEVbot)
- **Username**: @cbo_DEVbot
- **Token**: 8139049417:AAEfmoNXmUhz4y842SdtKL8SjPwgYzIXDNI
- **Commands**: /start, /help, /status, /clear
- **Mini App**: Configured (needs URL in BotFather)

### 2. Backend Service
- **Framework**: Express.js + Telegraf
- **Port**: 3003
- **Endpoints**:
  - `/health` - Health check
  - `/telegram-webhook` - Telegram webhook
  - `/api/chat/*` - Mini App API
  - `/` - Mini App static files

### 3. Claude Integration
- **Service**: Direct Anthropic API (no MCP)
- **Model**: claude-3-haiku-20240307
- **Persona**: CBO-Bro with BBMM framework

### 4. Mini App
- **Framework**: React + Vite
- **UI**: Telegram UI Kit + Tailwind
- **Features**: Chat interface, quick actions, CBO avatar
- **Build**: Pre-built and committed to repo

### 5. Deployment
- **Platform**: DigitalOcean App Platform
- **URL**: https://cbo-mcp-system-hs2sx.ondigitalocean.app
- **Auto-deploy**: Enabled from master branch

## Next Steps

1. ✅ Bot is healthy and running
2. ✅ Mini App is built and served
3. ⏳ Configure Mini App URL in BotFather:
   - Use @BotFather
   - Select @cbo_DEVbot
   - Edit Bot > Bot Settings > Menu Button
   - Set URL: https://cbo-mcp-system-hs2sx.ondigitalocean.app/

## Security Notes

- API keys are encrypted in DigitalOcean environment variables
- Webhook uses HTTPS for secure communication
- No sensitive data stored in repository