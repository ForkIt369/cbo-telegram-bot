# CBO Telegram Bot API Specifications

## Claude Sonnet 4 Integration

### Model Configuration
```javascript
{
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1000,
  temperature: 0.7,
  system: 'CBO-Bro system prompt...'
}
```

### API Endpoints

#### Anthropic Messages API
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Method**: POST
- **Headers**:
  ```json
  {
    "x-api-key": "YOUR_API_KEY",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  }
  ```

## Telegram Bot API

### Webhook Configuration
```javascript
POST https://api.telegram.org/bot{TOKEN}/setWebhook
{
  "url": "https://your-domain.com/telegram-webhook",
  "allowed_updates": ["message", "callback_query"]
}
```

### Message Types

#### Text Message
```javascript
{
  "message_id": 123,
  "from": {
    "id": 456789,
    "first_name": "John",
    "username": "johndoe"
  },
  "chat": {
    "id": 456789,
    "type": "private"
  },
  "date": 1234567890,
  "text": "How can I improve cash flow?"
}
```

#### Bot Commands
- `/start` - Initialize bot conversation
- `/help` - Display help information
- `/status` - Check bot status
- `/clear` - Clear conversation context

## Memory Bank API

### Save Conversation
```javascript
memoryBank.saveConversation(userId, {
  messages: [...],
  startTime: Date,
  metadata: {}
})
```

### Save Insight
```javascript
memoryBank.saveInsight({
  type: 'flow_query',
  flow: 'cash',
  content: 'User query about cash flow',
  userId: '123456',
  confidence: 0.8
})
```

### Save Pattern
```javascript
memoryBank.savePattern({
  type: 'growth_challenge',
  description: 'Scaling issues identified',
  occurrences: 3,
  flows: ['value', 'work'],
  recommendations: [...]
})
```

## Data Structures

### Context Object
```javascript
{
  userId: string,
  startTime: Date,
  messages: [
    {
      role: 'user' | 'assistant',
      content: string,
      timestamp: Date
    }
  ]
}
```

### Insight Object
```javascript
{
  timestamp: string,
  type: string,
  flow: 'value' | 'info' | 'work' | 'cash',
  content: string,
  userId: string,
  confidence: number
}
```

### Pattern Object
```javascript
{
  timestamp: string,
  type: string,
  description: string,
  occurrences: number,
  flows: string[],
  recommendations: string[]
}
```

## Error Responses

### API Errors
```javascript
{
  error: {
    type: 'invalid_request_error',
    message: 'Invalid API key'
  }
}
```

### Bot Errors
```javascript
{
  ok: false,
  error_code: 400,
  description: 'Bad Request: message text is empty'
}
```

## Rate Limits

### Anthropic API
- Requests per minute: Varies by plan
- Tokens per minute: Varies by plan
- Max context: 200K tokens

### Telegram API
- Messages per second: 30
- Messages per minute to same chat: 20
- Bulk messages: 30 per second

## Security Headers

### Production Configuration
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Deployment Configuration

### DigitalOcean App Platform
```yaml
name: cbo-telegram-bot
region: nyc
services:
- environment_slug: node-js
  http_port: 3000
  instance_count: 1
  instance_size_slug: professional-xs
  name: cbo-bot
  run_command: npm start
  envs:
  - key: TELEGRAM_BOT_TOKEN
    scope: RUN_TIME
    type: SECRET
  - key: ANTHROPIC_API_KEY
    scope: RUN_TIME
    type: SECRET
```

### Environment Variables
```bash
# Required
TELEGRAM_BOT_TOKEN=your_token
ANTHROPIC_API_KEY=your_api_key
PORT=3000
NODE_ENV=production

# Optional
WEBHOOK_URL=https://your-app.ondigitalocean.app
LOG_LEVEL=info
CBO_AGENT_PATH=./agents/cbo-agent.js
```

## Monitoring Endpoints

### Health Check
```
GET /health
Response: {
  status: 'ok',
  timestamp: '2025-08-04T13:00:00Z',
  uptime: 3600,
  version: '2.0.0'
}
```

### Metrics
```
GET /metrics
Response: {
  requests_total: 1234,
  active_users: 56,
  average_response_time: 1.2,
  memory_usage: 128
}
```