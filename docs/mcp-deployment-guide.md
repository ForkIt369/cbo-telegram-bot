# MCP Deployment Guide for DigitalOcean App Platform

This guide explains how to deploy multiple MCP servers alongside the CBO bot on DigitalOcean App Platform.

## Current Status

- **Development**: MCP works with stdio transport using Context7
- **Production**: MCP is disabled due to stdio transport limitations in containers
- **Solution**: Deploy MCP servers as HTTP services

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│          DigitalOcean App Platform              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐    HTTP    ┌───────────────┐ │
│  │   CBO Bot    │ ◄────────► │ MCP Context7  │ │
│  │   Service    │            │   Service     │ │
│  └──────────────┘            └───────────────┘ │
│         │                                       │
│         │        HTTP        ┌───────────────┐ │
│         └──────────────────► │MCP Perplexity │ │
│                              │   Service     │ │
│                              └───────────────┘ │
└─────────────────────────────────────────────────┘
```

## Step-by-Step Deployment

### 1. Prepare MCP HTTP Wrappers

For each MCP server, create an HTTP wrapper:

```bash
# Directory structure
cbo-telegram-bot/
├── mcp-servers/
│   ├── context7/
│   │   ├── Dockerfile
│   │   ├── index.js
│   │   └── package.json
│   └── perplexity/
│       ├── Dockerfile
│       ├── index.js
│       └── package.json
```

### 2. Create Context7 HTTP Service

**mcp-servers/context7/package.json:**
```json
{
  "name": "mcp-context7-http",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.1",
    "@upstash/context7-mcp": "latest",
    "express": "^4.18.2"
  }
}
```

**mcp-servers/context7/Dockerfile:**
```dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 8001
CMD ["npm", "start"]
```

### 3. Update DigitalOcean App Spec

**app.yaml:**
```yaml
name: cbo-telegram-bot
region: nyc
services:
  # Main bot service
  - name: telegram-bot
    environment_slug: node-js
    github:
      branch: master
      deploy_on_push: true
      repo: ForkIt369/cbo-telegram-bot
    build_command: npm ci && npm run build
    run_command: npm start
    http_port: 3003
    instance_count: 1
    instance_size_slug: apps-s-1vcpu-1gb
    envs:
      - key: NODE_ENV
        value: production
      - key: ENABLE_MCP_TOOLS
        value: "true"
      - key: MCP_CONTEXT7_TRANSPORT
        value: "http"
      - key: MCP_CONTEXT7_ENDPOINT
        value: "${APP_URL}/mcp-context7"
        scope: RUN_TIME
      - key: MCP_CONTEXT7_API_KEY
        type: SECRET
        scope: RUN_TIME

  # Context7 MCP service
  - name: mcp-context7
    environment_slug: node-js
    github:
      branch: master
      deploy_on_push: true
      repo: ForkIt369/cbo-telegram-bot
    source_dir: mcp-servers/context7
    build_command: npm ci
    run_command: npm start
    http_port: 8001
    instance_count: 1
    instance_size_slug: apps-s-1vcpu-0.5gb
    envs:
      - key: API_KEY
        type: SECRET
        scope: RUN_TIME
      - key: PORT
        value: "8001"
```

### 4. Configure Environment Variables

In DigitalOcean App Platform settings:

**Bot Service:**
```env
# MCP Configuration
ENABLE_MCP_TOOLS=true

# Context7 MCP
MCP_CONTEXT7_TRANSPORT=http
MCP_CONTEXT7_ENDPOINT=https://mcp-context7-xyz.ondigitalocean.app
MCP_CONTEXT7_API_KEY=<generate-secure-key>

# Perplexity MCP (when added)
MCP_PERPLEXITY_ENABLED=true
MCP_PERPLEXITY_TRANSPORT=http
MCP_PERPLEXITY_ENDPOINT=https://mcp-perplexity-xyz.ondigitalocean.app
MCP_PERPLEXITY_API_KEY=<generate-secure-key>
```

**MCP Services:**
```env
# Each MCP service needs
API_KEY=<same-as-bot-service>
PORT=8001
```

### 5. Test Deployment

1. **Deploy to staging first:**
   ```bash
   doctl apps create --spec app-staging.yaml
   ```

2. **Test MCP connectivity:**
   ```bash
   # Test health endpoint
   curl https://mcp-context7-xyz.ondigitalocean.app/health

   # Test through bot
   /tools  # Should show available MCP tools
   ```

3. **Monitor logs:**
   ```bash
   doctl apps logs <app-id> --component telegram-bot
   doctl apps logs <app-id> --component mcp-context7
   ```

### 6. Production Deployment

1. **Update production app spec**
2. **Deploy with zero downtime:**
   ```bash
   doctl apps update <production-app-id> --spec app.yaml
   ```

3. **Verify deployment:**
   - Check bot health: `/status`
   - Check MCP tools: `/tools`
   - Test a tool usage

## Adding New MCP Servers

1. **Create HTTP wrapper** in `mcp-servers/<name>/`
2. **Add to app.yaml** as new service
3. **Update mcpRegistry.js** with new server config
4. **Set environment variables**
5. **Deploy and test**

## Monitoring

### Health Checks

Add to bot commands:
```javascript
bot.command('mcphealth', checkAdmin, async (ctx) => {
  const health = await mcpManager.checkHealth();
  let message = '🏥 MCP Server Health:\n\n';
  
  for (const [server, status] of Object.entries(health)) {
    message += `${status.status === 'healthy' ? '✅' : '❌'} ${server}\n`;
    message += `  Status: ${status.status}\n`;
    message += `  Tools: ${status.toolCount || 0}\n\n`;
  }
  
  ctx.reply(message);
});
```

### Alerts

Configure DigitalOcean monitoring:
1. Service health checks on `/health` endpoints
2. Alert on service downtime
3. Log aggregation for errors

## Security Best Practices

1. **Use strong API keys** for MCP services
2. **Enable HTTPS only** for all services
3. **Use internal networking** when possible
4. **Rotate API keys** regularly
5. **Monitor access logs** for anomalies

## Troubleshooting

### MCP Not Connecting
1. Check environment variables
2. Verify service is running: `doctl apps logs`
3. Test health endpoint directly
4. Check API key configuration

### Tool Calls Failing
1. Check MCP service logs
2. Verify tool names match
3. Check request/response format
4. Test with simple tool first

### Performance Issues
1. Scale MCP services independently
2. Enable caching where appropriate
3. Monitor response times
4. Consider regional deployment

## Next Steps

1. **Implement HTTP wrapper** for Context7
2. **Test in staging** environment
3. **Deploy to production** with monitoring
4. **Add additional MCP servers** as needed
5. **Document each MCP server's** capabilities