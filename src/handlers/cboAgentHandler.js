const logger = require('../utils/logger');
const memoryBank = require('../memory/memoryBank');
const claudeService = require('../services/claudeService');
const configService = require('../services/configService');
const { getAgentPrompt, getAgentGreeting } = require('../../agents/agent-personalities');
// MCP tools moved to experimental - using basic service only
// const claudeServiceWithTools = require('../services/claudeServiceWithTools');

class CBOAgentHandler {
  constructor() {
    this.conversations = new Map();
    this.useTools = process.env.ENABLE_MCP_TOOLS === 'true';
    this.currentConfig = null;
    this.currentAgent = 'cbo'; // Default agent
    
    // Load initial configuration
    this.loadConfig();
    
    if (this.useTools) {
      logger.info('CBOAgentHandler initialized with MCP tools support');
    } else {
      logger.info('CBOAgentHandler initialized without MCP tools');
    }
  }
  
  async loadConfig() {
    try {
      this.currentConfig = await configService.getActiveConfig();
      logger.info('Loaded active configuration');
    } catch (error) {
      logger.error('Failed to load configuration:', error);
    }
  }
  
  async reloadConfig(config) {
    try {
      this.currentConfig = config || await configService.getActiveConfig();
      logger.info('Configuration reloaded');
      
      // Clear conversation contexts to apply new config
      this.conversations.clear();
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to reload configuration:', error);
      throw error;
    }
  }

  async processMessage(userId, message, agentKey = 'cbo') {
    const context = this.getOrCreateContext(userId);
    context.messages.push({ role: 'user', content: message, timestamp: new Date() });
    
    try {
      // Get agent personality
      const agentPersonality = getAgentPrompt(agentKey);
      
      // Use appropriate service based on configuration
      // Always use basic claude service (MCP tools are experimental)
      const service = claudeService;
      const response = await service.processBusinessQuery(
        message, 
        context, 
        agentPersonality.systemPrompt
      );
      
      context.messages.push({ 
        role: 'assistant', 
        content: response, 
        timestamp: new Date(),
        agent: agentKey 
      });
      
      // Save conversation periodically
      if (context.messages.length % 10 === 0) {
        await memoryBank.saveConversation(userId, context);
      }
      
      // Extract and save insights
      this.extractInsights(userId, message, response);
      
      if (context.messages.length > 50) {
        context.messages = context.messages.slice(-20);
      }
      
      return response;
    } catch (error) {
      logger.error(`Error processing ${agentKey} query:`, error);
      throw error;
    }
  }
  
  // New method to get agent greeting
  async getAgentGreeting(agentKey = 'cbo') {
    return getAgentGreeting(agentKey);
  }
  
  // New method to switch agent context
  async switchAgent(userId, newAgent) {
    const context = this.getOrCreateContext(userId);
    context.currentAgent = newAgent;
    return { success: true, agent: newAgent };
  }

  async extractInsights(userId, query, response) {
    // Simple pattern detection for now
    const flowKeywords = {
      value: ['customer', 'user', 'satisfaction', 'experience'],
      info: ['data', 'analytics', 'metrics', 'insights'],
      work: ['process', 'operation', 'efficiency', 'productivity'],
      cash: ['revenue', 'cost', 'profit', 'financial']
    };

    for (const [flow, keywords] of Object.entries(flowKeywords)) {
      if (keywords.some(kw => query.toLowerCase().includes(kw))) {
        await memoryBank.saveInsight({
          type: 'flow_query',
          flow,
          content: query,
          userId,
          confidence: 0.8
        });
      }
    }
  }

  getOrCreateContext(userId) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, {
        userId,
        startTime: new Date(),
        messages: []
      });
    }
    return this.conversations.get(userId);
  }

  async clearContext(userId) {
    this.conversations.delete(userId);
  }
  
  async processWithConfig(message, testConfig) {
    // Create a temporary context for testing
    const testContext = {
      userId: 'test-user',
      startTime: new Date(),
      messages: []
    };
    
    try {
      // Temporarily use test config
      const originalConfig = this.currentConfig;
      this.currentConfig = testConfig;
      
      // Process message with test config
      const response = await claudeService.processBusinessQuery(message, testContext, testConfig.system_prompt);
      
      // Restore original config
      this.currentConfig = originalConfig;
      
      return response;
    } catch (error) {
      logger.error('Error processing with test config:', error);
      throw error;
    }
  }
}

module.exports = CBOAgentHandler;