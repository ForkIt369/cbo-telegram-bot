# CBO Mini App - Complete Technical Documentation

## 📚 Table of Contents

1. [Architecture Overview](./architecture/overview.md)
2. [Component Documentation](./components/)
   - [Frontend Components](./components/frontend.md)
   - [WebSocket Bridge](./components/websocket.md)
   - [UI Components](./components/ui-components.md)
3. [Server Documentation](./server/)
   - [API Endpoints](./server/api.md)
   - [WebSocket Handler](./server/websocket-handler.md)
   - [Session Management](./server/sessions.md)
4. [AI Agent Documentation](./ai-agent/)
   - [Claude Integration](./ai-agent/claude-integration.md)
   - [System Prompts](./ai-agent/system-prompts.md)
   - [Tool Configuration](./ai-agent/tools.md)
5. [Deployment](./deployment/)
   - [Docker Setup](./deployment/docker.md)
   - [Environment Configuration](./deployment/environment.md)
   - [Production Deployment](./deployment/production.md)

## 🚀 Quick Start

The CBO Mini App is a sophisticated Telegram Web App that provides business optimization consulting through the BroVerse Biz Mental Model™ (BBMM) framework, powered by Claude 3.5 Sonnet.

### Key Features
- Real-time WebSocket communication
- Streaming AI responses
- Session persistence
- Multi-mode operation (Analyze, Create, Research, Optimize)
- Tool integration capabilities
- MCP (Model Context Protocol) ready architecture

### Technology Stack
```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│  HTML5 • CSS3 • Vanilla JS • Telegram Web API   │
└─────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────┐
│               WebSocket Bridge                  │
│         Real-time bidirectional comms           │
└─────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────┐
│                 Node.js Server                  │
│     Express • WebSocket Server • Winston        │
└─────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────┐
│               Claude AI Service                 │
│        Anthropic SDK • Tool Integration         │
└─────────────────────────────────────────────────┘
```

## 🏗️ Project Structure

```
ClaudeBROSDK/
├── src/                    # Frontend application
│   ├── index.html         # Main HTML entry point
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Main application logic
│   │   └── websocket.js   # WebSocket bridge client
│   ├── css/               # Styling
│   │   ├── main.css       # Main styles
│   │   └── chat.css       # Chat interface styles
│   └── assets/            # Static assets
│       └── avatars/       # User and CBO avatars
├── server/                # Backend server
│   ├── index.js           # Server entry point
│   ├── services/          # Service layer
│   │   └── claude.js      # Claude AI integration
│   ├── websocket/         # WebSocket handling
│   │   ├── handler.js     # WebSocket event handler
│   │   └── sessions.js    # Session management
│   └── telegram-webhook.js # Telegram integration
├── docker/                # Docker configuration
│   ├── Dockerfile         # Container definition
│   └── docker-compose.yml # Multi-container setup
└── scripts/               # Utility scripts
    ├── docker-start.sh    # Docker startup script
    └── test-local.sh      # Local testing script
```

## 🔄 Data Flow Architecture

```
User Input → Frontend UI → WebSocket Client → WebSocket Server
    ↓                                              ↓
[Session Storage]                          [Session Manager]
                                                   ↓
                                            [Claude Service]
                                                   ↓
                                            [AI Processing]
                                                   ↓
WebSocket Server ← Stream Handler ← Response Generation
    ↓
WebSocket Client → UI Update → User Display
```

## 🎯 Core Components

### Frontend Layer
- **ClaudeBROApp**: Main application controller
- **ClaudeSDKBridge**: WebSocket communication layer
- **UI Components**: Chat interface, message display, mode switcher

### Server Layer
- **Express Server**: HTTP endpoints and static serving
- **WebSocket Server**: Real-time communication
- **Session Manager**: User session persistence
- **Claude Service**: AI integration and tool handling

### AI Integration
- **System Prompts**: BBMM framework implementation
- **Tool System**: Extensible tool integration
- **MCP Ready**: Prepared for Model Context Protocol integration

## 📖 Navigation

- [Start with Architecture Overview →](./architecture/overview.md)
- [Explore Frontend Components →](./components/frontend.md)
- [Understand AI Configuration →](./ai-agent/claude-integration.md)
- [Learn Deployment Process →](./deployment/docker.md)