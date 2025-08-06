const logger = require('../../utils/logger');

/**
 * HTTP-based transport for MCP communication
 * Replaces StdioClientTransport for production environments
 */
class HttpClientTransport {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.headers = config.headers || {};
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.connected = false;
    
    // For SSE support
    this.eventSource = null;
    this.useSSE = config.transport === 'sse';
    
    // Message handling
    this.messageHandlers = new Map();
    this.requestId = 0;
  }

  async connect() {
    try {
      // Test connection
      const response = await this._fetch('/health', { method: 'GET' });
      
      if (!response.ok) {
        throw new Error(`Server health check failed: ${response.status}`);
      }

      // For SSE, establish persistent connection
      if (this.useSSE) {
        await this._connectSSE();
      }

      this.connected = true;
      logger.info(`Connected to MCP server at ${this.endpoint}`);
      
    } catch (error) {
      logger.error(`Failed to connect to MCP server: ${error.message}`);
      throw error;
    }
  }

  async _connectSSE() {
    return new Promise((resolve, reject) => {
      const EventSource = require('eventsource');
      
      this.eventSource = new EventSource(`${this.endpoint}/events`, {
        headers: this.headers
      });

      this.eventSource.onopen = () => {
        logger.info('SSE connection established');
        resolve();
      };

      this.eventSource.onerror = (error) => {
        logger.error('SSE connection error:', error);
        reject(error);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (error) {
          logger.error('Failed to parse SSE message:', error);
        }
      };
    });
  }

  async send(message) {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    // Add request ID for tracking
    const requestId = ++this.requestId;
    const messageWithId = { ...message, id: requestId };

    try {
      const response = await this._fetch('/rpc', {
        method: 'POST',
        body: JSON.stringify(messageWithId)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`RPC request failed: ${error}`);
      }

      const result = await response.json();
      
      // For SSE, responses come through event stream
      if (this.useSSE) {
        return new Promise((resolve, reject) => {
          this.messageHandlers.set(requestId, { resolve, reject });
          
          // Timeout handler
          setTimeout(() => {
            if (this.messageHandlers.has(requestId)) {
              this.messageHandlers.delete(requestId);
              reject(new Error('Request timeout'));
            }
          }, this.timeout);
        });
      }
      
      return result;
      
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async _fetch(path, options = {}) {
    const url = `${this.endpoint}${path}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      return response;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  _handleMessage(message) {
    // Handle response to a request
    if (message.id && this.messageHandlers.has(message.id)) {
      const handler = this.messageHandlers.get(message.id);
      this.messageHandlers.delete(message.id);
      
      if (message.error) {
        handler.reject(new Error(message.error.message));
      } else {
        handler.resolve(message.result);
      }
    }
    
    // Handle server-initiated messages (notifications)
    if (message.method && !message.id) {
      logger.info(`Received notification: ${message.method}`);
      // Could emit events here if needed
    }
  }

  async close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.connected = false;
    this.messageHandlers.clear();
    
    logger.info('HTTP transport closed');
  }

  // Implement required transport interface methods
  onMessage(handler) {
    // For compatibility with MCP SDK
    this._messageHandler = handler;
  }

  onError(handler) {
    this._errorHandler = handler;
  }

  onClose(handler) {
    this._closeHandler = handler;
  }

  // Start reading messages (for SDK compatibility)
  async start() {
    if (!this.connected) {
      await this.connect();
    }
  }
}

module.exports = HttpClientTransport;