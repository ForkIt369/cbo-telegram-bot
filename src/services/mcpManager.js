const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const HttpClientTransport = require('./transports/httpClientTransport');
const mcpRegistry = require('./mcpRegistry');
const logger = require('../utils/logger');

class MCPManager {
  constructor() {
    this.servers = new Map();
    this.tools = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      logger.info('Initializing MCP Manager...');
      
      // Connect to all enabled servers from registry
      const enabledServers = mcpRegistry.getEnabledServers();
      logger.info(`Found ${enabledServers.length} enabled MCP servers`);
      
      for (const serverConfig of enabledServers) {
        await this.connectServer(serverConfig.id);
      }
      
      this.initialized = true;
      logger.info(`MCP Manager initialized with ${this.tools.size} tools from ${this.servers.size} servers`);
    } catch (error) {
      logger.error('Failed to initialize MCP Manager:', error);
      // Don't throw - allow bot to work without MCP
    }
  }

  async connectServer(serverId) {
    try {
      const config = mcpRegistry.getConnectionConfig(serverId);
      if (!config) {
        logger.error(`Server ${serverId} not found in registry`);
        return;
      }
      
      logger.info(`Connecting to ${config.name} MCP server...`);
      
      // Create appropriate transport based on config
      let transport;
      
      if (config.transport === 'http' || config.transport === 'sse') {
        // Use HTTP transport for production
        transport = new HttpClientTransport({
          endpoint: config.endpoint,
          headers: config.headers,
          transport: config.transport
        });
      } else if (config.transport === 'stdio') {
        // Use stdio transport for development
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args
        });
      } else {
        throw new Error(`Unknown transport type: ${config.transport}`);
      }

      // Create MCP client
      const client = new Client({
        name: 'cbo-bot',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      // Connect to the server
      await client.connect(transport);
      
      // Discover available tools
      const tools = await client.listTools();
      logger.info(`${config.name} connected with ${tools.tools.length} tools`);
      
      // Store server connection
      this.servers.set(serverId, { 
        client, 
        transport,
        config 
      });
      
      // Register each tool with server prefix to avoid conflicts
      for (const tool of tools.tools) {
        const toolName = `${serverId}:${tool.name}`;
        this.tools.set(toolName, {
          server: serverId,
          originalName: tool.name,
          definition: tool
        });
        logger.info(`Registered tool: ${toolName}`);
      }
      
    } catch (error) {
      logger.error(`Failed to connect ${serverId} MCP:`, error);
      // Continue without this server - non-critical failure
    }
  }

  async getAvailableTools() {
    // Return tools in Claude-compatible format
    const tools = [];
    
    for (const [name, info] of this.tools) {
      tools.push({
        name: name, // Use full name with server prefix
        description: `[${info.server}] ${info.definition.description}`,
        input_schema: info.definition.inputSchema
      });
    }
    
    return tools;
  }

  async callTool(toolName, params) {
    const toolInfo = this.tools.get(toolName);
    if (!toolInfo) {
      throw new Error(`Tool ${toolName} not found`);
    }

    const serverInfo = this.servers.get(toolInfo.server);
    if (!serverInfo) {
      throw new Error(`Server ${toolInfo.server} not connected`);
    }

    try {
      logger.info(`Calling tool ${toolName} with params:`, params);
      
      // Use original tool name when calling the server
      const result = await serverInfo.client.callTool({
        name: toolInfo.originalName,
        arguments: params
      });
      
      logger.info(`Tool ${toolName} completed successfully`);
      return result;
    } catch (error) {
      logger.error(`Tool ${toolName} failed:`, error);
      throw error;
    }
  }

  async disconnect() {
    logger.info('Disconnecting MCP servers...');
    
    for (const [name, serverInfo] of this.servers) {
      try {
        await serverInfo.client.close();
        logger.info(`Disconnected from ${name}`);
      } catch (error) {
        logger.error(`Error disconnecting ${name}:`, error);
      }
    }
    
    this.servers.clear();
    this.tools.clear();
    this.initialized = false;
  }

  // Helper method to check if MCP is available
  isAvailable() {
    return this.initialized && this.tools.size > 0;
  }

  // Get tool information
  getTool(toolName) {
    return this.tools.get(toolName);
  }

  // List all available tools
  listTools() {
    const tools = [];
    for (const [name, info] of this.tools) {
      tools.push({
        name: name,
        description: info.definition.description,
        server: info.server
      });
    }
    return tools;
  }

  // Get tools by server
  getToolsByServer(serverId) {
    const tools = [];
    for (const [name, info] of this.tools) {
      if (info.server === serverId) {
        tools.push({
          name: name,
          description: info.definition.description
        });
      }
    }
    return tools;
  }

  // Check health of all connected servers
  async checkHealth() {
    const health = {};
    
    for (const [serverId, serverInfo] of this.servers) {
      try {
        // Try to list tools as a health check
        await serverInfo.client.listTools();
        health[serverId] = { 
          status: 'healthy',
          connected: true,
          toolCount: this.getToolsByServer(serverId).length
        };
      } catch (error) {
        health[serverId] = {
          status: 'unhealthy',
          connected: false,
          error: error.message
        };
      }
    }
    
    // Also check registry health for HTTP servers
    const registryHealth = await mcpRegistry.checkAllServersHealth();
    
    // Merge results
    for (const [serverId, status] of Object.entries(registryHealth)) {
      if (health[serverId]) {
        health[serverId].registry = status;
      }
    }
    
    return health;
  }

  // Reconnect to a specific server
  async reconnectServer(serverId) {
    logger.info(`Attempting to reconnect to ${serverId}...`);
    
    // Disconnect existing connection
    const serverInfo = this.servers.get(serverId);
    if (serverInfo) {
      try {
        await serverInfo.client.close();
      } catch (error) {
        logger.error(`Error closing existing connection:`, error);
      }
      this.servers.delete(serverId);
      
      // Remove tools from this server
      for (const [name, info] of this.tools) {
        if (info.server === serverId) {
          this.tools.delete(name);
        }
      }
    }
    
    // Reconnect
    await this.connectServer(serverId);
  }
}

// Export singleton instance
module.exports = new MCPManager();