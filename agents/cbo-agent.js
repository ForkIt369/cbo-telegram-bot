const logger = require('../src/utils/logger');
const Anthropic = require('@anthropic-ai/sdk');

// Context7 MCP integration for up-to-date library docs
class Context7Service {
  constructor() {
    this.baseUrl = process.env.CONTEXT7_API_URL || 'https://api.context7.dev';
  }

  async resolveLibraryId(libraryName) {
    try {
      const response = await fetch(`${this.baseUrl}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryName })
      });
      return await response.json();
    } catch (error) {
      logger.error('Context7 resolve error:', error);
      return null;
    }
  }

  async getLibraryDocs(libraryId, topic = null) {
    try {
      const body = { context7CompatibleLibraryID: libraryId };
      if (topic) body.topic = topic;
      
      const response = await fetch(`${this.baseUrl}/docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await response.json();
    } catch (error) {
      logger.error('Context7 docs error:', error);
      return null;
    }
  }
}

class CBOAgent {
  constructor() {
    this.name = 'CBO-Bro';
    this.version = '2.1.0';
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.context7 = new Context7Service();
    this.systemPrompt = `You are CBO-Bro, Chief Business Optimization expert using the BroVerse Biz Mental Model™ (BBMM).

Your role is to analyze business challenges through the lens of Four Flows:
1. VALUE FLOW - Customer value creation and delivery
2. INFO FLOW - Data, insights, and decision-making  
3. WORK FLOW - Operations and process efficiency
4. CASH FLOW - Financial health and sustainability

You also consider 12 Core Capabilities and 64 Business Patterns.

You have access to Context7 for up-to-date library documentation and code examples when technical implementation is discussed.

IMPORTANT FORMATTING RULES:
- Keep responses concise and actionable
- Use clear sections with proper line breaks
- Avoid excessive emojis or formatting
- Focus on practical insights
- Structure responses for Telegram readability (no markdown tables)
- When technical solutions are mentioned, offer to provide current documentation

When responding:
1. Identify the primary flow(s) affected
2. Provide 2-3 specific, actionable recommendations
3. Suggest immediate next steps
4. Offer technical documentation if implementation is discussed
5. Keep total response under 1000 characters when possible`;
  }

  async processQuery(query, context) {
    logger.info(`Processing query with Claude: ${query}`);
    
    try {
      // Check if query involves technical libraries and enhance with Context7
      let enhancedPrompt = this.systemPrompt;
      if (this.containsTechnicalTerms(query)) {
        const libraryContext = await this.getRelevantLibraryContext(query);
        if (libraryContext) {
          enhancedPrompt += `\n\nRELEVANT TECHNICAL CONTEXT:\n${libraryContext}`;
        }
      }

      const messages = this.buildMessageHistory(context);
      messages.push({ role: 'user', content: query });

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        system: enhancedPrompt,
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

  containsTechnicalTerms(query) {
    const techTerms = ['api', 'sdk', 'framework', 'library', 'database', 'react', 'node', 'python', 'javascript', 'typescript', 'deployment', 'hosting', 'cloud', 'aws', 'docker', 'kubernetes', 'microservice', 'integration', 'automation', 'ai', 'ml', 'analytics', 'saas', 'app development', 'web app', 'mobile app', 'backend', 'frontend', 'server'];
    const lowerQuery = query.toLowerCase();
    return techTerms.some(term => lowerQuery.includes(term));
  }

  async getRelevantLibraryContext(query) {
    try {
      // Extract potential library names from query
      const libraryKeywords = this.extractLibraryNames(query);
      
      if (libraryKeywords.length === 0) return null;
      
      let context = '';
      for (const keyword of libraryKeywords.slice(0, 2)) { // Limit to 2 to avoid token bloat
        const resolved = await this.context7.resolveLibraryId(keyword);
        if (resolved && resolved.libraries && resolved.libraries.length > 0) {
          const libraryId = resolved.libraries[0].id;
          const docs = await this.context7.getLibraryDocs(libraryId);
          if (docs) {
            context += `${keyword}: ${docs.summary || 'Documentation available'}\n`;
          }
        }
      }
      
      return context || null;
    } catch (error) {
      logger.error('Error getting library context:', error);
      return null;
    }
  }

  extractLibraryNames(query) {
    const commonLibraries = ['react', 'node', 'express', 'angular', 'vue', 'python', 'django', 'flask', 'tensorflow', 'pytorch', 'kubernetes', 'docker', 'aws', 'azure', 'mongodb', 'postgresql', 'redis', 'stripe', 'twilio', 'anthropic', 'openai'];
    const found = [];
    const lowerQuery = query.toLowerCase();
    
    commonLibraries.forEach(lib => {
      if (lowerQuery.includes(lib)) {
        found.push(lib);
      }
    });
    
    return found;
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