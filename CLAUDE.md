# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start bot in development mode with auto-reload (nodemon)
- `npm start` - Start bot in production mode
- `npm test` - Run Jest test suite

### Environment Setup
- Copy `.env.example` to `.env` and configure required variables
- Required: `TELEGRAM_BOT_TOKEN`, `ANTHROPIC_API_KEY`
- Optional: `PORT` (default: 3000), `NODE_ENV`, `WEBHOOK_URL`

## Architecture Overview

This is a Telegram bot that provides business optimization consulting through the BroVerse Biz Mental Model™ (BBMM) framework, powered by Claude Sonnet 4.

### Key Components

1. **Bot Entry Point** (`src/index.js`): Telegraf bot handling commands and messages
   - Webhook mode in production, polling in development
   - Express server for health checks

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

### Key Patterns

- **Error Handling**: All async operations wrapped in try-catch with Winston logging
- **Context Management**: Conversation state maintained in-memory with periodic saves
- **Response Formatting**: Claude responses cleaned for Telegram (no markdown, length limits)
- **Deployment Modes**: Production uses webhooks, development uses polling

### Deployment

- **DigitalOcean App Platform**: Auto-deploy from GitHub master branch
- **Environment Variables**: Set in App Platform settings, not committed
- **Webhook URL**: Must be HTTPS in production for Telegram

### Testing Approach

- Jest is configured but tests not yet implemented
- Manual testing via Telegram bot commands
- Health endpoint at `/health` for monitoring