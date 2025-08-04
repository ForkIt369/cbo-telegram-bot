const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class MemoryBank {
  constructor() {
    this.memoryPath = path.join(__dirname, '../../data/memories');
    this.conversationsPath = path.join(this.memoryPath, 'conversations');
    this.insightsPath = path.join(this.memoryPath, 'insights');
    this.patternsPath = path.join(this.memoryPath, 'patterns');
    this.initializeDirectories();
  }

  async initializeDirectories() {
    const dirs = [this.memoryPath, this.conversationsPath, this.insightsPath, this.patternsPath];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        logger.error(`Error creating directory ${dir}:`, error);
      }
    }
  }

  async saveConversation(userId, conversation) {
    const filename = `${userId}_${Date.now()}.json`;
    const filepath = path.join(this.conversationsPath, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify({
        userId,
        timestamp: new Date().toISOString(),
        conversation,
        metadata: {
          messageCount: conversation.messages.length,
          duration: Date.now() - new Date(conversation.startTime).getTime()
        }
      }, null, 2));
      
      logger.info(`Conversation saved for user ${userId}`);
    } catch (error) {
      logger.error('Error saving conversation:', error);
    }
  }

  async saveInsight(insight) {
    const filename = `insight_${Date.now()}.json`;
    const filepath = path.join(this.insightsPath, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify({
        timestamp: new Date().toISOString(),
        type: insight.type,
        flow: insight.flow,
        content: insight.content,
        userId: insight.userId,
        confidence: insight.confidence || 0.7
      }, null, 2));
      
      logger.info(`Insight saved: ${insight.type}`);
    } catch (error) {
      logger.error('Error saving insight:', error);
    }
  }

  async savePattern(pattern) {
    const filename = `pattern_${pattern.type}_${Date.now()}.json`;
    const filepath = path.join(this.patternsPath, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify({
        timestamp: new Date().toISOString(),
        type: pattern.type,
        description: pattern.description,
        occurrences: pattern.occurrences || 1,
        flows: pattern.flows || [],
        recommendations: pattern.recommendations || []
      }, null, 2));
      
      logger.info(`Pattern saved: ${pattern.type}`);
    } catch (error) {
      logger.error('Error saving pattern:', error);
    }
  }

  async getRecentInsights(limit = 10) {
    try {
      const files = await fs.readdir(this.insightsPath);
      const insights = [];
      
      for (const file of files.slice(-limit)) {
        const content = await fs.readFile(path.join(this.insightsPath, file), 'utf8');
        insights.push(JSON.parse(content));
      }
      
      return insights.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      logger.error('Error getting insights:', error);
      return [];
    }
  }

  async getPatternsByType(type) {
    try {
      const files = await fs.readdir(this.patternsPath);
      const patterns = [];
      
      for (const file of files) {
        if (file.includes(`pattern_${type}_`)) {
          const content = await fs.readFile(path.join(this.patternsPath, file), 'utf8');
          patterns.push(JSON.parse(content));
        }
      }
      
      return patterns;
    } catch (error) {
      logger.error('Error getting patterns:', error);
      return [];
    }
  }

  async getUserHistory(userId, limit = 5) {
    try {
      const files = await fs.readdir(this.conversationsPath);
      const userFiles = files.filter(f => f.startsWith(`${userId}_`));
      const conversations = [];
      
      for (const file of userFiles.slice(-limit)) {
        const content = await fs.readFile(path.join(this.conversationsPath, file), 'utf8');
        conversations.push(JSON.parse(content));
      }
      
      return conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      logger.error('Error getting user history:', error);
      return [];
    }
  }
}

module.exports = new MemoryBank();