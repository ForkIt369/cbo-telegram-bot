# WebSocket Bridge Documentation

## Overview

The ClaudeSDKBridge provides real-time bidirectional communication between the frontend and server, handling message streaming, reconnection logic, and session management.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    ClaudeSDKBridge                        │
├──────────────────────────────────────────────────────────┤
│  Core Features:                                           │
│  • Session Management (localStorage)                      │
│  • Automatic Reconnection with Exponential Backoff        │
│  • Message Queuing During Disconnection                   │
│  • Event Emitter Pattern for Decoupling                   │
│  • Stream Buffer Management                               │
├──────────────────────────────────────────────────────────┤
│  Connection States:                                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐             │
│  │Connecting│→ │ Connected │→ │Disconnect│              │
│  └──────────┘  └───────────┘  └──────────┘             │
│       ↑              ↓              ↓                    │
│       └──────── Reconnecting ←──────┘                    │
└──────────────────────────────────────────────────────────┘
```

## Connection Management

### Connection Flow

```javascript
connect() → WebSocket Creation → Connection Events
              ↓                        ↓
         Session ID              onopen Handler
         Generation                   ↓
              ↓                  Connected State
         localStorage                 ↓
         Storage              Message Processing
```

### Implementation Details

```javascript
class ClaudeSDKBridge {
  constructor(config = {}) {
    this.wsUrl = config.wsUrl || 'ws://localhost:8084';
    this.sessionId = this.getOrCreateSessionId();
    this.ws = null;
    this.messageQueue = [];
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
    this.currentMessageId = null;
    this.streamBuffer = '';
  }

  connect() {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.wsUrl}?sessionId=${this.sessionId}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
        this.emit('connected', { sessionId: this.sessionId });
        resolve();
      };
      
      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected');
        this.attemptReconnect();
      };
    });
  }
}
```

## Message Protocol

### Message Types

```
Client → Server:
┌──────────────┬─────────────────────────────────────┐
│ Message Type │ Description                         │
├──────────────┼─────────────────────────────────────┤
│ chat         │ User chat message                   │
│ tool         │ Tool execution request              │
│ mode         │ Mode change request                 │
│ session      │ Session management                  │
└──────────────┴─────────────────────────────────────┘

Server → Client:
┌─────────────────────┬──────────────────────────────┐
│ Message Type        │ Description                  │
├─────────────────────┼──────────────────────────────┤
│ connection.established │ Connection confirmed       │
│ session.restored    │ Session data restored        │
│ stream.start        │ Stream beginning             │
│ stream.chunk        │ Stream data chunk            │
│ stream.end          │ Stream completion            │
│ stream.error        │ Stream error                 │
│ tool.use            │ Tool execution status        │
│ tool.result         │ Tool execution result        │
│ mode.changed        │ Mode change confirmation     │
│ error               │ General error                │
└─────────────────────┴──────────────────────────────┘
```

### Message Structure

```javascript
// Chat Message
{
  type: 'chat',
  content: 'User message content',
  sessionId: 'uuid-v4',
  timestamp: 1699123456789,
  mode: 'analyze',
  metadata: {
    // Optional metadata
  }
}

// Stream Chunk
{
  type: 'stream.chunk',
  messageId: 'msg-uuid',
  content: 'Partial response...',
  index: 5,
  totalChunks: null // Unknown until complete
}

// Tool Request
{
  type: 'tool',
  tool: 'notion.search',
  params: {
    query: 'business metrics',
    database: 'knowledge-base'
  },
  sessionId: 'uuid-v4'
}
```

## Session Management

### Session Lifecycle

```
┌──────────────────┐
│  Session Create  │
│  (First Visit)   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Generate UUID   │
│  Store Locally   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Connect with    │
│    Session ID    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Server Creates  │
│  Session Object  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Session Active │
│  (Messages Flow) │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Disconnection   │
│ (Session Saved)  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Reconnection   │
│(Session Restored)│
└──────────────────┘
```

### Session Storage

```javascript
getOrCreateSessionId() {
  let sessionId = localStorage.getItem('claudebro_session_id');
  if (!sessionId) {
    sessionId = this.generateUUID();
    localStorage.setItem('claudebro_session_id', sessionId);
  }
  return sessionId;
}

clearSession() {
  localStorage.removeItem('claudebro_session_id');
  this.sessionId = this.generateUUID();
  localStorage.setItem('claudebro_session_id', this.sessionId);
  
  if (this.isConnected) {
    this.disconnect();
    this.connect();
  }
}
```

## Stream Handling

### Stream Processing Flow

```
Stream Start → Buffer Initialize → Chunk Reception
     ↓              ↓                    ↓
Event Emit    Clear Buffer      Append to Buffer
     ↓              ↓                    ↓
UI Creates    Ready for Data     Event Emit
Message El                             ↓
                                 UI Updates
                                       ↓
                              Stream End/Error
                                       ↓
                               Final Processing
                                       ↓
                                Buffer Clear
```

### Stream Implementation

```javascript
handleStreamStart(message) {
  this.currentMessageId = message.messageId;
  this.streamBuffer = '';
  this.emit('streamStart', {
    messageId: message.messageId,
    mode: message.mode
  });
}

handleStreamChunk(message) {
  this.streamBuffer += message.content;
  this.emit('streamChunk', {
    content: message.content,
    messageId: message.messageId,
    fullContent: this.streamBuffer
  });
}

handleStreamEnd(message) {
  this.emit('streamEnd', {
    messageId: message.messageId,
    message: message.message,
    fullContent: this.streamBuffer
  });
  this.currentMessageId = null;
  this.streamBuffer = '';
}
```

## Reconnection Strategy

### Exponential Backoff

```
Attempt 1: 1000ms delay
Attempt 2: 2000ms delay
Attempt 3: 4000ms delay
Attempt 4: 8000ms delay
Attempt 5: 16000ms delay
Failed: Stop attempting
```

### Implementation

```javascript
attemptReconnect() {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
    this.emit('reconnectFailed');
    return;
  }

  this.reconnectAttempts++;
  const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
  
  console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
  this.emit('reconnecting', {
    attempt: this.reconnectAttempts,
    delay
  });

  setTimeout(() => {
    this.connect();
  }, delay);
}
```

## Event System

### Event Emitter Pattern

```javascript
┌─────────────────────────────────────┐
│          Event Emitter              │
├─────────────────────────────────────┤
│  Events Map:                        │
│  ┌─────────────────────────────┐   │
│  │ 'connected': [handler1, ...] │   │
│  │ 'streamChunk': [handler2]    │   │
│  │ 'error': [handler3, handler4]│   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────┤
│  Methods:                           │
│  • on(event, handler)               │
│  • off(event, handler)              │
│  • emit(event, data)                │
└─────────────────────────────────────┘
```

### Event Registration

```javascript
// Register event handlers
bridge.on('connected', (data) => {
  console.log('Connected with session:', data.sessionId);
  updateConnectionStatus(true);
});

bridge.on('streamChunk', (data) => {
  updateMessageContent(data.messageId, data.fullContent);
});

bridge.on('error', (error) => {
  showErrorNotification(error);
});

// Emit events
emit(event, data) {
  if (this.eventHandlers.has(event)) {
    const handlers = this.eventHandlers.get(event);
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}
```

## Message Queue System

### Queue Management

```
┌──────────────────────────────────────┐
│         Message Queue                │
├──────────────────────────────────────┤
│  When Disconnected:                  │
│  ┌─────────────────────────────┐    │
│  │ Queue: [msg1, msg2, msg3]   │    │
│  └─────────────────────────────┘    │
│                ↓                     │
│         On Reconnection:             │
│                ↓                     │
│  ┌─────────────────────────────┐    │
│  │ Flush Queue → Send Messages │    │
│  └─────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Implementation

```javascript
sendMessage(content, options = {}) {
  const message = {
    type: 'chat',
    content,
    sessionId: this.sessionId,
    timestamp: Date.now(),
    ...options
  };

  if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
    this.ws.send(JSON.stringify(message));
  } else {
    this.messageQueue.push(message);
    if (!this.isConnected) {
      this.connect();
    }
  }
}

flushMessageQueue() {
  while (this.messageQueue.length > 0 && this.isConnected) {
    const message = this.messageQueue.shift();
    this.ws.send(JSON.stringify(message));
  }
}
```

## Error Handling

### Error Types and Recovery

```javascript
const errorHandlers = {
  'CONNECTION_FAILED': () => {
    // Attempt reconnection
    this.attemptReconnect();
  },
  'AUTHENTICATION_FAILED': () => {
    // Clear session and restart
    this.clearSession();
  },
  'RATE_LIMIT': (error) => {
    // Wait and retry
    setTimeout(() => this.retry(error.request), error.retryAfter);
  },
  'STREAM_ERROR': (error) => {
    // Clean up stream state
    this.streamBuffer = '';
    this.currentMessageId = null;
  }
};
```

## Performance Optimizations

### Connection Pooling
```javascript
class ConnectionPool {
  constructor(maxConnections = 3) {
    this.connections = [];
    this.maxConnections = maxConnections;
    this.currentIndex = 0;
  }
  
  getConnection() {
    if (this.connections.length < this.maxConnections) {
      const conn = new ClaudeSDKBridge();
      this.connections.push(conn);
      return conn;
    }
    
    const conn = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.connections.length;
    return conn;
  }
}
```

### Message Batching
```javascript
class MessageBatcher {
  constructor(batchSize = 10, flushInterval = 100) {
    this.batch = [];
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.timer = null;
  }
  
  add(message) {
    this.batch.push(message);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }
  
  flush() {
    if (this.batch.length > 0) {
      this.sendBatch(this.batch);
      this.batch = [];
    }
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
```

## Testing WebSocket Connection

### Mock WebSocket for Testing
```javascript
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }
  
  send(data) {
    // Simulate server response
    setTimeout(() => {
      this.onmessage?.({
        data: JSON.stringify({
          type: 'stream.chunk',
          content: 'Mock response'
        })
      });
    }, 50);
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }
}
```

## Next Steps
- [Server WebSocket Handler →](../server/websocket-handler.md)
- [Session Management →](../server/sessions.md)
- [Deployment Configuration →](../deployment/docker.md)