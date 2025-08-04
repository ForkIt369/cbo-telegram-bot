require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const logger = require('./utils/logger');
const CBOAgentHandler = require('./handlers/cboAgentHandler');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const cboHandler = new CBOAgentHandler();

bot.start((ctx) => {
  ctx.reply(`Welcome! I'm CBO-Bro, your Chief Business Optimization assistant.

I analyze businesses through 4 key flows:
• VALUE - Customer delivery
• INFO - Data & decisions  
• WORK - Operations
• CASH - Financial health

Just tell me your business challenge and I'll provide actionable insights.

Try: "How can I improve customer retention?" or "My cash flow is tight"`);
});

bot.help((ctx) => {
  ctx.reply(`Commands:
/start - Welcome message
/help - This help menu
/status - Bot status
/clear - Reset conversation

Example questions:
• "How do I scale my SaaS business?"
• "Customer churn is increasing"
• "Need to optimize operations"
• "Revenue is flat, help!"

I'll analyze through Value, Info, Work & Cash flows.`);
});

bot.command('status', (ctx) => {
  ctx.reply(`Bot Status: ✅ Online
Agent: CBO-Bro
Version: 1.0.0
Uptime: ${process.uptime()}s`);
});

bot.command('clear', async (ctx) => {
  await cboHandler.clearContext(ctx.from.id);
  ctx.reply('Conversation context cleared. Fresh start! 🔄');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message.text;
  
  try {
    ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
    
    const response = await cboHandler.processMessage(userId, message);
    
    if (response.length > 4096) {
      const chunks = response.match(/.{1,4096}/g);
      for (const chunk of chunks) {
        await ctx.reply(chunk);
      }
    } else {
      await ctx.reply(response);
    }
  } catch (error) {
    logger.error('Error processing message:', error);
    ctx.reply('Sorry, I encountered an error processing your request. Please try again.');
  }
});

const PORT = process.env.PORT || 3000;
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  app.use(bot.webhookCallback('/telegram-webhook'));
  bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/telegram-webhook`);
} else {
  bot.launch();
  logger.info('Bot started in polling mode');
}

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));