# Notion MCP Deployment Guide

## Overview

This guide explains how to deploy the Notion MCP HTTP wrapper to DigitalOcean App Platform as part of the CBO bot's multi-MCP architecture.

## Prerequisites

- DigitalOcean account with App Platform access
- GitHub repository with the CBO bot code
- Notion API key: `ntn_E6508124073aS6t15BCQppJFDVQhUf6fnmdobvzl7ef0a5`

## Deployment Steps

### 1. Deploy Notion MCP Service

Create a new app in DigitalOcean App Platform for the Notion MCP service:

1. Go to DigitalOcean App Platform
2. Click "Create App"
3. Connect your GitHub repository
4. Select the deployment branch (usually `master`)
5. Configure the app:
   - **Name**: `cbo-bot-notion-mcp`
   - **Region**: Same as your main bot (e.g., NYC3)
   - **Source Directory**: `mcp-servers/notion`
   - **Dockerfile Path**: `mcp-servers/notion/Dockerfile`

### 2. Configure Environment Variables

Add these environment variables to the Notion MCP service:

```env
PORT=8002
API_KEY=<generate-a-secure-api-key>
NOTION_API_KEY=ntn_E6508124073aS6t15BCQppJFDVQhUf6fnmdobvzl7ef0a5
```

### 3. Update Main Bot Configuration

Add these environment variables to your main CBO bot service:

```env
# Enable MCP tools
ENABLE_MCP_TOOLS=true

# Notion MCP Configuration
MCP_NOTION_ENABLED=true
MCP_NOTION_TRANSPORT=http
MCP_NOTION_ENDPOINT=https://cbo-bot-notion-mcp-xxxxx.ondigitalocean.app
MCP_NOTION_API_KEY=<same-api-key-as-above>
```

### 4. Testing the Deployment

#### Local Testing

```bash
# Terminal 1: Run Notion MCP wrapper
cd mcp-servers/notion
npm install
API_KEY=test-key NOTION_API_KEY=ntn_E6508124073aS6t15BCQppJFDVQhUf6fnmdobvzl7ef0a5 npm start

# Terminal 2: Test the endpoint
curl http://localhost:8002/health

# Terminal 3: Run bot with Notion MCP
MCP_NOTION_ENABLED=true \
MCP_NOTION_TRANSPORT=http \
MCP_NOTION_ENDPOINT=http://localhost:8002 \
MCP_NOTION_API_KEY=test-key \
npm run dev
```

#### Production Testing

After deployment, test the Notion MCP integration:

1. Check health endpoint:
   ```bash
   curl https://cbo-bot-notion-mcp-xxxxx.ondigitalocean.app/health
   ```

2. Test in Telegram bot:
   - `/mcphealth` - Check all MCP servers health
   - `/tools` - Should show Notion tools with `notion:` prefix

## Available Notion Tools

Once deployed, these tools will be available:

- `notion:API-get-user` - Retrieve a user
- `notion:API-get-users` - List all users
- `notion:API-get-self` - Get bot user info
- `notion:API-post-database-query` - Query a database
- `notion:API-post-search` - Search by title
- `notion:API-get-block-children` - Get block children
- `notion:API-patch-block-children` - Append block children
- `notion:API-retrieve-a-block` - Get a block
- `notion:API-update-a-block` - Update a block
- `notion:API-delete-a-block` - Delete a block
- `notion:API-retrieve-a-page` - Get a page
- `notion:API-patch-page` - Update page properties
- `notion:API-post-page` - Create a page
- `notion:API-create-a-database` - Create a database
- `notion:API-update-a-database` - Update a database
- `notion:API-retrieve-a-database` - Get a database
- `notion:API-retrieve-a-page-property` - Get page property
- `notion:API-retrieve-a-comment` - Get comments
- `notion:API-create-a-comment` - Create comment

## Security Considerations

1. **API Key Protection**:
   - Use strong, random API keys for `MCP_NOTION_API_KEY`
   - Store as encrypted environment variables in App Platform
   - Never commit API keys to source control

2. **Network Security**:
   - Only allow HTTPS connections in production
   - Consider IP whitelisting if possible
   - Monitor access logs for suspicious activity

3. **Rate Limiting**:
   - Notion API has rate limits
   - Monitor usage to avoid hitting limits
   - Implement request queuing if needed

## Monitoring

1. **Health Checks**:
   - Monitor `/health` endpoint
   - Set up alerts for failures
   - Check MCP process status

2. **Logs**:
   - Monitor App Platform logs
   - Look for MCP connection errors
   - Track API usage patterns

3. **Performance**:
   - Monitor response times
   - Check memory usage
   - Scale if needed

## Troubleshooting

### MCP Process Won't Start

```bash
# Check logs
doctl apps logs <app-id> --component notion-mcp

# Common issues:
# - Missing NOTION_API_KEY
# - Invalid API key format
# - Package installation errors
```

### Connection Refused

- Verify the endpoint URL is correct
- Check API key authentication
- Ensure port 8002 is exposed

### Tools Not Appearing

- Check `MCP_NOTION_ENABLED=true` is set
- Verify MCP registry loaded the server
- Check `/tools` command output

## Scaling Considerations

The Notion MCP can be scaled independently:

1. **Horizontal Scaling**:
   - Increase instance count for high load
   - Load balancer will distribute requests

2. **Vertical Scaling**:
   - Upgrade instance size if needed
   - Monitor memory usage

3. **Caching**:
   - Consider caching Notion API responses
   - Reduce API calls for frequently accessed data