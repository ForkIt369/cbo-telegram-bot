import { v4 as uuidv4 } from 'uuid';

export class WebSocketHandler {
  constructor(claudeService, sessionManager, logger) {
    this.claude = claudeService;
    this.sessions = sessionManager;
    this.logger = logger;
    this.connections = new Map();
  }

  handleConnection(ws, req) {
    const connectionId = uuidv4();
    const sessionId = this.extractSessionId(req) || uuidv4();
    
    this.connections.set(connectionId, {
      ws,
      sessionId,
      isAlive: true
    });

    const session = this.sessions.getOrCreateSession(sessionId);
    
    ws.on('message', (data) => this.handleMessage(ws, data, sessionId));
    ws.on('close', () => this.handleDisconnect(connectionId));
    ws.on('error', (error) => this.handleError(connectionId, error));
    ws.on('pong', () => this.handlePong(connectionId));

    this.setupPingInterval(connectionId);
    
    this.sendToClient(ws, {
      type: 'connection.established',
      sessionId,
      connectionId,
      timestamp: Date.now()
    });

    if (session.messages.length > 0) {
      this.sendToClient(ws, {
        type: 'session.restored',
        messages: session.messages.slice(-10),
        context: session.context
      });
    }
  }

  async handleMessage(ws, data, sessionId) {
    try {
      const message = JSON.parse(data.toString());
      const session = this.sessions.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      this.logger.info('Received message:', {
        type: message.type,
        sessionId
      });

      switch (message.type) {
        case 'chat':
          await this.handleChatMessage(ws, message, session);
          break;
        case 'tool':
          await this.handleToolRequest(ws, message, session);
          break;
        case 'mode':
          await this.handleModeChange(ws, message, session);
          break;
        case 'ping':
          this.sendToClient(ws, { type: 'pong' });
          break;
        default:
          this.sendToClient(ws, {
            type: 'error',
            error: 'Unknown message type'
          });
      }
    } catch (error) {
      this.logger.error('Message handling error:', error);
      this.sendToClient(ws, {
        type: 'error',
        error: error.message
      });
    }
  }

  async handleChatMessage(ws, message, session) {
    const messageId = uuidv4();
    
    session.messages.push({
      id: uuidv4(),
      role: 'user',
      content: message.content,
      timestamp: new Date()
    });

    this.sendToClient(ws, {
      type: 'stream.start',
      messageId,
      mode: session.context.mode
    });

    try {
      let fullResponse = '';
      
      await this.claude.createStreamingMessage(
        this.claude.formatMessagesForClaude(session.messages),
        (chunk) => {
          if (chunk.type === 'text') {
            fullResponse += chunk.content;
            this.sendToClient(ws, {
              type: 'stream.chunk',
              content: chunk.content,
              messageId
            });
          } else if (chunk.type === 'message_stop') {
            session.messages.push({
              id: messageId,
              role: 'assistant',
              content: fullResponse,
              timestamp: new Date(),
              metadata: {
                mode: session.context.mode
              }
            });
            
            this.sendToClient(ws, {
              type: 'stream.end',
              messageId,
              message: {
                id: messageId,
                content: fullResponse,
                role: 'assistant'
              }
            });
            
            this.sessions.updateSession(session.id, session);
          } else if (chunk.type === 'error') {
            throw new Error(chunk.error);
          }
        },
        {
          temperature: this.getTemperatureForMode(session.context.mode)
        }
      );
    } catch (error) {
      this.logger.error('Streaming error:', error);
      this.sendToClient(ws, {
        type: 'stream.error',
        messageId,
        error: error.message
      });
    }
  }

  async handleToolRequest(ws, message, session) {
    const { tool, params } = message;
    
    this.sendToClient(ws, {
      type: 'tool.use',
      tool,
      status: 'executing'
    });

    try {
      const result = await this.claude.handleToolUse(
        tool,
        params,
        session.context.permissions
      );
      
      this.sendToClient(ws, {
        type: 'tool.result',
        tool,
        result,
        status: 'complete'
      });
    } catch (error) {
      this.sendToClient(ws, {
        type: 'tool.error',
        tool,
        error: error.message
      });
    }
  }

  async handleModeChange(ws, message, session) {
    const { mode } = message;
    const validModes = ['analyze', 'create', 'research', 'optimize'];
    
    if (!validModes.includes(mode)) {
      this.sendToClient(ws, {
        type: 'error',
        error: 'Invalid mode'
      });
      return;
    }

    session.context.mode = mode;
    this.sessions.updateSession(session.id, session);
    
    this.sendToClient(ws, {
      type: 'mode.changed',
      mode,
      message: `Switched to ${mode} mode`
    });
  }

  handleDisconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.logger.info('WebSocket disconnected:', {
        connectionId,
        sessionId: connection.sessionId
      });
      
      if (connection.pingInterval) {
        clearInterval(connection.pingInterval);
      }
      
      this.connections.delete(connectionId);
    }
  }

  handleError(connectionId, error) {
    this.logger.error('WebSocket error:', {
      connectionId,
      error: error.message
    });
  }

  handlePong(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isAlive = true;
    }
  }

  setupPingInterval(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.pingInterval = setInterval(() => {
      if (!connection.isAlive) {
        connection.ws.terminate();
        this.handleDisconnect(connectionId);
        return;
      }
      
      connection.isAlive = false;
      connection.ws.ping();
    }, 30000);
  }

  sendToClient(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  extractSessionId(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('sessionId');
  }

  getTemperatureForMode(mode) {
    const temperatures = {
      analyze: 0.5,
      create: 0.8,
      research: 0.3,
      optimize: 0.6
    };
    return temperatures[mode] || 0.7;
  }
}