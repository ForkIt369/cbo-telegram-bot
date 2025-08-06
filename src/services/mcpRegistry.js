const logger = require('../utils/logger');

/**
 * Registry for MCP server configurations
 * Manages discovery and configuration of available MCP servers
 */
class MCPRegistry {
  constructor() {
    this.servers = new Map();
    this.loadConfiguration();
  }

  loadConfiguration() {
    // Default server configurations
    const defaultServers = [
      {
        id: 'context7',
        name: 'Context7 Documentation',
        description: 'Provides up-to-date documentation for libraries and frameworks',
        transport: process.env.NODE_ENV === 'production' ? 'http' : 'stdio',
        // Production config
        endpoint: process.env.MCP_CONTEXT7_ENDPOINT,
        apiKey: process.env.MCP_CONTEXT7_API_KEY,
        // Development config
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp'],
        capabilities: ['documentation', 'code-examples'],
        enabled: true
      },
      {
        id: 'perplexity',
        name: 'Perplexity Search',
        description: 'Web search and real-time information retrieval',
        transport: 'http',
        endpoint: process.env.MCP_PERPLEXITY_ENDPOINT,
        apiKey: process.env.MCP_PERPLEXITY_API_KEY,
        capabilities: ['web-search', 'real-time-data'],
        enabled: process.env.MCP_PERPLEXITY_ENABLED === 'true'
      },
      {
        id: 'github',
        name: 'GitHub Operations',
        description: 'GitHub repository operations and code search',
        transport: 'http',
        endpoint: process.env.MCP_GITHUB_ENDPOINT,
        apiKey: process.env.MCP_GITHUB_API_KEY,
        capabilities: ['code-search', 'repo-operations'],
        enabled: process.env.MCP_GITHUB_ENABLED === 'true'
      }
    ];

    // Load from environment or config file
    defaultServers.forEach(server => {
      if (server.enabled && this.validateServerConfig(server)) {
        this.servers.set(server.id, server);
        logger.info(`Registered MCP server: ${server.name}`);
      }
    });
  }

  validateServerConfig(config) {
    // Basic validation
    if (!config.id || !config.name) {
      logger.error('Invalid server config: missing id or name');
      return false;
    }

    if (config.transport === 'http' || config.transport === 'sse') {
      if (!config.endpoint) {
        logger.warn(`HTTP/SSE server ${config.id} missing endpoint`);
        return false;
      }
    } else if (config.transport === 'stdio') {
      if (!config.command) {
        logger.warn(`Stdio server ${config.id} missing command`);
        return false;
      }
    }

    return true;
  }

  getServer(id) {
    return this.servers.get(id);
  }

  getAllServers() {
    return Array.from(this.servers.values());
  }

  getEnabledServers() {
    return this.getAllServers().filter(server => server.enabled);
  }

  getServersByCapability(capability) {
    return this.getAllServers().filter(server => 
      server.capabilities && server.capabilities.includes(capability)
    );
  }

  // Dynamic server registration
  registerServer(config) {
    if (!this.validateServerConfig(config)) {
      throw new Error('Invalid server configuration');
    }

    this.servers.set(config.id, config);
    logger.info(`Dynamically registered MCP server: ${config.name}`);
  }

  unregisterServer(id) {
    if (this.servers.delete(id)) {
      logger.info(`Unregistered MCP server: ${id}`);
      return true;
    }
    return false;
  }

  // Get connection configuration for a server
  getConnectionConfig(id) {
    const server = this.getServer(id);
    if (!server) return null;

    const config = {
      id: server.id,
      name: server.name,
      transport: server.transport
    };

    if (server.transport === 'http' || server.transport === 'sse') {
      config.endpoint = server.endpoint;
      config.headers = {};
      
      if (server.apiKey) {
        config.headers['X-API-Key'] = server.apiKey;
      }
    } else if (server.transport === 'stdio') {
      config.command = server.command;
      config.args = server.args;
    }

    return config;
  }

  // Health check for HTTP servers
  async checkServerHealth(id) {
    const server = this.getServer(id);
    if (!server || server.transport === 'stdio') {
      return { healthy: true }; // Assume stdio servers are healthy
    }

    try {
      const response = await fetch(`${server.endpoint}/health`, {
        method: 'GET',
        headers: server.apiKey ? { 'X-API-Key': server.apiKey } : {},
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return {
        healthy: response.ok,
        status: response.status,
        latency: response.headers.get('X-Response-Time')
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // Check health of all servers
  async checkAllServersHealth() {
    const results = {};
    
    for (const server of this.getEnabledServers()) {
      results[server.id] = await this.checkServerHealth(server.id);
    }
    
    return results;
  }
}

// Export singleton instance
module.exports = new MCPRegistry();