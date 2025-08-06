# Experimental: Model Context Protocol (MCP) Integration

⚠️ **WARNING**: This is experimental code not used in production.

## What is MCP?

Model Context Protocol (MCP) is a standard for providing context and tools to language models. This experimental integration allows the CBO bot to use external tools like:

- Context7 - Library documentation lookup
- Perplexity - Web search capabilities
- GitHub - Repository operations

## Structure

```
experimental/mcp/
├── services/
│   ├── claudeServiceWithTools.js  # Claude + MCP tools
│   ├── mcpManager.js              # MCP server management
│   ├── mcpRegistry.js             # Server configuration
│   └── transports/                # HTTP/stdio transports
├── servers/
│   └── context7/                  # Context7 HTTP wrapper
└── docs/                          # MCP documentation
```

## Why Experimental?

1. **Production Challenges**: stdio transport doesn't work in containers
2. **Complexity**: Requires separate HTTP wrappers for each MCP server
3. **Maintenance**: Each MCP server needs its own deployment
4. **Not Essential**: Bot works fine without these tools

## If You Want to Try It

1. Review the documentation in `docs/`
2. Understand the HTTP wrapper pattern
3. Deploy MCP servers separately
4. Update environment variables
5. Import `claudeServiceWithTools.js` instead of basic service

## Current Status

- ✅ Architecture designed
- ✅ HTTP transport implemented
- ✅ Context7 wrapper created
- ❌ Not deployed to production
- ❌ Not actively maintained

## Should You Use This?

Probably not, unless you:
- Need specific external tool capabilities
- Have resources to maintain separate services
- Understand the complexity involved

The basic bot without MCP tools is simpler and works great for most use cases.