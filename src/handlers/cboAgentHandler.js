const logger = require('../utils/logger');
const memoryBank = require('../memory/memoryBank');

class CBOAgentHandler {
  constructor() {
    this.conversations = new Map();
    this.loadCBOAgent();
  }

  loadCBOAgent() {
    try {
      const path = require('path');
      const agentPath = path.resolve(__dirname, '../../agents/cbo-agent.js');
      this.cboAgent = require(agentPath);
      logger.info('CBO Agent loaded successfully');
    } catch (error) {
      logger.warn('CBO Agent not found, using mock agent');
      this.cboAgent = this.createMockAgent();
    }
  }

  createMockAgent() {
    return {
      processQuery: async (query, context) => {
        return `[CBO Agent Mock Response]
        
Query received: "${query}"

This is a placeholder response. Once the actual CBO agent is implemented in /agents, I'll provide real business optimization insights using the BroVerse Biz Mental Model™ (BBMM).

For now, I can tell you that your query would be analyzed across:
- Four Flows (Value, Info, Work, Cash)
- 12 Capabilities
- 64 Business Patterns

Please implement the CBO agent to get actual insights!`;
      },
      clearContext: async (userId) => {
        logger.info(`Context cleared for user ${userId}`);
      }
    };
  }

  async processMessage(userId, message) {
    const context = this.getOrCreateContext(userId);
    context.messages.push({ role: 'user', content: message, timestamp: new Date() });
    
    try {
      const response = await this.cboAgent.processQuery(message, context);
      
      context.messages.push({ role: 'assistant', content: response, timestamp: new Date() });
      
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
      logger.error('Error processing CBO query:', error);
      throw error;
    }
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
    if (this.cboAgent.clearContext) {
      await this.cboAgent.clearContext(userId);
    }
  }
}

module.exports = CBOAgentHandler;