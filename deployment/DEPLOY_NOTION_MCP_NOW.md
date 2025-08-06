# Deploy Notion MCP to DigitalOcean - Step by Step

## Step 1: Create the Notion MCP App on DigitalOcean

1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Choose **"GitHub"** as source
4. Select your repository: `ForkIt369/cbo-telegram-bot`
5. Select branch: `master`
6. Click **"Next"**

## Step 2: Configure the App

### Resource Settings:
- **Source Directory**: `mcp-servers/notion`
- **Dockerfile Path**: `mcp-servers/notion/Dockerfile`
- **Resource Type**: Web Service
- **HTTP Port**: 8002

### Environment Variables (IMPORTANT):
Add these environment variables:

```
PORT=8002
API_KEY=generate-a-secure-key-here
NOTION_API_KEY=ntn_E6508124073aS6t15BCQppJFDVQhUf6fnmdobvzl7ef0a5
```

**To generate a secure API_KEY**, use:
```bash
openssl rand -hex 32
```

### App Info:
- **Name**: `cbo-notion-mcp` (or similar)
- **Region**: Same as your bot (NYC3)

### Instance Size:
- Start with **Basic ($5/month)**
- Can scale up if needed

## Step 3: Deploy

1. Review the settings
2. Click **"Create Resources"**
3. Wait for deployment (5-10 minutes)

## Step 4: Get the App URL

Once deployed, you'll get a URL like:
```
https://cbo-notion-mcp-xxxxx.ondigitalocean.app
```

Test it:
```bash
curl https://cbo-notion-mcp-xxxxx.ondigitalocean.app/health
```

## Step 5: Update Your Main Bot

Go to your main CBO bot app on DigitalOcean and add these environment variables:

```
ENABLE_MCP_TOOLS=true
MCP_NOTION_ENABLED=true
MCP_NOTION_TRANSPORT=http
MCP_NOTION_ENDPOINT=https://cbo-notion-mcp-xxxxx.ondigitalocean.app
MCP_NOTION_API_KEY=<same-api-key-from-step-2>
```

## Step 6: Redeploy Main Bot

The main bot should automatically redeploy when you update environment variables.

## Step 7: Test in Telegram

1. Message your bot: `/mcphealth`
   - Should show Notion MCP as "healthy"

2. Message: `/tools`
   - Should list Notion tools with `notion:` prefix

3. Try a Notion command:
   - "Can you check my Notion workspace?"
   - "What databases do I have in Notion?"

## Troubleshooting

If the Notion MCP doesn't work:

1. Check logs in DigitalOcean:
   - Go to your Notion MCP app
   - Click "Runtime Logs"
   - Look for errors

2. Common issues:
   - Wrong API_KEY between services
   - Typo in NOTION_API_KEY
   - Network/firewall issues

3. Test the endpoint directly:
```bash
curl -X POST https://your-notion-mcp-url/rpc \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

## Success Checklist

- [ ] Notion MCP app created on DigitalOcean
- [ ] Environment variables set correctly
- [ ] App deployed and healthy
- [ ] Main bot updated with Notion endpoint
- [ ] `/mcphealth` shows Notion as healthy
- [ ] `/tools` shows Notion tools
- [ ] Bot can use Notion commands

## Need Help?

If you get stuck at any step, share:
1. The error message
2. The logs from DigitalOcean
3. The step where it failed