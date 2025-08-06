const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');
const mcpManager = require('./mcpManager');

class ClaudeServiceWithTools {
  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.error('ANTHROPIC_API_KEY is not set in environment variables');
      this.anthropic = null;
      return;
    }
    
    try {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
      logger.info('Claude service with tools initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Claude service:', error);
      this.anthropic = null;
    }
  }

  async processBusinessQuery(query, context = {}) {
    if (!this.anthropic) {
      logger.error('Claude service not initialized');
      return 'I apologize, but I am experiencing technical difficulties. Please try again later.';
    }
    
    try {
      // Initialize MCP if not already done - but don't fail if it doesn't work
      try {
        await mcpManager.initialize();
      } catch (mcpError) {
        logger.warn('MCP initialization failed, continuing without tools:', mcpError.message);
      }
      
      const systemPrompt = `You are CBO-Bro, a Chief Business Optimization AI assistant with a green cube head, glasses, and a business suit. You help businesses optimize through the BroVerse Biz Mental Model™ (BBMM) framework.

Your framework consists of:
- 4 Flows: VALUE (customer delivery), INFO (data & decisions), WORK (operations), CASH (financial health)
- 12 Capabilities (3 per flow)
- 64 Business Patterns

Always analyze business challenges through these flows and provide actionable insights. Be concise but comprehensive.

${mcpManager.isAvailable() ? 'You have access to additional tools through MCP. Use them when they can enhance your analysis.' : ''}`;

      const messages = [
        ...(context.messages || []).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: query }
      ];

      // Get available tools from MCP
      const tools = mcpManager.isAvailable() ? await mcpManager.getAvailableTools() : [];
      
      logger.info(`Processing query with ${tools.length} available tools`);

      // Create message with tools if available
      const messageOptions = {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: messages
      };

      // Add tools if available
      if (tools.length > 0) {
        messageOptions.tools = tools;
        messageOptions.tool_choice = 'auto'; // Let Claude decide when to use tools
      }

      const response = await this.anthropic.messages.create(messageOptions, {
        timeout: 15000 // 15 second timeout
      });

      // Handle tool use if Claude wants to use tools
      if (response.stop_reason === 'tool_use') {
        return await this.handleToolUse(response, messages, systemPrompt);
      }

      // Extract text from response
      const textContent = response.content.find(c => c.type === 'text');
      return textContent ? textContent.text : 'I apologize, but I could not generate a response.';
      
    } catch (error) {
      logger.error('Error in Claude service:', error);
      
      if (error.message?.includes('timeout')) {
        throw new Error('Claude API timeout - response took too long');
      } else if (error.status === 429) {
        throw new Error('Claude API rate limit exceeded - please try again later');
      } else if (error.status >= 500) {
        throw new Error('Claude API server error - please try again');
      } else {
        throw new Error('Failed to process business query');
      }
    }
  }

  async handleToolUse(response, previousMessages, systemPrompt) {
    const toolUseContent = response.content.find(c => c.type === 'tool_use');
    
    if (!toolUseContent) {
      logger.error('Tool use response without tool_use content');
      return 'I encountered an error while trying to use additional tools.';
    }

    try {
      logger.info(`Claude wants to use tool: ${toolUseContent.name}`);
      
      // Execute the tool through MCP
      const toolResult = await mcpManager.callTool(
        toolUseContent.name,
        toolUseContent.input
      );

      // Continue conversation with tool result
      const updatedMessages = [
        ...previousMessages,
        {
          role: 'assistant',
          content: response.content
        },
        {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUseContent.id,
            content: JSON.stringify(toolResult)
          }]
        }
      ];

      // Get Claude's final response with tool results
      const finalResponse = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: updatedMessages
      }, {
        timeout: 15000
      });

      // Extract text from final response
      const textContent = finalResponse.content.find(c => c.type === 'text');
      return textContent ? textContent.text : 'I apologize, but I could not generate a response.';
      
    } catch (error) {
      logger.error('Error executing tool:', error);
      return `I tried to use additional tools to help with your query, but encountered an error. Let me provide an analysis based on my knowledge.\n\n${response.content.find(c => c.type === 'text')?.text || 'I apologize, but I could not generate a response.'}`;
    }
  }

  // Method to check if MCP tools are available
  async getAvailableTools() {
    await mcpManager.initialize();
    return mcpManager.listTools();
  }
}

module.exports = new ClaudeServiceWithTools();