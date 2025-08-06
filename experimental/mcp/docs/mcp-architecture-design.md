# Multi-MCP Architecture Design for CBO Bot

## Overview

This document outlines a production-ready architecture for integrating multiple Model Context Protocol (MCP) servers with the CBO Telegram bot, addressing current limitations with stdio transport in containerized environments.

## Current Limitations

1. **Stdio Transport Issues**: The current implementation uses `StdioClientTransport` which requires `npx` and spawns child processes - incompatible with DigitalOcean App Platform
2. **Single Server**: Currently limited to one MCP server (Context7)
3. **No Production Support**: MCP is disabled in production due to transport limitations
4. **No Discovery**: No mechanism to discover and manage multiple MCP servers

## Proposed Architecture

### 1. HTTP/SSE Transport Layer

Replace stdio transport with HTTP/SSE for production compatibility:

```
┌─────────────────┐     HTTP/SSE      ┌─────────────────┐
│   CBO Bot       │ ◄──────────────► │  MCP Server 1   │
│   (Client)      │                   │  (Context7)     │
└─────────────────┘                   └─────────────────┘
        │                                      
        │         HTTP/SSE            ┌─────────────────┐
        └──────────────────────────► │  MCP Server 2   │
                                     │  (Perplexity)   │
                                     └─────────────────┘
```

### 2. MCP Server Registry

Centralized registry for discovering and managing MCP servers:

```json
{
  "servers": [
    {
      "id": "context7",
      "name": "Context7 Documentation",
      "endpoint": "https://mcp-context7.example.com",
      "transport": "http",
      "capabilities": ["documentation", "code-examples"],
      "authentication": {
        "type": "api-key",
        "header": "X-API-Key"
      }
    },
    {
      "id": "perplexity",
      "name": "Perplexity Search",
      "endpoint": "https://mcp-perplexity.example.com",
      "transport": "sse",
      "capabilities": ["web-search", "real-time-data"]
    }
  ]
}
```

### 3. Deployment Options

#### Option A: Sidecar Pattern (Recommended)
Deploy MCP servers as separate services alongside the bot:

```yaml
# DigitalOcean App Platform
services:
  - name: cbo-bot
    source: github.com/repo/cbo-bot
    http_port: 3003
    
  - name: mcp-context7
    source: github.com/repo/mcp-context7-http
    http_port: 8001
    
  - name: mcp-perplexity
    source: github.com/repo/mcp-perplexity-http
    http_port: 8002
```

#### Option B: Embedded Pattern
Bundle MCP servers within the bot container:

```dockerfile
FROM node:18

# Install bot
COPY bot/ /app/bot/
WORKDIR /app/bot
RUN npm ci

# Install MCP servers
COPY mcp-servers/ /app/mcp-servers/
WORKDIR /app/mcp-servers
RUN npm ci

# Start script runs both
CMD ["npm", "run", "start:all"]
```

### 4. Implementation Phases

#### Phase 1: HTTP Transport Implementation
- Create `HttpClientTransport` class
- Support both HTTP and SSE connections
- Handle authentication headers

#### Phase 2: Registry System
- Build server discovery mechanism
- Support dynamic server registration
- Health check monitoring

#### Phase 3: Production Deployment
- Deploy first MCP server (Context7) with HTTP transport
- Test in production environment
- Monitor performance and reliability

#### Phase 4: Multi-Server Integration
- Add additional MCP servers
- Implement load balancing if needed
- Add circuit breakers for resilience

## Technical Implementation

### 1. HTTP Client Transport

```javascript
class HttpClientTransport {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.headers = config.headers || {};
  }

  async send(message) {
    const response = await fetch(`${this.endpoint}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      body: JSON.stringify(message)
    });
    return response.json();
  }
}
```

### 2. Enhanced MCP Manager

```javascript
class MCPManager {
  async connectServer(config) {
    const transport = config.transport === 'http' 
      ? new HttpClientTransport(config)
      : new StdioClientTransport(config);
      
    const client = new Client(/* ... */);
    await client.connect(transport);
    
    this.servers.set(config.id, { client, transport, config });
  }
}
```

### 3. Environment Configuration

```env
# Development (stdio transport)
MCP_CONTEXT7_TRANSPORT=stdio
MCP_CONTEXT7_COMMAND=npx -y @upstash/context7-mcp

# Production (HTTP transport)
MCP_CONTEXT7_TRANSPORT=http
MCP_CONTEXT7_ENDPOINT=https://mcp-context7.internal:8001
MCP_CONTEXT7_API_KEY=secret-key
```

## Security Considerations

1. **Authentication**: Use API keys or JWT tokens for server authentication
2. **Network Isolation**: Keep MCP servers in private network
3. **Rate Limiting**: Implement rate limits to prevent abuse
4. **Encryption**: Use HTTPS for all production communications

## Monitoring & Observability

1. **Health Checks**: Regular pings to ensure server availability
2. **Metrics**: Track tool usage, response times, errors
3. **Logging**: Structured logs for debugging
4. **Alerts**: Notify on server downtime or errors

## Migration Path

1. **Week 1**: Implement HTTP transport in development
2. **Week 2**: Deploy Context7 with HTTP transport to staging
3. **Week 3**: Test in production with limited rollout
4. **Week 4**: Full production deployment
5. **Week 5+**: Add additional MCP servers

## Benefits

1. **Production Ready**: Works in containerized environments
2. **Scalable**: Easy to add new MCP servers
3. **Resilient**: Independent server deployments
4. **Flexible**: Supports multiple transport types
5. **Secure**: Built-in authentication and encryption

## Next Steps

1. Create `HttpClientTransport` implementation
2. Build MCP server wrapper for HTTP endpoints
3. Update `mcpManager.js` to support multiple transports
4. Create deployment configuration for first HTTP MCP server
5. Test end-to-end in development environment