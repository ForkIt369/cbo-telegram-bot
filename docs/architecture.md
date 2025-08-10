# CBO Bot Architecture

## System Overview

CBO Bot is a comprehensive Telegram-based business optimization platform featuring both a conversational bot and a modern mini-app interface. Powered by Claude Sonnet 4, it provides strategic insights through the BroVerse Biz Mental Model™ (BBMM) framework, analyzing businesses across four key flows: Value, Info, Work, and Cash.

The system features CBO-Bro, a distinctive green cube character with glasses who serves as the AI business consultant.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Telegram Bot (@cbo_bro_bot)  │  Telegram Mini App (React) │
└───────────────┬───────────────┴──────────────┬─────────────┘
                │                              │
                ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Express Server (Port 3003 prod / 3001 dev)                │
│  ├── Telegram Webhook Handler                              │
│  ├── Mini App API Endpoints                                │
│  └── Static File Server                                    │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  CBO Agent Handler           │  Access Control             │
│  ├── Context Management      │  ├── Whitelist Service     │
│  ├── Message Processing      │  ├── Admin Controls        │
│  └── Memory Integration      │  └── API Protection        │
└───────────────┬─────────────┴──────────────┬───────────────┘
                │                            │
                ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Integration Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Claude Service              │  Memory Bank                │
│  ├── Anthropic API          │  ├── File-based Storage    │
│  └── Sonnet 4 Integration   │  └── Pattern Detection     │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. **Entry Points**

#### Telegram Bot (`src/index.js`)
- **Framework**: Telegraf 4.16.x
- **Commands**: 
  - Public: `/start`
  - Protected: `/help`, `/status`, `/clear`
  - Admin: `/whitelist`, `/adduser`, `/removeuser`
- **Deployment Modes**:
  - Production: Webhook mode (HTTPS)
  - Development: Long polling

#### Mini App (`mini-app/`)
- **Framework**: React 18.2 + Vite 5.0
- **UI Library**: @telegram-apps/telegram-ui 2.1.0
- **SDK**: @telegram-apps/sdk-react 2.0.0
- **Styling**: Tailwind CSS 3.3.6
- **HTTP Client**: Axios 1.6.2
- **Animation**: Framer Motion 10.16.5

### 2. **Core Services**

#### CBO Agent Handler (`src/handlers/cboAgentHandler.js`)
- Manages per-user conversation state
- Integrates with Claude for AI responses
- Handles context window management (10 messages)
- Extracts and saves business insights
- Processes background tasks for long operations

#### Claude Service (`src/services/claudeService.js`)
- Direct Anthropic API integration
- Model: Claude Sonnet 4 (claude-sonnet-4-20250514)
- Max tokens: 1000 per response
- Temperature: 0.7
- Error handling and retry logic

#### Memory Bank (`src/memory/memoryBank.js`)
- File-based JSON storage system
- Structure:
  ```
  data/memory/
  ├── <userId>/
  │   ├── conversations/
  │   │   └── <timestamp>.json
  │   ├── insights/
  │   │   └── insights.json
  │   └── patterns/
  │       └── patterns.json
  ```

### 3. **Middleware & Security**

#### Access Control (`src/middleware/accessControl.js`)
- Whitelist-based authorization
- Admin role verification
- API endpoint protection
- Request validation

#### Whitelist Service (`src/services/whitelistService.js`)
- JSON-based user database (`data/whitelist.json`)
- User management APIs
- Admin privilege control
- Dynamic user addition/removal

### 4. **Data Flow**

```
User Message → Telegram API → Webhook/Polling
    ↓
Express Server → Route Handler → Access Check
    ↓
CBO Agent Handler → Context Load ← Memory Bank
    ↓
Claude Service → Anthropic API
    ↓
Response Processing → Insight Extraction
    ↓
Memory Save → Telegram Reply → User
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express 4.21.1
- **Bot Framework**: Telegraf 4.16.3
- **AI Integration**: @anthropic-ai/sdk 0.59.0 with Context7 MCP integration
- **Logging**: Winston 3.17.0
- **Process Manager**: Nodemon 3.1.9 (dev)
- **Environment**: dotenv 16.4.7

### Frontend (Mini App)
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **UI Components**: @telegram-apps/telegram-ui 2.1.0
- **SDK**: @telegram-apps/sdk-react 2.0.0
- **Styling**: Tailwind CSS 3.3.6
- **HTTP Client**: Axios 1.6.2
- **Animation**: Framer Motion 10.16.5

### Infrastructure
- **Platform**: DigitalOcean App Platform
- **Container**: Node.js 18 buildpack
- **Region**: NYC
- **Instance**: apps-s-1vcpu-1gb ($5/month)
- **URL**: https://telegram-bot-zv6x7.ondigitalocean.app

## Deployment Architecture

### Production Environment
```
GitHub Repository (ForkIt369/cbo-telegram-bot)
    ↓ (auto-deploy on master push)
DigitalOcean App Platform
    ↓
Container Instance (Port 3003)
    ├── Telegram Webhook (/telegram-webhook)
    ├── Mini App Static Files (/)
    ├── API Endpoints (/api/*)
    └── Health Check (/health)
```

### Environment Configuration
```yaml
Production:
  NODE_ENV: production
  PORT: 3003
  TELEGRAM_BOT_TOKEN: [encrypted]
  ANTHROPIC_API_KEY: [encrypted]
  WEBHOOK_URL: https://telegram-bot-zv6x7.ondigitalocean.app
  ENABLE_MCP_TOOLS: true (should be false)

Development:
  NODE_ENV: development
  PORT: 3001
  TELEGRAM_BOT_TOKEN: [from .env]
  ANTHROPIC_API_KEY: [from .env]
```

## Security Architecture

### Authentication & Authorization
- **User Validation**: Telegram user ID verification
- **Access Control**: Whitelist-based system
- **Admin Roles**: Special privileges for user management
- **API Protection**: Middleware for Mini App endpoints

### Data Protection
- **User Isolation**: Separate directories per user ID
- **File Permissions**: OS-level file system security
- **Environment Security**: Encrypted secrets in production
- **HTTPS Only**: Webhooks require SSL/TLS

### Rate Limiting & Timeouts
- **Webhook Timeout**: 20 seconds (Telegram limit ~25s)
- **Background Processing**: For operations >18s
- **Message Chunking**: 4096 character limit
- **Telegram Rate Limits**: 30 msg/sec, 20 msg/min per chat

## Performance Optimizations

### Request Handling
- Immediate typing indicator response
- Timeout handling with background processing
- Message chunking for long responses
- Parallel processing where possible

### Context Management
- Limited to 10 messages per conversation
- Automatic context pruning
- Efficient memory storage
- Lazy loading of user data

## Error Handling Strategy

### Layers
1. **Global Error Handler**: Unhandled rejections
2. **Webhook Error Handler**: Request-level errors
3. **Service Error Handler**: API failures
4. **User Error Messages**: Friendly feedback

### Logging
- **Framework**: Winston with timestamp
- **Levels**: error, warn, info, debug
- **Storage**: Console output (stdout)
- **Production**: DigitalOcean logs

## File Structure

```
CBO_BOT/
├── src/
│   ├── index.js              # Main entry point
│   ├── handlers/
│   │   └── cboAgentHandler.js
│   ├── services/
│   │   ├── claudeService.js
│   │   └── whitelistService.js
│   ├── middleware/
│   │   └── accessControl.js
│   ├── memory/
│   │   └── memoryBank.js
│   └── utils/
│       └── logger.js
├── agents/
│   └── cbo-agent.js          # Claude agent configuration
├── mini-app/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/
│   ├── dist/                 # Built files (production)
│   └── package.json
├── data/
│   ├── whitelist.json
│   └── memory/               # User conversations
├── experimental/             # MCP tools (not in production)
│   ├── mcp-servers/
│   ├── services/
│   └── README.md
└── docs/
    ├── architecture.md       # This file
    ├── implementation-plan.md
    └── api-specs.md
```

## Future Architecture Considerations

### Immediate Improvements
1. **Fix Port Mismatch**: Align .do/app.yaml ENABLE_MCP_TOOLS to false
2. **Mini App Verification**: Test and fix WebApp integration
3. **Database Migration**: Move from files to PostgreSQL
4. **Redis Integration**: For session management

### Scalability Enhancements
1. **Horizontal Scaling**: Multi-instance with load balancer
2. **Message Queue**: RabbitMQ/Redis for async processing
3. **CDN Integration**: CloudFlare for Mini App assets
4. **Monitoring**: DataDog or New Relic integration

### MCP Integration (Experimental)
Currently isolated in `experimental/` directory:
- HTTP/SSE transport wrappers for production
- Multi-server orchestration (Context7, PerplexityAI)
- Tool discovery and execution
- Registry pattern for server management

## Monitoring & Observability

### Current Endpoints
- **Health Check**: GET /health
- **Webhook**: POST /telegram-webhook
- **Mini App APIs**: /api/chat/*, /api/auth/check

### Recommended Additions
- Prometheus metrics endpoint
- Structured logging with correlation IDs
- Distributed tracing
- Performance monitoring
- Error tracking (Sentry)