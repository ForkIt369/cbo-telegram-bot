const logger = require('../utils/logger');
const memoryBank = require('../memory/memoryBank');
const claudeService = require('../services/claudeService');

class CBOAgentHandler {
  constructor() {
    this.conversations = new Map();
  }

  async processMessage(userId, message) {
    const context = this.getOrCreateContext(userId);
    context.messages.push({ role: 'user', content: message, timestamp: new Date() });
    
    try {
      const response = await claudeService.processBusinessQuery(message, context);
      
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
  }
}

module.exports = CBOAgentHandler;