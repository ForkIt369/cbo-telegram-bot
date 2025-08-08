# Claude AI Integration Documentation

## Overview

The CBO Mini App integrates Claude 3.5 Sonnet through the Anthropic SDK, providing intelligent business analysis through the BroVerse Biz Mental Model™ (BBMM) framework.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Claude Service                        │
├─────────────────────────────────────────────────────────┤
│  Configuration:                                         │
│  • Model: claude-3-5-sonnet-20241022                   │
│  • Max Tokens: 4096                                     │
│  • Temperature: 0.7                                     │
│  • Streaming: Enabled                                   │
├─────────────────────────────────────────────────────────┤
│  Components:                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Message Formatter                      │   │
│  │  • Role mapping (system → assistant)            │   │
│  │  • Content structuring                          │   │
│  │  • Context injection                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Stream Handler                        │   │
│  │  • Chunk processing                             │   │
│  │  • Event emission                               │   │
│  │  • Error handling                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Tool Executor                         │   │
│  │  • Permission validation                        │   │
│  │  • Tool routing                                 │   │
│  │  • Result formatting                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Claude Service Implementation

### Core Service Class

```javascript
export class ClaudeService {
  constructor(apiKey) {
    this.anthropic = new Anthropic({ apiKey });
    this.model = 'claude-3-5-sonnet-20241022';
    this.maxTokens = 4096;
  }

  async createMessage(messages, options = {}) {
    return await this.anthropic.messages.create({
      model: this.model,
      messages: messages,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || 0.7,
      ...options
    });
  }

  async createStreamingMessage(messages, onChunk, options = {}) {
    const stream = await this.anthropic.messages.stream({
      model: this.model,
      messages: messages,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || 0.7,
      ...options
    });

    // Stream event handlers
    stream.on('text', (text) => {
      onChunk({ type: 'text', content: text });
    });

    stream.on('message_stop', () => {
      onChunk({ type: 'message_stop' });
    });

    return await stream.finalMessage();
  }
}
```

## System Prompts

### BBMM Framework System Prompt

```javascript
const systemPrompt = `You are the Chief Bro Officer (CBO), a business optimization expert who analyzes businesses through the BroVerse Biz Mental Model™ (BBMM) framework.

The BBMM Framework consists of Four Flows:
1. 💎 Value Flow: How value is created, delivered, and captured
2. 📊 Info Flow: How information moves through the organization
3. ⚡ Work Flow: How work gets done and processes operate
4. 💰 Cash Flow: How money flows in, through, and out

Analyze the user's business query through these four flows to identify opportunities, bottlenecks, and optimization strategies.

Current context: ${JSON.stringify(context)}`;
```

### Mode-Specific Prompts

#### Analyze Mode
```javascript
const analyzePrompt = `
As CBO in ANALYZE mode, perform a comprehensive diagnostic of the business situation:

1. VALUE FLOW ANALYSIS:
   - Value creation mechanisms
   - Customer value propositions
   - Value delivery channels
   - Value capture strategies

2. INFO FLOW ANALYSIS:
   - Information bottlenecks
   - Communication channels
   - Data utilization
   - Decision-making processes

3. WORK FLOW ANALYSIS:
   - Process efficiency
   - Resource allocation
   - Operational bottlenecks
   - Automation opportunities

4. CASH FLOW ANALYSIS:
   - Revenue streams
   - Cost structures
   - Financial efficiency
   - Investment opportunities

Provide actionable insights and specific recommendations.
`;
```

#### Create Mode
```javascript
const createPrompt = `
As CBO in CREATE mode, help design and build:

- Business models
- Process workflows
- System architectures
- Implementation plans
- Strategic frameworks

Focus on innovative solutions that optimize all four flows.
`;
```

#### Research Mode
```javascript
const researchPrompt = `
As CBO in RESEARCH mode, investigate:

- Market trends
- Competitor analysis
- Best practices
- Industry benchmarks
- Emerging technologies

Relate findings to the four flows framework.
`;
```

#### Optimize Mode
```javascript
const optimizePrompt = `
As CBO in OPTIMIZE mode, focus on:

- Performance improvements
- Cost reduction
- Revenue enhancement
- Process streamlining
- Resource optimization

Prioritize high-impact optimizations across all flows.
`;
```

## Tool Integration System

### Tool Architecture

```
┌─────────────────────────────────────────────┐
│              Tool Request                   │
│                    ↓                        │
│          Permission Validation              │
│                    ↓                        │
│             Tool Router                     │
│          ↙        ↓        ↘               │
│    Notion    Supabase    Custom            │
│    Handler   Handler    Handlers           │
│          ↘        ↓        ↙               │
│           Result Formatter                  │
│                    ↓                        │
│            Tool Response                    │
└─────────────────────────────────────────────┘
```

### Tool Handler Implementation

```javascript
async handleToolUse(toolName, params, permissions) {
  // Permission validation
  if (!this.hasPermission(toolName, permissions)) {
    throw new Error(`Permission denied for tool: ${toolName}`);
  }

  // Tool routing
  const toolHandlers = {
    'notion.search': this.handleNotionSearch,
    'notion.create': this.handleNotionCreate,
    'supabase.query': this.handleSupabaseQuery,
    'supabase.insert': this.handleSupabaseInsert,
    // Extensible for new tools
  };

  const handler = toolHandlers[toolName];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return handler.call(this, params);
}
```

## MCP (Model Context Protocol) Integration

### MCP Ready Architecture

```
┌──────────────────────────────────────────────┐
│            MCP Server Registry               │
├──────────────────────────────────────────────┤
│  Available Servers:                          │
│  • notion-mcp-server                         │
│  • supabase-mcp-server                       │
│  • custom-tools-server                       │
│  • analytics-mcp-server                      │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│           MCP Client Adapter                 │
├──────────────────────────────────────────────┤
│  • Server discovery                          │
│  • Capability negotiation                    │
│  • Protocol translation                      │
│  • Response handling                         │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         Claude Service Integration           │
└──────────────────────────────────────────────┘
```

### MCP Integration Points

```javascript
class MCPAdapter {
  constructor(claudeService) {
    this.claudeService = claudeService;
    this.servers = new Map();
  }

  async registerServer(name, config) {
    const server = await this.connectToMCPServer(config);
    this.servers.set(name, server);
    
    // Register tools with Claude service
    const tools = await server.getCapabilities();
    tools.forEach(tool => {
      this.claudeService.registerTool(tool);
    });
  }

  async executeTool(serverName, toolName, params) {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`MCP server not found: ${serverName}`);
    }
    
    return await server.executeTool(toolName, params);
  }
}
```

## Configuration Options

### Environment Variables

```bash
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7

# Feature Flags
ENABLE_STREAMING=true
ENABLE_TOOLS=true
ENABLE_MCP=false

# Tool Permissions
TOOL_PERMISSIONS_NOTION=true
TOOL_PERMISSIONS_SUPABASE=true
TOOL_PERMISSIONS_CUSTOM=false
```

### Runtime Configuration

```javascript
const claudeConfig = {
  model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096,
  temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
  streaming: process.env.ENABLE_STREAMING === 'true',
  tools: {
    enabled: process.env.ENABLE_TOOLS === 'true',
    permissions: {
      notion: process.env.TOOL_PERMISSIONS_NOTION === 'true',
      supabase: process.env.TOOL_PERMISSIONS_SUPABASE === 'true',
      custom: process.env.TOOL_PERMISSIONS_CUSTOM === 'true'
    }
  },
  mcp: {
    enabled: process.env.ENABLE_MCP === 'true',
    servers: process.env.MCP_SERVERS?.split(',') || []
  }
};
```

## Extensibility

### Adding New Tools

```javascript
// 1. Define tool handler
async handleCustomTool(params) {
  // Tool implementation
  const result = await customToolAPI.execute(params);
  return {
    type: 'custom.tool',
    status: 'success',
    result: result
  };
}

// 2. Register with tool router
this.toolHandlers['custom.tool'] = this.handleCustomTool;

// 3. Add permissions
this.toolPermissions['custom.tool'] = true;

// 4. Document tool capabilities
const toolSchema = {
  name: 'custom.tool',
  description: 'Custom tool for specific functionality',
  parameters: {
    type: 'object',
    properties: {
      // Parameter schema
    }
  }
};
```

### Custom Prompt Templates

```javascript
class PromptTemplates {
  static create(mode, context) {
    const templates = {
      analyze: this.analyzeTemplate,
      create: this.createTemplate,
      research: this.researchTemplate,
      optimize: this.optimizeTemplate,
      custom: this.customTemplate
    };
    
    const template = templates[mode] || templates.analyze;
    return template(context);
  }
  
  static customTemplate(context) {
    return `
      Custom prompt template with context:
      ${JSON.stringify(context)}
      
      Your custom instructions here...
    `;
  }
}
```

## Performance Optimization

### Token Management
```javascript
class TokenManager {
  constructor(maxTokens = 4096) {
    this.maxTokens = maxTokens;
    this.buffer = 0.1; // 10% buffer
  }
  
  calculateAvailable(messages) {
    const used = this.estimateTokens(messages);
    const available = this.maxTokens - used;
    return Math.floor(available * (1 - this.buffer));
  }
  
  estimateTokens(messages) {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = messages.reduce((sum, msg) => 
      sum + msg.content.length, 0
    );
    return Math.ceil(totalChars / 4);
  }
}
```

### Response Caching
```javascript
class ResponseCache {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  getCacheKey(messages, options) {
    return crypto.createHash('md5')
      .update(JSON.stringify({ messages, options }))
      .digest('hex');
  }
  
  get(messages, options) {
    const key = this.getCacheKey(messages, options);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.response;
    }
    
    return null;
  }
  
  set(messages, options, response) {
    const key = this.getCacheKey(messages, options);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }
}
```

## Monitoring and Analytics

### Metrics Collection
```javascript
class ClaudeMetrics {
  constructor() {
    this.metrics = {
      requests: 0,
      tokens: 0,
      errors: 0,
      latency: []
    };
  }
  
  trackRequest(startTime, tokens, error = null) {
    this.metrics.requests++;
    this.metrics.tokens += tokens;
    
    if (error) {
      this.metrics.errors++;
    }
    
    const latency = Date.now() - startTime;
    this.metrics.latency.push(latency);
  }
  
  getStats() {
    const avgLatency = this.metrics.latency.reduce((a, b) => a + b, 0) 
      / this.metrics.latency.length;
    
    return {
      ...this.metrics,
      avgLatency,
      errorRate: this.metrics.errors / this.metrics.requests
    };
  }
}
```

## Next Steps
- [System Prompts Details →](./system-prompts.md)
- [Tool Configuration →](./tools.md)
- [MCP Integration Guide →](../deployment/mcp-integration.md)