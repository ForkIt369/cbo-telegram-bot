// Advanced WebSocket Manager with exponential backoff and state management
class WebSocketManager {
  constructor(userId, onMessage, onStatusChange) {
    this.userId = userId;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.messageQueue = [];
    this.isConnecting = false;
    this.lastPingTime = null;
    this.connectionState = 'disconnected';
  }

  connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.updateStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${this.userId}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.updateStatus('connected');
      this.startHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle ping/pong for connection health
        if (data.type === 'pong') {
          this.lastPingTime = Date.now();
          return;
        }
        
        this.onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('error');
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      this.updateStatus('disconnected');
      
      // Don't reconnect if it was a clean close
      if (event.code !== 1000 && event.code !== 1001) {
        this.handleReconnect();
      }
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.updateStatus('reconnecting');

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Check if last ping was acknowledged
        if (this.lastPingTime && Date.now() - this.lastPingTime > 60000) {
          console.warn('Heartbeat timeout, reconnecting...');
          this.ws.close();
          this.handleReconnect();
          return;
        }
        
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      // Queue message for sending when connection is restored
      this.messageQueue.push(data);
      
      // Limit queue size to prevent memory issues
      if (this.messageQueue.length > 100) {
        this.messageQueue.shift(); // Remove oldest message
      }
      
      // Try to reconnect if not already connecting
      if (!this.isConnecting) {
        this.connect();
      }
      
      return false;
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  updateStatus(status) {
    this.connectionState = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
    
    this.messageQueue = [];
    this.updateStatus('disconnected');
  }

  getState() {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      isConnecting: this.isConnecting
    };
  }
}

export default WebSocketManager;