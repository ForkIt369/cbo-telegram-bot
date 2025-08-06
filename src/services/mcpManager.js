const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');
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
      
      // Initialize Context7 MCP as our first real MCP server
      await this.connectContext7();
      
      this.initialized = true;
      logger.info(`MCP Manager initialized with ${this.tools.size} tools`);
    } catch (error) {
      logger.error('Failed to initialize MCP Manager:', error);
      // Don't throw - allow bot to work without MCP
    }
  }

  async connectContext7() {
    try {
      logger.info('Connecting to Context7 MCP server...');
      
      // In production, npx might not be available
      // Skip MCP initialization in production for now
      if (process.env.NODE_ENV === 'production') {
        logger.info('Skipping MCP initialization in production environment');
        return;
      }
      
      // Check if npx is available
      const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      
      // Create transport for Context7 MCP server
      const transport = new StdioClientTransport({
        command: npxPath,
        args: ['-y', '@upstash/context7-mcp']
      });

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
      logger.info(`Context7 MCP connected with ${tools.tools.length} tools`);
      
      // Store server and tools
      this.servers.set('context7', { client, transport });
      
      // Register each tool
      for (const tool of tools.tools) {
        this.tools.set(tool.name, {
          server: 'context7',
          definition: tool
        });
        logger.info(`Registered tool: ${tool.name}`);
      }
      
    } catch (error) {
      logger.error('Failed to connect Context7 MCP:', error);
      // Continue without Context7 - non-critical failure
    }
  }

  async getAvailableTools() {
    // Return tools in Claude-compatible format
    const tools = [];
    
    for (const [name, info] of this.tools) {
      tools.push({
        name: info.definition.name,
        description: info.definition.description,
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
      
      const result = await serverInfo.client.callTool({
        name: toolName,
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
}

// Export singleton instance
module.exports = new MCPManager();