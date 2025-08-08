# Tools and MCP Integration Documentation

## Overview

The CBO Mini App is designed with an extensible tool system that supports both custom tools and Model Context Protocol (MCP) server integration.

## Tool System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Tool Registry                          │
├─────────────────────────────────────────────────────────────┤
│  Built-in Tools:                                            │
│  • notion.search    - Search Notion databases               │
│  • notion.create    - Create Notion pages                   │
│  • supabase.query   - Query Supabase tables                │
│  • supabase.insert  - Insert Supabase records              │
├─────────────────────────────────────────────────────────────┤
│  Custom Tools:                                              │
│  • [Extensible tool slots]                                  │
├─────────────────────────────────────────────────────────────┤
│  MCP Servers:                                               │
│  • [Dynamic MCP server registration]                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Tool Executor                            │
├─────────────────────────────────────────────────────────────┤
│  1. Permission Check                                        │
│  2. Parameter Validation                                    │
│  3. Tool Invocation                                         │
│  4. Result Processing                                       │
│  5. Response Formatting                                     │
└─────────────────────────────────────────────────────────────┘
```

## Built-in Tools

### Notion Integration

```javascript
// Tool Definition
const notionTools = {
  'notion.search': {
    name: 'Notion Search',
    description: 'Search Notion databases for information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        database: {
          type: 'string',
          description: 'Database ID or name'
        },
        filters: {
          type: 'object',
          description: 'Additional filters'
        }
      },
      required: ['query']
    },
    handler: async (params) => {
      // Implementation
      const results = await notionAPI.search(params);
      return {
        type: 'notion.search',
        status: 'success',
        results: results
      };
    }
  },
  
  'notion.create': {
    name: 'Notion Create',
    description: 'Create new Notion pages or blocks',
    parameters: {
      type: 'object',
      properties: {
        parent: {
          type: 'string',
          description: 'Parent page or database ID'
        },
        title: {
          type: 'string',
          description: 'Page title'
        },
        content: {
          type: 'array',
          description: 'Page content blocks'
        },
        properties: {
          type: 'object',
          description: 'Database properties'
        }
      },
      required: ['parent', 'title']
    },
    handler: async (params) => {
      const page = await notionAPI.createPage(params);
      return {
        type: 'notion.create',
        status: 'success',
        page: page
      };
    }
  }
};
```

### Supabase Integration

```javascript
const supabaseTools = {
  'supabase.query': {
    name: 'Supabase Query',
    description: 'Query Supabase database tables',
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        select: {
          type: 'string',
          description: 'Columns to select'
        },
        filters: {
          type: 'object',
          description: 'Query filters'
        },
        limit: {
          type: 'number',
          description: 'Result limit'
        }
      },
      required: ['table']
    },
    handler: async (params) => {
      const { data, error } = await supabase
        .from(params.table)
        .select(params.select || '*')
        .limit(params.limit || 100);
      
      if (error) throw error;
      
      return {
        type: 'supabase.query',
        status: 'success',
        data: data
      };
    }
  },
  
  'supabase.insert': {
    name: 'Supabase Insert',
    description: 'Insert records into Supabase',
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        records: {
          type: 'array',
          description: 'Records to insert'
        }
      },
      required: ['table', 'records']
    },
    handler: async (params) => {
      const { data, error } = await supabase
        .from(params.table)
        .insert(params.records);
      
      if (error) throw error;
      
      return {
        type: 'supabase.insert',
        status: 'success',
        inserted: data
      };
    }
  }
};
```

## MCP (Model Context Protocol) Integration

### MCP Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Registry                           │
├─────────────────────────────────────────────────────────────┤
│  Server Discovery:                                          │
│  • Auto-discovery via configuration                         │
│  • Manual registration                                      │
│  • Health checking                                          │
├─────────────────────────────────────────────────────────────┤
│  Protocol Support:                                          │
│  • JSON-RPC 2.0                                            │
│  • WebSocket transport                                      │
│  • HTTP transport                                           │
└─────────────────────────────────────────────────────────────┘
```

### MCP Server Integration

```javascript
class MCPServerManager {
  constructor() {
    this.servers = new Map();
    this.capabilities = new Map();
  }
  
  async registerServer(config) {
    const server = new MCPServer(config);
    await server.connect();
    
    // Get server capabilities
    const capabilities = await server.getCapabilities();
    
    // Register tools from server
    capabilities.tools.forEach(tool => {
      this.registerTool(server.name, tool);
    });
    
    // Register resources
    capabilities.resources?.forEach(resource => {
      this.registerResource(server.name, resource);
    });
    
    // Register prompts
    capabilities.prompts?.forEach(prompt => {
      this.registerPrompt(server.name, prompt);
    });
    
    this.servers.set(server.name, server);
    this.capabilities.set(server.name, capabilities);
    
    return server;
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

### MCP Server Configuration

```javascript
// mcp-config.json
{
  "servers": [
    {
      "name": "notion-mcp",
      "transport": "websocket",
      "url": "ws://localhost:3001",
      "autoConnect": true,
      "tools": {
        "enabled": true,
        "whitelist": ["search", "create", "update"]
      }
    },
    {
      "name": "github-mcp",
      "transport": "http",
      "url": "http://localhost:3002",
      "autoConnect": false,
      "authentication": {
        "type": "bearer",
        "token": "${GITHUB_TOKEN}"
      }
    },
    {
      "name": "analytics-mcp",
      "transport": "websocket",
      "url": "wss://analytics.example.com/mcp",
      "autoConnect": true,
      "reconnect": {
        "enabled": true,
        "maxAttempts": 5,
        "delay": 1000
      }
    }
  ]
}
```

### MCP Client Implementation

```javascript
class MCPClient {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }
  
  async connect() {
    if (this.config.transport === 'websocket') {
      this.connection = new WebSocket(this.config.url);
      
      this.connection.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };
      
      await new Promise((resolve, reject) => {
        this.connection.onopen = resolve;
        this.connection.onerror = reject;
      });
    } else if (this.config.transport === 'http') {
      // HTTP transport implementation
      this.connection = new HTTPTransport(this.config.url);
    }
    
    // Initialize connection
    await this.initialize();
  }
  
  async initialize() {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '1.0',
      capabilities: {
        tools: true,
        resources: true,
        prompts: true
      }
    });
    
    return response.capabilities;
  }
  
  async sendRequest(method, params) {
    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id: id,
      method: method,
      params: params
    };
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      if (this.config.transport === 'websocket') {
        this.connection.send(JSON.stringify(request));
      } else {
        this.connection.post(request).then(response => {
          this.handleMessage(response);
        });
      }
    });
  }
  
  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    }
  }
}
```

## Custom Tool Development

### Tool Template

```javascript
class CustomTool {
  constructor(config) {
    this.name = config.name;
    this.description = config.description;
    this.parameters = config.parameters;
    this.permissions = config.permissions || [];
  }
  
  // Validate parameters against schema
  validateParams(params) {
    // JSON Schema validation
    const valid = ajv.validate(this.parameters, params);
    if (!valid) {
      throw new Error(`Invalid parameters: ${ajv.errorsText()}`);
    }
  }
  
  // Check permissions
  checkPermissions(userPermissions) {
    return this.permissions.every(perm => 
      userPermissions.includes(perm)
    );
  }
  
  // Execute tool
  async execute(params, context) {
    this.validateParams(params);
    
    if (!this.checkPermissions(context.permissions)) {
      throw new Error('Insufficient permissions');
    }
    
    return await this.handler(params, context);
  }
  
  // Tool implementation
  async handler(params, context) {
    // Override in subclass
    throw new Error('Handler not implemented');
  }
}
```

### Example Custom Tool

```javascript
class BusinessAnalyticsTool extends CustomTool {
  constructor() {
    super({
      name: 'business.analytics',
      description: 'Analyze business metrics and KPIs',
      parameters: {
        type: 'object',
        properties: {
          metrics: {
            type: 'array',
            items: { type: 'string' },
            description: 'Metrics to analyze'
          },
          timeRange: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' }
            }
          },
          aggregation: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
            default: 'daily'
          }
        },
        required: ['metrics', 'timeRange']
      },
      permissions: ['analytics:read']
    });
  }
  
  async handler(params, context) {
    // Fetch data from analytics service
    const data = await analyticsService.query({
      metrics: params.metrics,
      startDate: params.timeRange.start,
      endDate: params.timeRange.end,
      aggregation: params.aggregation
    });
    
    // Process and format results
    const analysis = this.analyzeMetrics(data);
    
    return {
      type: 'business.analytics',
      status: 'success',
      data: data,
      analysis: analysis,
      recommendations: this.generateRecommendations(analysis)
    };
  }
  
  analyzeMetrics(data) {
    // Metric analysis logic
    return {
      trends: this.calculateTrends(data),
      anomalies: this.detectAnomalies(data),
      correlations: this.findCorrelations(data)
    };
  }
  
  generateRecommendations(analysis) {
    // Generate actionable recommendations
    const recommendations = [];
    
    if (analysis.trends.declining.length > 0) {
      recommendations.push({
        priority: 'high',
        metric: analysis.trends.declining[0],
        action: 'Investigate declining trend',
        impact: 'Potential revenue impact'
      });
    }
    
    return recommendations;
  }
}
```

## Tool Permissions System

```javascript
class PermissionManager {
  constructor() {
    this.roles = new Map();
    this.userPermissions = new Map();
  }
  
  defineRole(name, permissions) {
    this.roles.set(name, new Set(permissions));
  }
  
  assignRole(userId, role) {
    const permissions = this.roles.get(role);
    if (!permissions) {
      throw new Error(`Role not found: ${role}`);
    }
    
    this.userPermissions.set(userId, permissions);
  }
  
  checkPermission(userId, permission) {
    const userPerms = this.userPermissions.get(userId);
    return userPerms && userPerms.has(permission);
  }
  
  // Default roles
  setupDefaultRoles() {
    this.defineRole('admin', [
      'notion:read', 'notion:write',
      'supabase:read', 'supabase:write',
      'analytics:read', 'analytics:write',
      'tools:manage'
    ]);
    
    this.defineRole('user', [
      'notion:read',
      'supabase:read',
      'analytics:read'
    ]);
    
    this.defineRole('guest', [
      'analytics:read'
    ]);
  }
}
```

## Tool Usage Tracking

```javascript
class ToolUsageTracker {
  constructor() {
    this.usage = new Map();
  }
  
  track(toolName, userId, params, result, duration) {
    const entry = {
      tool: toolName,
      user: userId,
      timestamp: Date.now(),
      duration: duration,
      success: result.status === 'success',
      parameters: this.sanitizeParams(params)
    };
    
    // Store in memory
    if (!this.usage.has(toolName)) {
      this.usage.set(toolName, []);
    }
    this.usage.get(toolName).push(entry);
    
    // Persist to database
    this.persistUsage(entry);
    
    // Update metrics
    this.updateMetrics(entry);
  }
  
  sanitizeParams(params) {
    // Remove sensitive information
    const sanitized = { ...params };
    delete sanitized.apiKey;
    delete sanitized.password;
    return sanitized;
  }
  
  async persistUsage(entry) {
    await database.toolUsage.insert(entry);
  }
  
  updateMetrics(entry) {
    metrics.toolUsage.inc({
      tool: entry.tool,
      status: entry.success ? 'success' : 'failure'
    });
    
    metrics.toolDuration.observe({
      tool: entry.tool
    }, entry.duration);
  }
  
  getUsageStats(toolName, timeRange) {
    const entries = this.usage.get(toolName) || [];
    const filtered = entries.filter(e => 
      e.timestamp >= timeRange.start && 
      e.timestamp <= timeRange.end
    );
    
    return {
      total: filtered.length,
      successful: filtered.filter(e => e.success).length,
      failed: filtered.filter(e => !e.success).length,
      avgDuration: filtered.reduce((sum, e) => sum + e.duration, 0) / filtered.length,
      users: new Set(filtered.map(e => e.user)).size
    };
  }
}
```

## Tool Error Handling

```javascript
class ToolErrorHandler {
  handleError(error, tool, params) {
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'PERMISSION_DENIED':
        return {
          type: 'error',
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to use this tool',
          tool: tool
        };
        
      case 'INVALID_PARAMS':
        return {
          type: 'error',
          code: 'INVALID_PARAMS',
          message: 'Invalid parameters provided',
          tool: tool,
          details: error.details
        };
        
      case 'RATE_LIMIT':
        return {
          type: 'error',
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded',
          tool: tool,
          retryAfter: error.retryAfter
        };
        
      case 'SERVICE_ERROR':
        return {
          type: 'error',
          code: 'SERVICE_ERROR',
          message: 'External service error',
          tool: tool,
          service: error.service
        };
        
      default:
        return {
          type: 'error',
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          tool: tool
        };
    }
  }
  
  classifyError(error) {
    if (error.message.includes('permission')) {
      return 'PERMISSION_DENIED';
    }
    if (error.message.includes('Invalid parameters')) {
      return 'INVALID_PARAMS';
    }
    if (error.message.includes('rate limit')) {
      return 'RATE_LIMIT';
    }
    if (error.service) {
      return 'SERVICE_ERROR';
    }
    return 'UNKNOWN';
  }
}
```

## Future Extensibility

### Planned Features
1. **Plugin System**: Dynamic tool loading via plugins
2. **Tool Marketplace**: Share and discover community tools
3. **Visual Tool Builder**: No-code tool creation interface
4. **Tool Chaining**: Combine multiple tools in workflows
5. **Conditional Tools**: Tools that activate based on context
6. **Tool Versioning**: Support multiple tool versions
7. **Tool Analytics**: Detailed usage analytics and optimization

### Integration Roadmap
- Slack integration tools
- Microsoft Teams tools
- Google Workspace tools
- Salesforce integration
- HubSpot CRM tools
- Stripe payment tools
- AWS service tools
- Custom API integrations

## Next Steps
- [MCP Server Setup →](../deployment/mcp-setup.md)
- [Custom Tool Development →](../development/custom-tools.md)
- [API Reference →](../api/tool-api.md)