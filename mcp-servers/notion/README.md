# Notion MCP HTTP Wrapper

This service provides an HTTP wrapper around the Notion MCP server, enabling it to work in containerized production environments where stdio transport is not available.

## Features

- HTTP/JSON-RPC interface for MCP communication
- Authentication via API keys
- Health check endpoint
- Docker support for containerized deployment
- Automatic process management and restart

## Configuration

Environment variables:

- `PORT` - HTTP server port (default: 8002)
- `API_KEY` - API key for authenticating HTTP requests
- `NOTION_API_KEY` - Your Notion API key

## Local Development

```bash
# Install dependencies
npm install

# Run with environment variables
API_KEY=test-key NOTION_API_KEY=your-notion-api-key npm start

# Or use the test script
./test-local.sh
```

## Docker

```bash
# Build image
docker build -t notion-mcp-http .

# Run container
docker run -p 8002:8002 \
  -e API_KEY=your-api-key \
  -e NOTION_API_KEY=your-notion-api-key \
  notion-mcp-http
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and capabilities.

### RPC Endpoint
```
POST /rpc
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json

Body:
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 1
}
```

### SSE Events (Future)
```
GET /events
Headers:
  X-API-Key: your-api-key
```

Server-sent events for real-time updates.

## Available Tools

The Notion MCP provides tools for:

- Database operations (query, create, update)
- Page management (create, update, retrieve)
- Block operations (create, update, delete)
- User management
- Search functionality
- Comments
- File uploads

## Production Deployment

See the main deployment guide at `/docs/notion-mcp-deployment.md` for detailed instructions on deploying to DigitalOcean App Platform.