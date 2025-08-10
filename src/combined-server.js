/**
 * Combined Server for Both Telegram Bots
 * Runs main CBO bot and SDK bot on the same instance
 */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check for both bots
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    bots: {
      main: mainBotStatus,
      sdk: sdkBotStatus
    }
  });
});

// Main Bot Setup (CBO_DEVbot)
let mainBotStatus = 'initializing';
const { Telegraf } = require('telegraf');
const mainBot = new Telegraf(process.env.MAIN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);
const CBOAgentHandler = require('./handlers/cboAgentHandler');
const mainHandler = new CBOAgentHandler();

// Set up main bot routes and webhook at /webhook/main
app.use('/webhook/main', (req, res, next) => {
  logger.info('Main bot webhook received');
  next();
}, mainBot.webhookCallback('/webhook/main'));

// SDK Bot Setup (cbosdkbot) 
let sdkBotStatus = 'initializing';
if (process.env.SDK_BOT_TOKEN) {
  const sdkBot = new Telegraf(process.env.SDK_BOT_TOKEN);
  
  // SDK Bot handlers
  sdkBot.start((ctx) => {
    ctx.reply(`🚀 Welcome to ClaudeBRO SDK!
    
I'm your advanced business optimization assistant with the BroVerse framework.

Click the menu button below to open the SDK Mini App!`);
  });
  
  sdkBot.on('text', async (ctx) => {
    try {
      await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
      // Use the same handler or create SDK-specific handler
      const response = await mainHandler.processMessage(ctx.from.id, ctx.message.text);
      await ctx.reply(response);
    } catch (error) {
      logger.error('SDK bot error:', error);
      await ctx.reply('Sorry, I encountered an error. Please try again.');
    }
  });
  
  // SDK webhook at /webhook/sdk
  app.use('/webhook/sdk', (req, res, next) => {
    logger.info('SDK bot webhook received');
    next();
  }, sdkBot.webhookCallback('/webhook/sdk'));
  
  sdkBotStatus = 'ready';
} else {
  logger.info('SDK_BOT_TOKEN not configured, skipping SDK bot');
  sdkBotStatus = 'disabled';
}

// Serve Main Bot Mini App at root
const miniAppPath = path.join(__dirname, '../mini-app/dist');
if (require('fs').existsSync(miniAppPath)) {
  app.use('/', express.static(miniAppPath));
}

// Serve SDK Bot Mini App at /sdk
const sdkAppPath = path.join(__dirname, '../ClaudeBROSDK/src');
if (require('fs').existsSync(sdkAppPath)) {
  app.use('/sdk', express.static(sdkAppPath));
  
  // SDK API endpoints
  app.post('/sdk/api/chat', async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      // Process with SDK-specific logic if needed
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
  logger.info(`Combined server running on port ${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    const WEBHOOK_URL = process.env.WEBHOOK_URL;
    
    // Set up main bot webhook
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
    
    // Set up SDK bot webhook if configured
    if (process.env.SDK_BOT_TOKEN) {
      try {
        const sdkBot = new Telegraf(process.env.SDK_BOT_TOKEN);
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
    mainBot.launch();
    mainBotStatus = 'active';
    logger.info('Bots started in polling mode');
  }
});

// Graceful shutdown
process.once('SIGINT', () => {
  mainBot.stop('SIGINT');
  if (sdkBot) sdkBot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  mainBot.stop('SIGTERM');
  if (sdkBot) sdkBot.stop('SIGTERM');
});