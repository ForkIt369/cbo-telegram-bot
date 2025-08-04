const logger = require('../src/utils/logger');
const Anthropic = require('@anthropic-ai/sdk');

class CBOAgent {
  constructor() {
    this.name = 'CBO-Bro';
    this.version = '2.0.0';
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.systemPrompt = `You are CBO-Bro, Chief Business Optimization expert using the BroVerse Biz Mental Model™ (BBMM).

Your role is to analyze business challenges through the lens of Four Flows:
1. VALUE FLOW - Customer value creation and delivery
2. INFO FLOW - Data, insights, and decision-making  
3. WORK FLOW - Operations and process efficiency
4. CASH FLOW - Financial health and sustainability

You also consider 12 Core Capabilities and 64 Business Patterns.

IMPORTANT FORMATTING RULES:
- Keep responses concise and actionable
- Use clear sections with proper line breaks
- Avoid excessive emojis or formatting
- Focus on practical insights
- Structure responses for Telegram readability (no markdown tables)

When responding:
1. Identify the primary flow(s) affected
2. Provide 2-3 specific, actionable recommendations
3. Suggest immediate next steps
4. Keep total response under 1000 characters when possible`;
  }

  async processQuery(query, context) {
    logger.info(`Processing query with Claude: ${query}`);
    
    try {
      const messages = this.buildMessageHistory(context);
      messages.push({ role: 'user', content: query });

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        system: this.systemPrompt,
        messages: messages
      });

      return this.formatResponse(response.content[0].text);
    } catch (error) {
      logger.error('Error calling Claude API:', error);
      return this.getFallbackResponse(query);
    }
  }

  buildMessageHistory(context) {
    if (!context.messages) return [];
    
    return context.messages
      .slice(-10)
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
  }

  formatResponse(response) {
    // Clean up any excessive formatting
    let formatted = response
      .replace(/\*\*/g, '')  // Remove bold markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\n{3,}/g, '\n\n') // Limit line breaks
      .trim();

    // Ensure response isn't too long for Telegram
    if (formatted.length > 4000) {
      formatted = formatted.substring(0, 3900) + '\n\n... (Response truncated)';
    }

    return formatted;
  }

  getFallbackResponse(query) {
    return `I'm analyzing your query about: "${query}"

Due to a technical issue, I'll provide a quick framework approach:

FLOW ASSESSMENT:
• Identify which of the 4 flows (Value, Info, Work, Cash) this impacts
• Look for bottlenecks or inefficiencies
• Consider cross-flow dependencies

QUICK WINS:
• Start with the most constrained flow
• Implement small tests before scaling
• Measure impact continuously

Let me know if you need specific analysis on any flow!`;
  }

  async clearContext(userId) {
    logger.info(`Context cleared for user ${userId}`);
  }
}

module.exports = new CBOAgent();