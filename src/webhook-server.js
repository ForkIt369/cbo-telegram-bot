/**
 * Webhook Server for Both Telegram Bots
 * Uses a single webhook endpoint with internal routing
 */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bot instances
let mainBot = null;
let sdkBot = null;
let mainBotStatus = 'initializing';
let sdkBotStatus = 'initializing';

// Initialize handlers
const CBOAgentHandler = require('./handlers/cboAgentHandler');
const mainHandler = new CBOAgentHandler();

// Main Bot Setup
if (process.env.MAIN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN) {
  const token = process.env.MAIN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  mainBot = new Telegraf(token);
  
  mainBot.start((ctx) => {
    ctx.reply(`🤖 Welcome to CBO-Bro Bot!
    
I'm your Chief Bro Officer, here to help optimize your business using the BroVerse Biz Mental Model™.

🎯 I analyze through Four Flows:
• Value Flow - Customer happiness & pricing
• Info Flow - Knowledge & decisions  
• Work Flow - Efficiency & processes
• Cash Flow - Money movement & health

How can I help you today?`);
  });
  
  mainBot.on('text', async (ctx) => {
    try {
      await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
      const response = await mainHandler.processMessage(ctx.from.id, ctx.message.text);
      await ctx.reply(response);
    } catch (error) {
      logger.error('Main bot error:', error);
      await ctx.reply('Sorry, I encountered an error. Please try again.');
    }
  });
  
  mainBotStatus = 'ready';
}

// SDK Bot Setup
if (process.env.SDK_BOT_TOKEN) {
  sdkBot = new Telegraf(process.env.SDK_BOT_TOKEN);
  
  sdkBot.start((ctx) => {
    ctx.reply(`🚀 Welcome to ClaudeBRO SDK!
    
I'm your advanced business optimization assistant with the BroVerse framework.

Click the menu button below to open the SDK Mini App!`);
  });
  
  sdkBot.on('text', async (ctx) => {
    try {
      await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
      const response = await mainHandler.processMessage(ctx.from.id, ctx.message.text);
      await ctx.reply(response);
    } catch (error) {
      logger.error('SDK bot error:', error);
      await ctx.reply('Sorry, I encountered an error. Please try again.');
    }
  });
  
  sdkBotStatus = 'ready';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    bots: {
      main: mainBotStatus,
      sdk: sdkBotStatus
    },
    env: {
      hasMainToken: !!(process.env.MAIN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN),
      hasSdkToken: !!process.env.SDK_BOT_TOKEN,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Universal webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    // Determine which bot should handle this update
    // You can use various methods to identify the bot:
    // 1. Check the bot username mentioned in the message
    // 2. Use different webhook URLs with a secret token
    // 3. Check the chat/user context
    
    // For now, we'll try both bots and see which one handles it
    let handled = false;
    
    // Try main bot first
    if (mainBot) {
      try {
        await mainBot.handleUpdate(update);
        handled = true;
      } catch (error) {
        // Not for this bot
      }
    }
    
    // If not handled by main bot, try SDK bot
    if (!handled && sdkBot) {
      try {
        await sdkBot.handleUpdate(update);
        handled = true;
      } catch (error) {
        // Not for this bot either
      }
    }
    
    res.sendStatus(200);
  } catch (error) {
    logger.error('Webhook error:', error);
    res.sendStatus(200); // Always return 200 to avoid Telegram retries
  }
});

// Specific webhook endpoints that redirect to universal handler
app.post('/webhook/main', async (req, res) => {
  if (mainBot) {
    try {
      await mainBot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      logger.error('Main webhook error:', error);
      res.sendStatus(200);
    }
  } else {
    res.sendStatus(404);
  }
});

app.post('/webhook/sdk', async (req, res) => {
  if (sdkBot) {
    try {
      await sdkBot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      logger.error('SDK webhook error:', error);
      res.sendStatus(200);
    }
  } else {
    res.sendStatus(404);
  }
});

// Serve Main Bot Mini App at root (but not for webhook routes)
const miniAppPath = path.join(__dirname, '../mini-app/dist');
if (require('fs').existsSync(miniAppPath)) {
  app.use('/', (req, res, next) => {
    // Skip static serving for webhook routes
    if (req.path.startsWith('/webhook')) {
      return next();
    }
    express.static(miniAppPath)(req, res, next);
  });
}

// Serve SDK Bot Mini App at /sdk
const sdkAppPath = path.join(__dirname, '../ClaudeBROSDK/src');
if (require('fs').existsSync(sdkAppPath)) {
  app.use('/sdk', express.static(sdkAppPath));
  
  // SDK API endpoints
  app.post('/sdk/api/chat', async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      const response = await mainHandler.processMessage(sessionId, message);
      res.json({ response });
    } catch (error) {
      logger.error('SDK API error:', error);
      res.status(500).json({ error: 'Processing failed' });
    }
  });
}

// Serve admin panel
const adminPath = path.join(__dirname, '../admin');
app.use('/admin', express.static(adminPath));

// Start server and configure webhooks
app.listen(PORT, async () => {
  logger.info(`Webhook server running on port ${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    const WEBHOOK_URL = process.env.WEBHOOK_URL;
    
    // Set up main bot webhook
    if (mainBot) {
      try {
        await mainBot.telegram.setWebhook(`${WEBHOOK_URL}/webhook/main`);
        await mainBot.telegram.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: 'Open CBO-Bro',
            web_app: { url: WEBHOOK_URL }
          }
        });
        mainBotStatus = 'active';
        logger.info('Main bot webhook configured');
      } catch (error) {
        logger.error('Main bot webhook setup failed:', error);
        mainBotStatus = 'error';
      }
    }
    
    // Set up SDK bot webhook
    if (sdkBot) {
      try {
        await sdkBot.telegram.setWebhook(`${WEBHOOK_URL}/webhook/sdk`);
        await sdkBot.telegram.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: 'Open SDK App',
            web_app: { url: `${WEBHOOK_URL}/sdk` }
          }
        });
        sdkBotStatus = 'active';
        logger.info('SDK bot webhook configured');
      } catch (error) {
        logger.error('SDK bot webhook setup failed:', error);
        sdkBotStatus = 'error';
      }
    }
  } else {
    // Development mode - use polling
    if (mainBot) {
      mainBot.launch();
      mainBotStatus = 'active';
    }
    if (sdkBot) {
      sdkBot.launch();
      sdkBotStatus = 'active';
    }
    logger.info('Bots started in polling mode');
  }
});

// Graceful shutdown
process.once('SIGINT', () => {
  if (mainBot) mainBot.stop('SIGINT');
  if (sdkBot) sdkBot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  if (mainBot) mainBot.stop('SIGTERM');
  if (sdkBot) sdkBot.stop('SIGTERM');
});