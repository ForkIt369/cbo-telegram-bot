# CBO Telegram Bot Architecture

## Overview

The CBO Telegram Bot is a conversational AI interface that connects users with the Chief Business Optimization (CBO) agent via Telegram. It uses Claude Sonnet 4 for intelligent business analysis through the BroVerse Biz Mental Model™ (BBMM) framework.

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Telegram User  │────▶│  Telegram Bot    │────▶│   CBO Agent     │
│                 │     │   (Telegraf)     │     │ (Claude Sonnet 4)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Express Server  │     │  Memory Bank    │
                        │   (Webhooks)     │     │   (Insights)    │
                        └──────────────────┘     └─────────────────┘
```

## Core Components

### 1. Telegram Bot Interface (`src/index.js`)
- **Framework**: Telegraf 4.x
- **Features**:
  - Command handling (/start, /help, /status, /clear)
  - Message processing with typing indicators
  - Error handling and graceful shutdown
  - Webhook support for production deployment

### 2. CBO Agent Handler (`src/handlers/cboAgentHandler.js`)
- **Purpose**: Manages conversation context and agent integration
- **Features**:
  - Context management per user
  - Message history tracking
  - Insight extraction and pattern detection
  - Memory bank integration

### 3. CBO Agent (`agents/cbo-agent.js`)
- **AI Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Framework**: BroVerse Biz Mental Model™ (BBMM)
- **Analysis Dimensions**:
  - Four Flows: Value, Info, Work, Cash
  - 12 Core Capabilities
  - 64 Business Patterns

### 4. Memory Bank (`src/memory/memoryBank.js`)
- **Storage**: File-based JSON storage
- **Features**:
  - Conversation persistence
  - Insight extraction and storage
  - Pattern recognition
  - User history tracking

## Data Flow

1. **User Message** → Telegram API → Bot receives message
2. **Context Loading** → Retrieve user conversation history
3. **AI Processing** → Send to Claude Sonnet 4 with context
4. **Response Generation** → Format for Telegram readability
5. **Memory Storage** → Save insights and patterns
6. **Message Delivery** → Send response to user

## Memory Structure

```
data/memories/
├── conversations/   # User conversation logs
├── insights/       # Extracted business insights
└── patterns/       # Recognized business patterns
```

## Environment Configuration

- `TELEGRAM_BOT_TOKEN`: Bot authentication
- `ANTHROPIC_API_KEY`: Claude API access
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode
- `WEBHOOK_URL`: Production webhook endpoint

## Deployment Architecture

### Local Development
- Polling mode for message retrieval
- Express server for health checks
- File-based memory storage

### Production (DigitalOcean)
- Webhook mode for real-time messages
- App Platform or Droplet deployment
- Optional: Database for persistent storage
- SSL/TLS encryption

## Security Considerations

1. **API Keys**: Stored in environment variables
2. **User Data**: Isolated by user ID
3. **Message Validation**: Input sanitization
4. **Rate Limiting**: Via Telegram API
5. **Error Handling**: No sensitive data in logs

## Scalability Path

1. **Phase 1**: Single instance with file storage
2. **Phase 2**: Database integration (PostgreSQL/MongoDB)
3. **Phase 3**: Redis for session management
4. **Phase 4**: Microservices architecture
5. **Phase 5**: Multi-region deployment