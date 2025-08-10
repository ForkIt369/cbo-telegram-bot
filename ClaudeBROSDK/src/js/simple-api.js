// Simple API client for SDK Mini App in production
class SimpleSDKClient {
  constructor() {
    // Determine if we're in production or development
    this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    this.apiBase = this.isProduction ? '/sdk/api' : 'http://localhost:3003/sdk/api';
    this.sessionId = this.getOrCreateSessionId();
  }

  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('sdk_session_id');
    if (!sessionId) {
      sessionId = 'sdk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sdk_session_id', sessionId);
    }
    return sessionId;
  }

  async sendMessage(message) {
    try {
      const response = await fetch(`${this.apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}

// Override the WebSocket client with simple API client in production
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  window.ClaudeSDKBridge = class {
    constructor(config = {}) {
      this.client = new SimpleSDKClient();
      this.eventHandlers = new Map();
      this.isConnected = true;
    }

    async connect() {
      // Simulate connection
      setTimeout(() => {
        this.emit('connected', { sessionId: this.client.sessionId });
      }, 100);
      return Promise.resolve();
    }

    on(event, handler) {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event).push(handler);
    }

    emit(event, data) {
      const handlers = this.eventHandlers.get(event) || [];
      handlers.forEach(handler => handler(data));
    }

    async sendMessage(message, options = {}) {
      const messageId = Date.now().toString();
      
      // Emit stream start
      this.emit('streamStart', { 
        messageId, 
        role: 'assistant',
        timestamp: new Date().toISOString()
      });

      try {
        // Send message and get response
        const response = await this.client.sendMessage(message);
        
        // Simulate streaming by breaking response into chunks
        const words = response.split(' ');
        let accumulated = '';
        
        for (let i = 0; i < words.length; i++) {
          accumulated += (i > 0 ? ' ' : '') + words[i];
          this.emit('streamChunk', {
            messageId,
            content: accumulated,
            timestamp: new Date().toISOString()
          });
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 30));
        }

        // Emit stream end
        this.emit('streamEnd', {
          messageId,
          content: response,
          timestamp: new Date().toISOString()
        });

        return { messageId, content: response };
      } catch (error) {
        this.emit('streamError', {
          messageId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    }

    disconnect() {
      this.isConnected = false;
      this.emit('disconnected');
    }
  };
}