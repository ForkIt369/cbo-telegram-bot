/**
 * Example HTTP wrapper for MCP servers
 * This shows how to wrap an MCP server with HTTP transport for production deployment
 */

const express = require('express');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());

// Store active MCP connections
const connections = new Map();

// Configuration
const MCP_COMMAND = process.env.MCP_COMMAND || 'npx';
const MCP_ARGS = process.env.MCP_ARGS?.split(' ') || ['-y', '@upstash/context7-mcp'];
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 8001;

// Simple API key authentication
function authenticate(req, res, next) {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'mcp-http-wrapper',
    uptime: process.uptime()
  });
});

// Initialize MCP connection
async function initializeMCP() {
  console.log('Initializing MCP server connection...');
  
  const transport = new StdioServerTransport({
    command: MCP_COMMAND,
    args: MCP_ARGS
  });

  const server = new Server({
    name: 'mcp-http-wrapper',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await server.connect(transport);
  
  return { server, transport };
}

// RPC endpoint
app.post('/rpc', authenticate, async (req, res) => {
  try {
    const { method, params, id } = req.body;
    
    // Get or create MCP connection
    let connection = connections.get('default');
    if (!connection) {
      connection = await initializeMCP();
      connections.set('default', connection);
    }

    const { server } = connection;

    // Handle different RPC methods
    let result;
    
    switch (method) {
      case 'initialize':
        result = await server.initialize(params);
        break;
        
      case 'tools/list':
        result = await server.listTools();
        break;
        
      case 'tools/call':
        result = await server.callTool(params);
        break;
        
      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found'
          },
          id
        });
    }

    res.json({
      jsonrpc: '2.0',
      result,
      id
    });
    
  } catch (error) {
    console.error('RPC error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message
      },
      id: req.body.id
    });
  }
});

// SSE endpoint for server-initiated messages
app.get('/events', authenticate, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  
  for (const [id, connection] of connections) {
    try {
      await connection.server.close();
      console.log(`Closed connection: ${id}`);
    } catch (error) {
      console.error(`Error closing connection ${id}:`, error);
    }
  }
  
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`MCP HTTP wrapper listening on port ${PORT}`);
});

/**
 * Deployment Notes:
 * 
 * 1. Environment Variables:
 *    - MCP_COMMAND: Command to run MCP server (default: npx)
 *    - MCP_ARGS: Arguments for MCP server (default: -y @upstash/context7-mcp)
 *    - API_KEY: Optional API key for authentication
 *    - PORT: HTTP port (default: 8001)
 * 
 * 2. Docker Example:
 *    ```dockerfile
 *    FROM node:18
 *    WORKDIR /app
 *    COPY package*.json ./
 *    RUN npm ci
 *    COPY . .
 *    EXPOSE 8001
 *    CMD ["node", "mcp-http-wrapper.js"]
 *    ```
 * 
 * 3. DigitalOcean App Platform:
 *    - Deploy as a separate service
 *    - Set environment variables in app settings
 *    - Use internal networking for bot-to-MCP communication
 */