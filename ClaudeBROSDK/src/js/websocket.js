class ClaudeSDKBridge {
  constructor(config = {}) {
    // Use production WebSocket URL when in production, fallback to localhost for dev
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = isProduction ? window.location.host : 'localhost:8084';
    this.wsUrl = config.wsUrl || `${wsProtocol}//${wsHost}/ws`;
    this.sessionId = config.sessionId || this.getOrCreateSessionId();
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

  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('claudebro_session_id');
    if (!sessionId) {
      sessionId = this.generateUUID();
      localStorage.setItem('claudebro_session_id', sessionId);
    }
    return sessionId;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.wsUrl}?sessionId=${this.sessionId}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          this.emit('connected', { sessionId: this.sessionId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('Connection error:', error);
        reject(error);
      }
    });
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message.type);
      
      switch (message.type) {
        case 'connection.established':
          this.handleConnectionEstablished(message);
          break;
        case 'session.restored':
          this.handleSessionRestored(message);
          break;
        case 'stream.start':
          this.handleStreamStart(message);
          break;
        case 'stream.chunk':
          this.handleStreamChunk(message);
          break;
        case 'stream.end':
          this.handleStreamEnd(message);
          break;
        case 'stream.error':
          this.handleStreamError(message);
          break;
        case 'tool.use':
          this.handleToolUse(message);
          break;
        case 'tool.result':
          this.handleToolResult(message);
          break;
        case 'mode.changed':
          this.handleModeChanged(message);
          break;
        case 'error':
          this.handleError(message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
      
      this.emit(message.type, message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  handleConnectionEstablished(message) {
    this.sessionId = message.sessionId;
    localStorage.setItem('claudebro_session_id', this.sessionId);
  }

  handleSessionRestored(message) {
    this.emit('history', message.messages);
    this.emit('context', message.context);
  }

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

  handleStreamError(message) {
    this.emit('streamError', {
      messageId: message.messageId,
      error: message.error
    });
    this.currentMessageId = null;
    this.streamBuffer = '';
  }

  handleToolUse(message) {
    this.emit('toolStatus', {
      tool: message.tool,
      status: message.status
    });
  }

  handleToolResult(message) {
    this.emit('toolResult', {
      tool: message.tool,
      result: message.result,
      status: message.status
    });
  }

  handleModeChanged(message) {
    this.emit('modeChanged', {
      mode: message.mode,
      message: message.message
    });
  }

  handleError(message) {
    console.error('Server error:', message.error);
    this.emit('serverError', message.error);
  }

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

  sendToolRequest(tool, params) {
    const message = {
      type: 'tool',
      tool,
      params,
      sessionId: this.sessionId
    };

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  changeMode(mode) {
    const message = {
      type: 'mode',
      mode,
      sessionId: this.sessionId
    };

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

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

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

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

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      sessionId: this.sessionId,
      reconnectAttempts: this.reconnectAttempts
    };
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClaudeSDKBridge;
}