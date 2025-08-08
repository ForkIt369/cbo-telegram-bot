# Architecture Overview

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              TELEGRAM CLIENT                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         Telegram Web App                           │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │                      CBO Mini App UI                         │ │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐       │ │ │
│  │  │  │   Header    │  │  Chat View  │  │  Mode Panel  │       │ │ │
│  │  │  │ Connection  │  │  Messages   │  │  - Analyze   │       │ │ │
│  │  │  │   Status    │  │  Streaming  │  │  - Create    │       │ │ │
│  │  │  └─────────────┘  └─────────────┘  │  - Research  │       │ │ │
│  │  │                                      │  - Optimize  │       │ │ │
│  │  │  ┌──────────────────────────────────┴──────────────┘       │ │ │
│  │  │  │              Input Bar & Controls                        │ │ │
│  │  │  └───────────────────────────────────────────────────────────┘ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                           WEBSOCKET BRIDGE                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     ClaudeSDKBridge (Client)                       │ │
│  │  • Session Management (localStorage)                               │ │
│  │  • Message Queuing & Retry Logic                                   │ │
│  │  • Event Emitter Pattern                                           │ │
│  │  • Automatic Reconnection                                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WS Protocol
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                            NODE.JS SERVER                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      WebSocket Handler                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐         │ │
│  │  │   Session    │  │   Message    │  │    Stream      │         │ │
│  │  │   Manager    │  │   Router     │  │    Manager     │         │ │
│  │  └──────────────┘  └──────────────┘  └────────────────┘         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        Express Server                              │ │
│  │  • /health - Health check endpoint                                 │ │
│  │  • /api/status - System status                                     │ │
│  │  • /webhook/* - Telegram webhook handlers                          │ │
│  │  • Static file serving for mini-app                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API Calls
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLAUDE AI SERVICE                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Anthropic SDK Integration                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐         │ │
│  │  │   Message    │  │   Streaming  │  │     Tool       │         │ │
│  │  │  Formatting  │  │   Handler    │  │   Executor     │         │ │
│  │  └──────────────┘  └──────────────┘  └────────────────┘         │ │
│  │                                                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │                    BBMM Framework Logic                      │ │ │
│  │  │  • Value Flow Analysis    • Info Flow Analysis              │ │ │
│  │  │  • Work Flow Analysis     • Cash Flow Analysis              │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Tool Calls
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL INTEGRATIONS                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Notion    │  │  Supabase   │  │   Custom    │  │     MCP     │   │
│  │     API     │  │     API     │  │    Tools    │  │   Servers   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component Interactions

### 1. Client-Server Communication Flow

```
[User Input] 
     ↓
[ClaudeBROApp.sendMessage()]
     ↓
[ClaudeSDKBridge.sendMessage()]
     ↓
[WebSocket.send({
   type: 'chat',
   content: message,
   sessionId: uuid,
   mode: currentMode
})]
     ↓
[WebSocketHandler.handleMessage()]
     ↓
[SessionManager.getSession()]
     ↓
[ClaudeService.createStreamingMessage()]
     ↓
[Stream chunks back via WebSocket]
     ↓
[ClaudeSDKBridge.handleStreamChunk()]
     ↓
[ClaudeBROApp.updateUI()]
     ↓
[User sees response]
```

### 2. Session Management Architecture

```
┌─────────────────────────────────────┐
│         Session Manager             │
├─────────────────────────────────────┤
│ Sessions Map:                       │
│ ┌─────────────────────────────────┐ │
│ │ sessionId_1: {                  │ │
│ │   id: "uuid-1",                 │ │
│ │   messages: [...],              │ │
│ │   context: {                    │ │
│ │     mode: "analyze",            │ │
│ │     tools: [...],               │ │
│ │     permissions: {...}          │ │
│ │   },                            │ │
│ │   createdAt: timestamp,         │ │
│ │   lastActivity: timestamp       │ │
│ │ }                                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Methods:                            │
│ • createSession()                   │
│ • getSession()                      │
│ • updateSession()                   │
│ • deleteSession()                   │
│ • cleanupInactive()                 │
└─────────────────────────────────────┘
```

### 3. Message Protocol Structure

```javascript
// Client → Server Messages
{
  type: "chat" | "tool" | "mode",
  content: string,
  sessionId: string,
  timestamp: number,
  mode?: "analyze" | "create" | "research" | "optimize",
  tool?: string,
  params?: object
}

// Server → Client Messages
{
  type: "stream.start" | "stream.chunk" | "stream.end" | "error",
  messageId: string,
  content?: string,
  error?: string,
  metadata?: {
    mode: string,
    tool?: string,
    tokens?: number
  }
}
```

## Key Design Patterns

### 1. Event-Driven Architecture
- WebSocket events trigger handlers
- Event emitter pattern for decoupling
- Asynchronous message processing

### 2. Stream Processing
- Real-time AI response streaming
- Chunk-based message delivery
- Buffer management for partial responses

### 3. Singleton Services
- SessionManager instance
- ClaudeService instance
- WebSocketHandler instance

### 4. Factory Pattern
- Message creation
- Tool handler instantiation
- Response formatting

## Scalability Considerations

### Horizontal Scaling
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Server 1 │     │ Server 2 │     │ Server N │
└──────────┘     └──────────┘     └──────────┘
      ↓                ↓                ↓
┌──────────────────────────────────────────┐
│           Redis Session Store            │
└──────────────────────────────────────────┘
      ↓                ↓                ↓
┌──────────────────────────────────────────┐
│         Shared Claude API Pool           │
└──────────────────────────────────────────┘
```

### Performance Optimizations
1. **Connection Pooling**: Reuse WebSocket connections
2. **Message Queuing**: Buffer messages during high load
3. **Session Caching**: In-memory session storage
4. **Stream Buffering**: Optimize chunk sizes
5. **Lazy Loading**: Load components on demand

## Security Architecture

### Authentication Flow
```
[Telegram User] → [Web App] → [Telegram.WebApp.initData]
                                        ↓
                              [Server Validation]
                                        ↓
                              [Session Creation]
                                        ↓
                              [Secure WebSocket]
```

### Security Measures
1. **Session Validation**: UUID-based sessions
2. **Input Sanitization**: XSS prevention
3. **Rate Limiting**: API call throttling
4. **CORS Configuration**: Origin whitelisting
5. **Environment Variables**: Secure credential storage

## Next Steps
- [Frontend Components →](../components/frontend.md)
- [Server Architecture →](../server/api.md)
- [AI Agent Configuration →](../ai-agent/claude-integration.md)