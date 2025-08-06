import Anthropic from '@anthropic-ai/sdk';

export class ClaudeService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey
    });
    
    this.model = 'claude-3-5-sonnet-20241022';
    this.maxTokens = 4096;
  }

  async createMessage(messages, options = {}) {
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        messages: messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || 0.7,
        ...options
      });
      
      return response;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  async createStreamingMessage(messages, onChunk, options = {}) {
    try {
      const stream = await this.anthropic.messages.stream({
        model: this.model,
        messages: messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || 0.7,
        ...options
      });

      stream.on('text', (text) => {
        onChunk({ type: 'text', content: text });
      });

      stream.on('message_start', (message) => {
        onChunk({ type: 'message_start', message });
      });

      stream.on('content_block_start', (contentBlock) => {
        onChunk({ type: 'content_block_start', contentBlock });
      });

      stream.on('content_block_delta', (delta) => {
        onChunk({ type: 'content_block_delta', delta });
      });

      stream.on('content_block_stop', (contentBlock) => {
        onChunk({ type: 'content_block_stop', contentBlock });
      });

      stream.on('message_stop', () => {
        onChunk({ type: 'message_stop' });
      });

      stream.on('error', (error) => {
        console.error('Stream error:', error);
        onChunk({ type: 'error', error: error.message });
      });

      const finalMessage = await stream.finalMessage();
      return finalMessage;
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  formatMessagesForClaude(messages) {
    return messages.map(msg => ({
      role: msg.role === 'system' ? 'assistant' : msg.role,
      content: msg.content
    }));
  }

  async analyzeBusinessWithBBMM(context, query) {
    const systemPrompt = `You are the Chief Bro Officer (CBO), a business optimization expert who analyzes businesses through the BroVerse Biz Mental Model™ (BBMM) framework.

The BBMM Framework consists of Four Flows:
1. 💎 Value Flow: How value is created, delivered, and captured
2. 📊 Info Flow: How information moves through the organization
3. ⚡ Work Flow: How work gets done and processes operate
4. 💰 Cash Flow: How money flows in, through, and out

Analyze the user's business query through these four flows to identify opportunities, bottlenecks, and optimization strategies.

Current context: ${JSON.stringify(context)}`;

    const messages = [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: query }
    ];

    return this.createStreamingMessage(messages, (chunk) => chunk);
  }

  async handleToolUse(toolName, params, permissions) {
    if (!this.hasPermission(toolName, permissions)) {
      throw new Error(`Permission denied for tool: ${toolName}`);
    }

    const toolHandlers = {
      'notion.search': this.handleNotionSearch,
      'notion.create': this.handleNotionCreate,
      'supabase.query': this.handleSupabaseQuery,
      'supabase.insert': this.handleSupabaseInsert
    };

    const handler = toolHandlers[toolName];
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    return handler.call(this, params);
  }

  hasPermission(toolName, permissions) {
    return permissions && permissions[toolName] === true;
  }

  async handleNotionSearch(params) {
    return { 
      type: 'notion.search',
      status: 'pending',
      message: 'Notion search integration pending'
    };
  }

  async handleNotionCreate(params) {
    return {
      type: 'notion.create',
      status: 'pending',
      message: 'Notion create integration pending'
    };
  }

  async handleSupabaseQuery(params) {
    return {
      type: 'supabase.query',
      status: 'pending',
      message: 'Supabase query integration pending'
    };
  }

  async handleSupabaseInsert(params) {
    return {
      type: 'supabase.insert',
      status: 'pending',
      message: 'Supabase insert integration pending'
    };
  }
}