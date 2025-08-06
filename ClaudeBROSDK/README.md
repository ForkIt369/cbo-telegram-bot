# ClaudeBROSDK

A Telegram Mini App providing direct chat access to CBO BRO (Claude Sonnet 4) with integrated MCP tools, real-time streaming, and business optimization through the BroVerse Biz Mental Model™ (BBMM).

## 🚀 Features

- **Real-time Streaming**: Token-by-token responses using MessageStream API
- **MCP Tool Integration**: Seamless Notion and Supabase integration
- **Agent System**: Intelligent task delegation to specialized agents
- **Mode Switching**: Analyze, Create, Research, and Optimize modes
- **WebSocket Communication**: Bidirectional real-time messaging
- **Permission System**: Granular control over tool access
- **Session Management**: Context preservation across conversations

## 📁 Project Structure

```
ClaudeBROSDK/
├── server/                 # Backend Node.js service
│   ├── websocket/         # WebSocket handlers
│   ├── services/          # Core services (Claude, streaming)
│   ├── mcp/               # MCP tool integrations
│   └── agents/            # Agent system
├── src/                    # Frontend (vanilla JS/CSS/HTML)
│   ├── js/                # JavaScript modules
│   ├── css/               # Stylesheets
│   └── assets/            # Static assets
├── deploy/                 # Deployment configurations
└── docs/                   # Documentation
```

## 🛠️ Tech Stack

### Backend
- Node.js 18+
- Anthropic TypeScript SDK
- Express.js
- WebSocket (ws)
- Redis (session storage)

### Frontend
- Vanilla JavaScript
- Pure CSS
- HTML5
- Telegram WebApp API

### Infrastructure
- DigitalOcean App Platform
- CloudFlare CDN
- Redis Cloud

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Anthropic API key
- DigitalOcean account (for deployment)
- Telegram Bot Token (for Mini App)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/digitaldavinci/claudebrosdk.git
cd claudebrosdk
```

2. Install dependencies:
```bash
# Backend
cd server
npm install

# Frontend dependencies are minimal (no build required)
```

3. Configure environment variables:
```bash
cd server
cp .env.example .env
# Edit .env with your API keys
```

4. Start development servers:
```bash
# Backend (from server directory)
npm run dev

# Frontend (from root directory)
# Serve the src directory with any static server
npx serve src -p 3000
```

## 🚀 Quick Start

### Backend Setup

```javascript
// server/index.js
import { Anthropic } from '@anthropic-ai/sdk';
import { WebSocketServer } from 'ws';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// WebSocket server for real-time communication
const wss = new WebSocketServer({ port: 8081 });

wss.on('connection', (ws) => {
  // Handle streaming messages
});
```

### Frontend Integration

```javascript
// src/js/websocket.js
class ClaudeSDKBridge {
  constructor() {
    this.ws = new WebSocket('wss://your-domain.com/ws');
    this.setupEventHandlers();
  }
  
  async sendMessage(content) {
    this.ws.send(JSON.stringify({
      type: 'chat',
      content,
      sessionId: this.sessionId
    }));
  }
}
```

## 📱 Telegram Mini App Integration

1. Create a Telegram Bot via @BotFather
2. Set the Mini App URL:
```
/setmenubutton
https://your-domain.com
```

3. Configure in your HTML:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script>
  const tg = window.Telegram.WebApp;
  tg.ready();
</script>
```

## 🔐 Security

- API keys stored in environment variables
- WSS (WebSocket Secure) for encrypted communication
- Rate limiting per user
- Permission-based tool access
- Session timeout after inactivity

## 📊 Monitoring

The application includes built-in monitoring for:
- Response times (p50, p95, p99)
- Token usage per user
- Tool execution success rates
- WebSocket connection stability
- Error rates by type

## 🚢 Deployment

### DigitalOcean App Platform

1. Fork this repository
2. Connect to DigitalOcean App Platform
3. Configure environment variables
4. Deploy with:
```bash
doctl apps create --spec deploy/digitalocean.yaml
```

### Docker (Alternative)

```bash
docker-compose -f deploy/docker-compose.yml up
```

## 📖 Documentation

- [SPARC Implementation Plan](docs/SPARC-IMPLEMENTATION.md) - Complete technical specification
- [API Documentation](docs/API.md) - WebSocket protocol and endpoints
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment steps
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Anthropic for the Claude API
- DigitalOcean for hosting infrastructure
- The BroVerse community for continuous support

## 📞 Support

- **Documentation**: [docs.claudebrosdk.com](https://docs.claudebrosdk.com)
- **Issues**: [GitHub Issues](https://github.com/digitaldavinci/claudebrosdk/issues)
- **Discord**: [Join our community](https://discord.gg/claudebrosdk)

## 🚀 Roadmap

- [ ] Voice input/output support
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom tools
- [ ] Mobile native apps

---

Built with ❤️ by Digital DaVinci and the BroVerse Team