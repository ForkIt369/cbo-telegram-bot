const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class MemoryBank {
  constructor() {
    this.memoryPath = path.join(__dirname, '../../data/memories');
    this.conversationsPath = path.join(this.memoryPath, 'conversations');
    this.insightsPath = path.join(this.memoryPath, 'insights');
    this.patternsPath = path.join(this.memoryPath, 'patterns');
    this.initialized = false;
  }

  async initializeDirectories() {
    if (this.initialized) return;
    
    const dirs = [this.memoryPath, this.conversationsPath, this.insightsPath, this.patternsPath];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        logger.warn(`Could not create directory ${dir}:`, error.message);
      }
    }
    this.initialized = true;
  }

  async saveConversation(userId, conversation) {
    await this.initializeDirectories();
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
      logger.warn('Could not save conversation to disk:', error.message);
    }
  }

  async saveInsight(insight) {
    await this.initializeDirectories();
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
      logger.warn('Could not save insight to disk:', error.message);
    }
  }

  async savePattern(pattern) {
    await this.initializeDirectories();
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
      logger.warn('Could not save pattern to disk:', error.message);
    }
  }

  async getRecentInsights(limit = 10) {
    try {
      await this.initializeDirectories();
      const files = await fs.readdir(this.insightsPath);
      const insights = [];
      
      for (const file of files.slice(-limit)) {
        const content = await fs.readFile(path.join(this.insightsPath, file), 'utf8');
        insights.push(JSON.parse(content));
      }
      
      return insights.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      logger.warn('Could not read insights:', error.message);
      return [];
    }
  }

  async getPatternsByType(type) {
    try {
      await this.initializeDirectories();
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
      logger.warn('Could not read patterns:', error.message);
      return [];
    }
  }

  async getUserHistory(userId, limit = 5) {
    try {
      await this.initializeDirectories();
      const files = await fs.readdir(this.conversationsPath);
      const userFiles = files.filter(f => f.startsWith(`${userId}_`));
      const conversations = [];
      
      for (const file of userFiles.slice(-limit)) {
        const content = await fs.readFile(path.join(this.conversationsPath, file), 'utf8');
        conversations.push(JSON.parse(content));
      }
      
      return conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      logger.warn('Could not read user history:', error.message);
      return [];
    }
  }
}

module.exports = new MemoryBank();