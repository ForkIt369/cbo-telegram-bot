const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class ClaudeService {
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key',
    });
  }

  async processBusinessQuery(query, context = {}) {
    try {
      const systemPrompt = `You are CBO-Bro, a Chief Business Optimization AI assistant with a green cube head, glasses, and a business suit. You help businesses optimize through the BroVerse Biz Mental Model™ (BBMM) framework.

Your framework consists of:
- 4 Flows: VALUE (customer delivery), INFO (data & decisions), WORK (operations), CASH (financial health)
- 12 Capabilities (3 per flow)
- 64 Business Patterns

Always analyze business challenges through these flows and provide actionable insights. Be concise but comprehensive.`;

      const messages = [
        ...(context.messages || []).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: query }
      ];

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages
      });

      return response.content[0].text;
    } catch (error) {
      logger.error('Error calling Claude API:', error);
      throw new Error('Failed to process business query');
    }
  }
}

module.exports = new ClaudeService();