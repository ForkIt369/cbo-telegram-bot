if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const CBOAgentHandler = require('./handlers/cboAgentHandler');

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN is not set!');
  process.exit(1);
}

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
  
  logger.info(`Received message from ${userId}: ${message}`);
  
  try {
    // Send immediate typing action
    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
    
    // Process message with timeout handling
    const processWithTimeout = async () => {
      return Promise.race([
        cboHandler.processMessage(userId, message),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Processing timeout')), 18000)
        )
      ]);
    };
    
    const response = await processWithTimeout();
    
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
    
    if (error.message === 'Processing timeout') {
      await ctx.reply('⏱️ Processing is taking longer than expected. I\'m still working on your request and will respond shortly.');
      
      // Continue processing in background and send response when ready
      cboHandler.processMessage(userId, message)
        .then(response => {
          if (response.length > 4096) {
            const chunks = response.match(/.{1,4096}/g);
            chunks.forEach(chunk => ctx.reply(chunk));
          } else {
            ctx.reply(response);
          }
        })
        .catch(bgError => {
          logger.error('Background processing error:', bgError);
          ctx.reply('Sorry, I encountered an error processing your request. Please try again.');
        });
    } else {
      await ctx.reply('Sorry, I encountered an error processing your request. Please try again.');
    }
  }
});

const PORT = process.env.PORT || 3003;

// Express middleware - MUST be first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add timeout middleware for webhook requests
app.use('/telegram-webhook', (req, res, next) => {
  // Set timeout to 20 seconds (Telegram's limit is ~25 seconds)
  req.setTimeout(20000, () => {
    logger.error('Webhook request timeout');
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  
  res.setTimeout(20000, () => {
    logger.error('Webhook response timeout');
    if (!res.headersSent) {
      res.status(408).json({ error: 'Response timeout' });
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mini App API endpoints

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

// Webhook setup MUST come before static file serving
if (process.env.NODE_ENV === 'production') {
  // Add webhook logging middleware
  app.use('/telegram-webhook', (req, res, next) => {
    logger.info('Webhook request received', {
      method: req.method,
      headers: req.headers,
      body: req.body ? JSON.stringify(req.body).substring(0, 200) : 'No body'
    });
    next();
  });
  
  // Use the bot's webhook callback
  app.use(bot.webhookCallback('/telegram-webhook'));
  
  // Add error handling for webhook
  app.use('/telegram-webhook', (error, req, res, next) => {
    logger.error('Webhook error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

// Serve Mini App
const miniAppPath = path.join(__dirname, '../mini-app/dist');
const fs = require('fs');

// In production, serve the built Mini App if it exists
if (fs.existsSync(miniAppPath)) {
  app.use(express.static(miniAppPath));
  
  // Catch all route for client-side routing - must be last
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/telegram-webhook')) {
      return next();
    }
    res.sendFile(path.join(miniAppPath, 'index.html'));
  });
} else {
  // Development fallback
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

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    try {
      await bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/telegram-webhook`);
      logger.info('Webhook set successfully');
    } catch (error) {
      logger.error('Failed to set webhook:', error);
    }
  } else {
    bot.launch();
    logger.info('Bot started in polling mode');
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Add unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});