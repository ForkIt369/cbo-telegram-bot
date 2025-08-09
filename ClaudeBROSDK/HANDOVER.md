# ClaudeBROSDK - Project Handover Document

## 🚀 Project Overview

**ClaudeBROSDK** is a Telegram Mini App that provides business optimization consulting through the BroVerse Biz Mental Model™ (BBMM) framework, powered by Claude Sonnet 3.5.

### Key Features
- 💬 Real-time chat with CBO BRO (Claude Sonnet 3.5)
- 📊 Business analysis through Four Flows: Value, Info, Work, Cash
- 🔄 Real-time streaming responses via WebSocket
- 📱 Telegram Mini App integration
- 💾 Session persistence with Redis
- 🎨 Pure vanilla JS/CSS/HTML frontend (no frameworks)

## 📁 Project Structure

```
ClaudeBROSDK/
├── server/                    # Backend server
│   ├── index.js              # Main Express server with WebSocket
│   ├── package.json          # Server dependencies
│   ├── .env                  # Environment variables (contains secrets)
│   ├── services/
│   │   └── claude.js         # Anthropic SDK integration
│   ├── websocket/
│   │   ├── handler.js        # WebSocket message handler
│   │   └── sessions.js       # Session management
│   └── telegram-webhook.js   # Telegram bot integration
│
├── src/                       # Frontend application
│   ├── index.html            # Main HTML file
│   ├── css/
│   │   ├── main.css          # Main styles
│   │   └── chat.css          # Chat interface styles
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   └── websocket.js      # WebSocket client bridge
│   └── assets/
│       └── avatars/          # User and bot avatars
│
├── docker/                    # Docker configuration (optional)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── scripts/                   # Utility scripts
│   ├── start-telegram-bot.sh # Start with Telegram integration
│   ├── local-test.sh         # Local testing without Telegram
│   └── simple-start.sh       # Simplified startup with ngrok
│
├── docs/                      # Documentation
│   ├── SPARC-IMPLEMENTATION.md
│   ├── architecture.md
│   ├── implementation-plan.md
│   └── api-specs.md
│
└── README.md                 # Project documentation
```

## 🔑 Credentials & Configuration

### Environment Variables (server/.env)
```bash
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Telegram Bot Configuration  
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
NGROK_AUTHTOKEN=your_ngrok_auth_token_here

# Server Configuration
PORT=8082
NODE_ENV=development
WS_PORT=8084  # Not used anymore - WebSocket runs on same server

# Redis Configuration
REDIS_URL=redis://localhost:6379

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://t.me

# Session Configuration
SESSION_TIMEOUT_MS=3600000

# Logging
LOG_LEVEL=info

# App URL (set automatically by ngrok)
APP_URL=
```

### Telegram Bot Details
- **Bot Username**: @cbosdkbot
- **Bot Token**: (configured in .env file)
- **Bot Father Commands**: Already configured with mini app button

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v18+ 
- Redis server
- ngrok account (for Telegram integration)

### Step 1: Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Step 2: Configure Environment
```bash
# Copy environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials
```

### Step 3: Start Redis
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Or manually
redis-server
```

## 🚀 Running the Application

### Option 1: Local Testing (No Telegram)
```bash
./local-test.sh
```
- Opens at: http://localhost:8082
- Use for development and testing
- No Telegram integration

### Option 2: With Telegram Integration
```bash
# First, get a valid ngrok token from https://dashboard.ngrok.com
npx ngrok config add-authtoken YOUR_AUTHTOKEN

# Then run
./start-telegram-bot.sh
```
- Creates public URL via ngrok
- Sets up Telegram webhook
- Accessible via @cbosdkbot

### Option 3: Docker (Alternative)
```bash
cd docker
docker-compose up
```

## 📱 Testing the Bot

### Local Browser Testing
1. Open http://localhost:8082
2. Click "Start Optimization Journey"
3. Type a business question
4. Watch real-time streaming response

### Telegram Testing
1. Open Telegram
2. Search for @cbosdkbot
3. Start conversation with /start
4. Click "🚀 Open CBO SDK" button
5. Mini app opens with full interface

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 8082
lsof -ti:8082 | xargs kill -9
```

#### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

#### ngrok Authentication Failed
- Current token appears invalid
- Get new token from: https://dashboard.ngrok.com/get-started/your-authtoken
- Configure: `npx ngrok config add-authtoken NEW_TOKEN`

#### WebSocket Connection Failed
- Check browser console for errors
- Ensure server is running on port 8082
- Check CORS settings in server/.env

## 📊 Architecture Overview

### Backend Architecture
- **Express Server**: Handles HTTP requests and serves frontend
- **WebSocket Server**: Real-time bidirectional communication
- **Claude Service**: Anthropic SDK integration with streaming
- **Session Manager**: Redis-based session persistence
- **Telegram Webhook**: Bot integration and mini app support

### Frontend Architecture
- **Pure Vanilla Stack**: No frameworks, just HTML/CSS/JS
- **WebSocket Bridge**: Manages real-time connection
- **Streaming UI**: Progressive message rendering
- **Telegram Web App SDK**: Mini app integration

### Data Flow
1. User sends message via UI
2. WebSocket transmits to server
3. Server calls Claude API with streaming
4. Stream chunks sent back via WebSocket
5. UI progressively renders response
6. Session saved to Redis

## 🚦 API Endpoints

### HTTP Endpoints
- `GET /` - Serve frontend application
- `GET /health` - Health check
- `GET /api/status` - Server status and metrics
- `POST /telegram/webhook` - Telegram webhook handler

### WebSocket Events
- `chat` - Send user message
- `stream.start` - Begin streaming response
- `stream.chunk` - Receive content chunk
- `stream.end` - Complete message
- `tool.use` - MCP tool invocation

## 🔐 Security Considerations

### Current Security Measures
- Environment variables for secrets
- CORS configuration
- WebSocket origin validation
- Session timeout management

### ⚠️ Security Warnings
1. **API Keys in .env**: Never commit .env to git
2. **Telegram Token**: Rotate if compromised
3. **ngrok URLs**: Changes on each restart
4. **Redis**: Not password protected (add in production)

## 📈 Performance Optimization

### Current Optimizations
- Streaming responses for better UX
- Static file serving from Express
- WebSocket on same port as HTTP
- Session caching in Redis

### Future Optimizations
- Add CDN for static assets
- Implement response caching
- Add database for conversation history
- Implement rate limiting

## 🔄 Deployment Options

### Option 1: DigitalOcean App Platform
```yaml
# See docker/docker-compose.yml for configuration
- Auto-deploy from GitHub
- Set environment variables in platform
- Use managed Redis
```

### Option 2: VPS with Docker
```bash
# Build and run with Docker
docker build -t claudebro-sdk .
docker run -p 8082:8082 claudebro-sdk
```

### Option 3: Vercel/Netlify (Frontend) + Railway (Backend)
- Deploy frontend to Vercel/Netlify
- Deploy backend to Railway with Redis
- Update WebSocket URL in frontend

## 📝 Maintenance Tasks

### Daily
- Monitor error logs
- Check Redis memory usage
- Verify bot responsiveness

### Weekly
- Review conversation logs
- Update Claude prompt if needed
- Check for dependency updates

### Monthly
- Rotate API keys
- Review security logs
- Update documentation

## 🐛 Known Issues

1. **ngrok Token Invalid**: Current token doesn't work
2. **Port Conflicts**: Sometimes port 3000 conflicts
3. **WebSocket Reconnection**: May need page refresh
4. **Mobile Keyboard**: Sometimes covers input on Telegram

## 🎯 Future Enhancements

### High Priority
- [ ] Fix ngrok authentication
- [ ] Add MCP tool integration (Notion, Supabase)
- [ ] Implement conversation history
- [ ] Add user authentication

### Medium Priority
- [ ] File upload support
- [ ] Export conversations
- [ ] Multi-language support
- [ ] Voice input/output

### Low Priority
- [ ] Analytics dashboard
- [ ] A/B testing framework
- [ ] Custom themes
- [ ] Webhook for external integrations

## 📞 Support & Contact

### Technical Issues
- Check error logs in console
- Review this documentation
- Test with local-test.sh first

### Bot Issues
- Verify bot token is valid
- Check Telegram webhook status
- Ensure ngrok is running

## ✅ Handover Checklist

### For New Developer
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Configure .env file
- [ ] Start Redis
- [ ] Run local-test.sh
- [ ] Test in browser
- [ ] Get valid ngrok token
- [ ] Test Telegram integration

### Access Needed
- [ ] GitHub repository access
- [ ] Anthropic API key
- [ ] Telegram bot token
- [ ] ngrok account
- [ ] Redis instance

### Documentation Review
- [ ] Read this HANDOVER.md
- [ ] Review SPARC-IMPLEMENTATION.md
- [ ] Check architecture.md
- [ ] Understand WebSocket flow

## 📅 Last Updated
- **Date**: January 7, 2025
- **Version**: 1.0.0
- **Status**: Working locally, Telegram integration needs valid ngrok token
- **Next Steps**: Get valid ngrok token for full Telegram functionality

---

## Quick Commands Reference

```bash
# Local development
./local-test.sh

# With Telegram (needs valid ngrok token)
./start-telegram-bot.sh

# Stop all services
lsof -ti:8082 | xargs kill -9
redis-cli shutdown

# Check status
curl http://localhost:8082/health
redis-cli ping

# View logs
tail -f server/logs/app.log  # If logging to file
```

## Important Notes

⚠️ **Critical**: The ngrok authtoken in .env appears to be invalid. You'll need to:
1. Sign up at https://ngrok.com
2. Get your authtoken from dashboard
3. Update the NGROK_AUTHTOKEN in server/.env
4. Run `npx ngrok config add-authtoken YOUR_TOKEN`

✅ **Working**: Local development server works perfectly at http://localhost:8082

📱 **Telegram Bot**: @cbosdkbot is configured but needs valid ngrok token for webhook