const express = require('express');
const { spawn } = require('child_process');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Configuration
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 8001;

// Store for active MCP process
let mcpProcess = null;
let processReady = false;
let messageQueue = [];
let responseHandlers = new Map();
let messageId = 0;

// Simple API key authentication
function authenticate(req, res, next) {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Initialize MCP process
function initializeMCP() {
  console.log('Starting Context7 MCP process...');
  
  mcpProcess = spawn('npx', ['-y', '@upstash/context7-mcp'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';

  mcpProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    
    // Process complete JSON-RPC messages
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          handleMCPMessage(message);
        } catch (error) {
          console.error('Failed to parse MCP message:', error);
        }
      }
    }
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error('MCP stderr:', data.toString());
  });

  mcpProcess.on('error', (error) => {
    console.error('MCP process error:', error);
    processReady = false;
  });

  mcpProcess.on('exit', (code) => {
    console.log(`MCP process exited with code ${code}`);
    processReady = false;
    mcpProcess = null;
    
    // Restart after delay
    setTimeout(initializeMCP, 5000);
  });

  // Send initialization
  sendToMCP({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      capabilities: {},
      clientInfo: {
        name: 'context7-http-wrapper',
        version: '1.0.0'
      }
    },
    id: ++messageId
  });
}

// Send message to MCP process
function sendToMCP(message) {
  if (mcpProcess && mcpProcess.stdin.writable) {
    mcpProcess.stdin.write(JSON.stringify(message) + '\n');
  } else {
    console.error('MCP process not ready');
    throw new Error('MCP process not available');
  }
}

// Handle messages from MCP
function handleMCPMessage(message) {
  // Handle initialization response
  if (message.id && message.result && message.result.protocolVersion) {
    console.log('MCP initialized successfully');
    processReady = true;
    
    // Process queued messages
    while (messageQueue.length > 0 && processReady) {
      const { req, res } = messageQueue.shift();
      handleRPCRequest(req, res);
    }
  }
  
  // Handle responses to our requests
  if (message.id && responseHandlers.has(message.id)) {
    const handler = responseHandlers.get(message.id);
    responseHandlers.delete(message.id);
    
    if (message.error) {
      handler.reject(message.error);
    } else {
      handler.resolve(message.result);
    }
  }
  
  // Handle notifications
  if (message.method && !message.id) {
    console.log('Received notification:', message.method);
  }
}

// Handle RPC request
async function handleRPCRequest(req, res) {
  if (!processReady) {
    messageQueue.push({ req, res });
    return;
  }

  const { method, params, id } = req.body;
  const requestId = ++messageId;

  try {
    // Map HTTP RPC methods to MCP protocol
    let mcpMethod = method;
    let mcpParams = params;
    
    // Handle method mapping
    switch (method) {
      case 'tools/list':
        mcpMethod = 'tools/list';
        mcpParams = {};
        break;
        
      case 'tools/call':
        mcpMethod = 'tools/call';
        break;
        
      default:
        // Pass through other methods
        break;
    }

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      responseHandlers.set(requestId, { resolve, reject });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (responseHandlers.has(requestId)) {
          responseHandlers.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });

    // Send to MCP
    sendToMCP({
      jsonrpc: '2.0',
      method: mcpMethod,
      params: mcpParams,
      id: requestId
    });

    // Wait for response
    const result = await responsePromise;

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
      id
    });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: processReady ? 'healthy' : 'starting',
    server: 'context7-mcp-http',
    uptime: process.uptime(),
    ready: processReady
  });
});

// RPC endpoint
app.post('/rpc', authenticate, handleRPCRequest);

// SSE endpoint for server-initiated messages (placeholder)
app.get('/events', authenticate, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send heartbeat
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Context7 MCP HTTP wrapper listening on port ${PORT}`);
  initializeMCP();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  
  if (mcpProcess) {
    mcpProcess.kill();
  }
  
  process.exit(0);
});