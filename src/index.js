if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const CBOAgentHandler = require('./handlers/cboAgentHandler');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const cboHandler = new CBOAgentHandler();

bot.start((ctx) => {
  ctx.reply(`🤖 Welcome! I'm CBO-Bro, your Chief Business Optimization assistant.

I'm that green cube-headed business expert with glasses who helps you optimize through 4 key flows:
• 💎 VALUE - Customer delivery
• 📊 INFO - Data & decisions  
• ⚙️ WORK - Operations
• 💰 CASH - Financial health

Just tell me your business challenge and I'll provide actionable insights!

💡 Pro tip: Click the menu button for a better chat experience with my Mini App!

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

const PORT = process.env.PORT || 3003;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mini App API endpoints
app.use(express.json());

// Get chat history
app.get('/api/chat/history/:userId', async (req, res) => {
  try {
    const messages = cboHandler.getOrCreateContext(req.params.userId).messages;
    res.json({ messages: messages.slice(-20) });
  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Send message
app.post('/api/chat/message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const response = await cboHandler.processMessage(userId, message);
    res.json({ response });
  } catch (error) {
    logger.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Clear chat
app.post('/api/chat/clear', async (req, res) => {
  try {
    const { userId } = req.body;
    await cboHandler.clearContext(userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error clearing chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

// Serve Mini App
const miniAppPath = path.join(__dirname, '../mini-app/dist');
const fs = require('fs');

if (fs.existsSync(miniAppPath)) {
  app.use(express.static(miniAppPath));
  
  // Fallback to index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(miniAppPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>CBO-Bro Mini App</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #1a1a1a;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .container {
              max-width: 600px;
            }
            .avatar {
              width: 120px;
              height: 120px;
              background: #00ff41;
              border-radius: 20px;
              margin: 0 auto 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 60px;
            }
            h1 {
              color: #00ff41;
              margin-bottom: 20px;
            }
            p {
              color: #888;
              line-height: 1.6;
              margin-bottom: 30px;
            }
            .button {
              background: #00ff41;
              color: #000;
              padding: 15px 30px;
              border-radius: 10px;
              text-decoration: none;
              font-weight: bold;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="avatar">🤖</div>
            <h1>CBO-Bro Mini App</h1>
            <p>The Mini App is being prepared. Please use the Telegram bot directly for now.</p>
            <p>I'm your Chief Business Optimization assistant, helping you optimize through Value, Info, Work & Cash flows.</p>
            <a href="https://t.me/cbo_bro_bot" class="button">Open in Telegram</a>
          </div>
        </body>
      </html>
    `);
  });
}

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