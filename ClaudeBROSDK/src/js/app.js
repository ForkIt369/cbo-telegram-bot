class ClaudeBROApp {
  constructor() {
    this.bridge = null;
    this.currentMode = 'analyze';
    this.isStreaming = false;
    this.messageElements = new Map();
    this.init();
  }

  async init() {
    console.log('Initializing ClaudeBRO App...');
    
    // Initialize WebSocket bridge
    this.bridge = new ClaudeSDKBridge({
      wsUrl: this.getWebSocketUrl()
    });

    // Setup event handlers
    this.setupEventHandlers();
    
    // Connect to WebSocket
    try {
      await this.bridge.connect();
      console.log('Connected to ClaudeBRO server');
      this.updateConnectionStatus(true);
    } catch (error) {
      console.error('Failed to connect:', error);
      this.updateConnectionStatus(false);
    }

    // Setup UI event handlers
    this.setupUIHandlers();
  }

  getWebSocketUrl() {
    // In production, use wss:// with your domain
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = host === 'localhost' ? ':8081' : '';
    return `${protocol}//${host}${port}`;
  }

  setupEventHandlers() {
    // Connection events
    this.bridge.on('connected', (data) => {
      console.log('Connected with session:', data.sessionId);
      this.updateConnectionStatus(true);
    });

    this.bridge.on('disconnected', () => {
      console.log('Disconnected from server');
      this.updateConnectionStatus(false);
    });

    this.bridge.on('reconnecting', (data) => {
      console.log(`Reconnecting... Attempt ${data.attempt}`);
      this.showNotification(`Reconnecting... (${data.attempt}/${5})`, 'warning');
    });

    // Streaming events
    this.bridge.on('streamStart', (data) => {
      this.handleStreamStart(data);
    });

    this.bridge.on('streamChunk', (data) => {
      this.handleStreamChunk(data);
    });

    this.bridge.on('streamEnd', (data) => {
      this.handleStreamEnd(data);
    });

    this.bridge.on('streamError', (data) => {
      this.handleStreamError(data);
    });

    // Tool events
    this.bridge.on('toolStatus', (data) => {
      this.handleToolStatus(data);
    });

    this.bridge.on('toolResult', (data) => {
      this.handleToolResult(data);
    });

    // Session events
    this.bridge.on('history', (messages) => {
      this.loadMessageHistory(messages);
    });

    this.bridge.on('context', (context) => {
      this.updateContext(context);
    });

    // Mode events
    this.bridge.on('modeChanged', (data) => {
      this.handleModeChange(data);
    });

    // Error events
    this.bridge.on('serverError', (error) => {
      this.showNotification(`Error: ${error}`, 'error');
    });
  }

  setupUIHandlers() {
    // Message input
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    // Mode switcher (if exists)
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        if (mode) {
          this.changeMode(mode);
        }
      });
    });

    // Attach button (if exists)
    const attachBtn = document.getElementById('attachBtn');
    if (attachBtn) {
      attachBtn.addEventListener('click', () => this.handleAttachment());
    }
  }

  sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || !input.value.trim() || this.isStreaming) {
      return;
    }

    const content = input.value.trim();
    input.value = '';

    // Add user message to UI
    this.addMessage('user', content);

    // Send via WebSocket
    this.bridge.sendMessage(content, {
      mode: this.currentMode
    });
  }

  handleStreamStart(data) {
    console.log('Stream started:', data.messageId);
    this.isStreaming = true;
    
    // Create assistant message element
    const messageEl = this.addMessage('assistant', '', data.messageId);
    this.messageElements.set(data.messageId, messageEl);
    
    // Add typing indicator
    this.addTypingIndicator(messageEl);
  }

  handleStreamChunk(data) {
    const messageEl = this.messageElements.get(data.messageId);
    if (messageEl) {
      const contentEl = messageEl.querySelector('.message-content');
      if (contentEl) {
        // Remove typing indicator if present
        const typingIndicator = contentEl.querySelector('.typing-indicator');
        if (typingIndicator) {
          typingIndicator.remove();
        }
        
        // Update content
        contentEl.textContent = data.fullContent;
        
        // Auto-scroll to bottom
        this.scrollToBottom();
      }
    }
  }

  handleStreamEnd(data) {
    console.log('Stream ended:', data.messageId);
    this.isStreaming = false;
    
    const messageEl = this.messageElements.get(data.messageId);
    if (messageEl) {
      const contentEl = messageEl.querySelector('.message-content');
      if (contentEl) {
        contentEl.textContent = data.fullContent;
      }
      
      // Remove from tracking
      this.messageElements.delete(data.messageId);
    }
  }

  handleStreamError(data) {
    console.error('Stream error:', data.error);
    this.isStreaming = false;
    
    const messageEl = this.messageElements.get(data.messageId);
    if (messageEl) {
      const contentEl = messageEl.querySelector('.message-content');
      if (contentEl) {
        contentEl.innerHTML = `<span class="error-message">Error: ${data.error}</span>`;
      }
      
      this.messageElements.delete(data.messageId);
    }
    
    this.showNotification(`Stream error: ${data.error}`, 'error');
  }

  handleToolStatus(data) {
    console.log('Tool status:', data);
    
    // Show tool usage indicator
    const indicator = document.createElement('div');
    indicator.className = 'tool-indicator';
    indicator.innerHTML = `
      <span class="tool-icon">🔧</span>
      <span class="tool-name">${data.tool}</span>
      <span class="tool-status">${data.status}</span>
    `;
    
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.appendChild(indicator);
      
      // Remove after 3 seconds
      setTimeout(() => indicator.remove(), 3000);
    }
  }

  handleToolResult(data) {
    console.log('Tool result:', data);
    
    // Add tool result as a system message
    this.addMessage('system', `Tool ${data.tool} completed: ${JSON.stringify(data.result)}`);
  }

  handleModeChange(data) {
    this.currentMode = data.mode;
    console.log('Mode changed to:', data.mode);
    
    // Update UI to reflect mode change
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === data.mode);
    });
    
    this.showNotification(data.message, 'info');
  }

  changeMode(mode) {
    this.bridge.changeMode(mode);
  }

  addMessage(role, content, messageId = null) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return null;

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${role}`;
    if (messageId) {
      messageEl.dataset.messageId = messageId;
    }

    const avatarSrc = role === 'user' ? 'assets/avatars/user.png' : 'assets/avatars/cbo.png';
    const displayName = role === 'user' ? 'You' : 'CBO';

    messageEl.innerHTML = `
      <div class="message-avatar">
        <img src="${avatarSrc}" alt="${displayName}">
      </div>
      <div class="message-bubble">
        <div class="message-header">
          <span class="message-name">${displayName}</span>
          <span class="message-time">${this.formatTime(new Date())}</span>
        </div>
        <div class="message-content">${this.escapeHtml(content)}</div>
      </div>
    `;

    messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
    
    return messageEl;
  }

  addTypingIndicator(messageEl) {
    const contentEl = messageEl.querySelector('.message-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
    }
  }

  loadMessageHistory(messages) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    // Clear existing messages
    messagesContainer.innerHTML = '';

    // Add historical messages
    messages.forEach(msg => {
      this.addMessage(msg.role, msg.content);
    });
  }

  updateContext(context) {
    this.currentMode = context.mode;
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === context.mode);
    });
  }

  updateConnectionStatus(connected) {
    const statusEl = document.querySelector('.connection-status');
    if (statusEl) {
      statusEl.classList.toggle('connected', connected);
      statusEl.classList.toggle('disconnected', !connected);
      statusEl.textContent = connected ? 'Connected' : 'Disconnected';
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  handleAttachment() {
    console.log('Attachment functionality not yet implemented');
    this.showNotification('File attachments coming soon!', 'info');
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.claudeBROApp = new ClaudeBROApp();
  });
} else {
  window.claudeBROApp = new ClaudeBROApp();
}

// For existing integration
function startChat() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const chatContainer = document.getElementById('chatContainer');
  
  if (welcomeScreen && chatContainer) {
    welcomeScreen.style.display = 'none';
    chatContainer.style.display = 'flex';
    
    // Focus on input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.focus();
    }
  }
}