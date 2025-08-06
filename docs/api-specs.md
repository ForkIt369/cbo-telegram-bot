# CBO Bot API Specifications

## Table of Contents
1. [External APIs](#external-apis)
2. [Internal APIs](#internal-apis)
3. [Data Structures](#data-structures)
4. [Webhook Specifications](#webhook-specifications)
5. [Error Handling](#error-handling)
6. [Rate Limits & Timeouts](#rate-limits--timeouts)
7. [Security](#security)
8. [Environment Variables](#environment-variables)

## External APIs

### Anthropic Claude API

#### Messages Endpoint
```http
POST https://api.anthropic.com/v1/messages
```

**Headers:**
```json
{
  "x-api-key": "${ANTHROPIC_API_KEY}",
  "anthropic-version": "2023-06-01",
  "content-type": "application/json"
}
```

**Request Body:**
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "temperature": 0.7,
  "system": "You are CBO-Bro, the Chief Business Optimization expert...",
  "messages": [
    {
      "role": "user",
      "content": "How can I improve customer retention?"
    }
  ]
}
```

**Response:**
```json
{
  "id": "msg_01XzZQK4...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "To improve customer retention, let me analyze through the Four Flows..."
    }
  ],
  "model": "claude-sonnet-4-20250514",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 450
  }
}
```

### Telegram Bot API

#### Set Webhook
```http
POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook
```

**Request Body:**
```json
{
  "url": "https://telegram-bot-zv6x7.ondigitalocean.app/telegram-webhook",
  "allowed_updates": ["message", "callback_query"],
  "drop_pending_updates": true
}
```

#### Set Menu Button
```http
POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setChatMenuButton
```

**Request Body:**
```json
{
  "menu_button": {
    "type": "web_app",
    "text": "Open CBO-Bro",
    "web_app": {
      "url": "https://telegram-bot-zv6x7.ondigitalocean.app"
    }
  }
}
```

#### Send Message
```http
POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage
```

**Request Body:**
```json
{
  "chat_id": 123456789,
  "text": "Your message here",
  "parse_mode": "Markdown"
}
```

#### Send Chat Action
```http
POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction
```

**Request Body:**
```json
{
  "chat_id": 123456789,
  "action": "typing"
}
```

## Internal APIs

### Health & Status

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-08-06T12:00:00.000Z"
}
```

### Mini App APIs

#### Check Authorization
```http
POST /api/auth/check
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "123456789"
}
```

**Response:**
```json
{
  "authorized": true,
  "isAdmin": false
}
```

#### Get Chat History
```http
GET /api/chat/history/:userId
```

**Headers:**
```json
{
  "X-User-ID": "123456789"
}
```

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "How can I improve cash flow?",
      "timestamp": "2025-08-06T11:30:00.000Z"
    },
    {
      "role": "assistant",
      "content": "To improve cash flow, let's analyze...",
      "timestamp": "2025-08-06T11:30:05.000Z"
    }
  ]
}
```

#### Send Message
```http
POST /api/chat/message
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "123456789",
  "message": "What are the best practices for inventory management?"
}
```

**Response:**
```json
{
  "response": "For inventory management best practices, let me break this down through the Four Flows..."
}
```

#### Clear Chat
```http
POST /api/chat/clear
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "123456789"
}
```

**Response:**
```json
{
  "success": true
}
```

## Data Structures

### User Context
```typescript
interface UserContext {
  userId: string;
  startTime: Date;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}
```

### Whitelist Entry
```typescript
interface WhitelistEntry {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  added_date: string;
  added_by?: number;
  notes?: string;
}
```

### Insight Structure
```typescript
interface Insight {
  timestamp: string;
  type: 'flow_query' | 'capability_assessment' | 'pattern_recognition';
  flow: 'value' | 'info' | 'work' | 'cash' | 'general';
  content: string;
  userId: string;
  confidence: number; // 0-1
}
```

### Pattern Structure
```typescript
interface Pattern {
  timestamp: string;
  type: string;
  description: string;
  occurrences: number;
  flows: Array<'value' | 'info' | 'work' | 'cash'>;
  recommendations: string[];
  severity?: 'low' | 'medium' | 'high';
}
```

### Telegram Update
```typescript
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    entities?: Array<{
      type: string;
      offset: number;
      length: number;
    }>;
  };
}
```

## Webhook Specifications

### Telegram Webhook
```http
POST /telegram-webhook
Content-Type: application/json
X-Telegram-Bot-Api-Secret-Token: optional-secret
```

**Request Body:** [Telegram Update object](#telegram-update)

**Response Requirements:**
- Must respond within 25 seconds
- Return 200 OK for successful processing
- Any other status code triggers webhook retry

**Error Response:**
```json
{
  "error": "Webhook processing failed"
}
```

## Error Handling

### API Error Codes

#### Anthropic Errors
```json
{
  "error": {
    "type": "invalid_request_error" | "authentication_error" | "rate_limit_error",
    "message": "Detailed error message"
  }
}
```

#### Telegram Errors
```json
{
  "ok": false,
  "error_code": 400,
  "description": "Bad Request: message text is empty"
}
```

#### Internal Errors
```json
{
  "error": "Failed to process request",
  "code": "INTERNAL_ERROR",
  "details": "Optional error details"
}
```

### Error Code Reference
- `400` - Bad Request
- `401` - Unauthorized (not whitelisted)
- `403` - Forbidden (no admin access)
- `404` - Resource not found
- `408` - Request timeout
- `429` - Rate limit exceeded
- `500` - Internal server error

## Rate Limits & Timeouts

### External Services

#### Anthropic API
- **Requests**: Varies by tier
- **Tokens**: Varies by tier
- **Context Window**: 200K tokens
- **Response Time**: ~2-5 seconds

#### Telegram API
- **Messages/second**: 30
- **Messages/minute to same chat**: 20
- **Bulk messages**: 30/second
- **Webhook timeout**: 25 seconds

### Internal Limits

#### Request Timeouts
```javascript
{
  webhookTimeout: 20000,      // 20 seconds
  apiTimeout: 30000,          // 30 seconds
  backgroundProcessing: 18000 // 18 seconds before background
}
```

#### Message Limits
```javascript
{
  maxMessageLength: 4096,     // Telegram limit
  maxContextMessages: 10,     // Conversation history
  maxResponseTokens: 1000     // Claude response
}
```

## Security

### Authentication Methods

#### Whitelist Authentication
```javascript
// Middleware check
function checkWhitelist(ctx, next) {
  const userId = ctx.from?.id;
  if (!whitelistService.isWhitelisted(userId)) {
    return ctx.reply('🔒 Access Restricted');
  }
  return next();
}
```

#### Admin Authentication
```javascript
// Admin check
function checkAdmin(ctx, next) {
  const userId = ctx.from?.id;
  if (!whitelistService.isAdmin(userId)) {
    return ctx.reply('❌ Admin access required');
  }
  return next();
}
```

#### API Authentication
```javascript
// Mini App API auth
function checkApiAccess(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId || !whitelistService.isWhitelisted(parseInt(userId))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

### Security Headers
```javascript
// Not currently implemented but recommended
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'"
}
```

## Environment Variables

### Required Variables
```bash
# Bot Configuration
TELEGRAM_BOT_TOKEN=[YOUR_TELEGRAM_BOT_TOKEN]
ANTHROPIC_API_KEY=[YOUR_ANTHROPIC_API_KEY]

# Server Configuration
NODE_ENV=production|development
PORT=3003  # Production
PORT=3001  # Development
```

### Optional Variables
```bash
# Webhook (production only)
WEBHOOK_URL=https://telegram-bot-zv6x7.ondigitalocean.app

# Logging
LOG_LEVEL=error|warn|info|debug

# Agent Configuration
CBO_AGENT_PATH=../agents/cbo-agent.js

# Experimental Features
ENABLE_MCP_TOOLS=false  # Currently true in production (should be false)
```

### DigitalOcean App Platform Config
```yaml
name: cbo-telegram-bot
region: nyc
services:
- environment_slug: node-js
  github:
    branch: master
    deploy_on_push: true
    repo: ForkIt369/cbo-telegram-bot
  build_command: npm ci && npm run build
  run_command: npm start
  http_port: 3003
  instance_count: 1
  instance_size_slug: apps-s-1vcpu-1gb
  name: telegram-bot
  envs:
  - key: NODE_ENV
    value: production
    scope: RUN_AND_BUILD_TIME
  - key: PORT
    value: "3003"
    scope: RUN_AND_BUILD_TIME
  - key: TELEGRAM_BOT_TOKEN
    value: "8139049417:AAEfmoNXmUhz4y842SdtKL8SjPwgYzIXDNI"
    scope: RUN_TIME
    type: SECRET
  - key: ANTHROPIC_API_KEY
    scope: RUN_TIME
    type: SECRET
  - key: WEBHOOK_URL
    value: "https://telegram-bot-zv6x7.ondigitalocean.app/telegram-webhook"
    scope: RUN_TIME
  - key: ENABLE_MCP_TOOLS
    value: "true"  # Should be "false"
    scope: RUN_AND_BUILD_TIME
```

## Service Dependencies

### NPM Packages
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.1",
    "telegraf": "^4.16.3",
    "express": "^4.21.1",
    "winston": "^3.17.0",
    "dotenv": "^16.4.7",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.9",
    "jest": "^29.7.0",
    "@types/node": "^22.10.1"
  }
}
```

### External Services
1. **Telegram Bot API** - Bot messaging platform
2. **Anthropic Claude API** - AI language model
3. **DigitalOcean App Platform** - Hosting infrastructure
4. **GitHub** - Version control & CI/CD

### Internal Services
1. **CBO Agent** - Business analysis logic
2. **Memory Bank** - Conversation persistence
3. **Whitelist Service** - Access control
4. **Logger** - Application logging