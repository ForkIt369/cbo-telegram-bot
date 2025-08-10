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
    server: 'combined-server',
    timestamp: new Date().toISOString(),
    bots: {
      main: mainBotStatus,
      sdk: sdkBotStatus
    },
    env: {
      hasMainToken: !!process.env.MAIN_BOT_TOKEN,
      hasSdkToken: !!process.env.SDK_BOT_TOKEN,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Main Bot Setup (CBO_DEVbot)
let mainBotStatus = 'initializing';
const { Telegraf } = require('telegraf');
const mainBot = new Telegraf(process.env.MAIN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);
const CBOAgentHandler = require('./handlers/cboAgentHandler');
const mainHandler = new CBOAgentHandler();

// Main bot handlers
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

// Set up main bot routes and webhook at /webhook/main
app.post('/webhook/main', async (req, res) => {
  try {
    await mainBot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    logger.error('Main webhook error:', error);
    res.sendStatus(200);
  }
});

// SDK Bot Setup (cbosdkbot) 
let sdkBotStatus = 'initializing';
let sdkBot = null;
const SDK_TOKEN = process.env.SDK_BOT_TOKEN;
if (SDK_TOKEN) {
  logger.info('Initializing SDK bot with token:', SDK_TOKEN.substring(0, 10) + '...');
  sdkBot = new Telegraf(SDK_TOKEN);
  
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
  app.post('/webhook/sdk', async (req, res) => {
    try {
      await sdkBot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      logger.error('SDK webhook error:', error);
      res.sendStatus(200);
    }
  });
  
  sdkBotStatus = 'ready';
} else {
  logger.info('SDK_BOT_TOKEN not configured, skipping SDK bot');
  sdkBotStatus = 'disabled';
}

// API endpoints for Mini App
const whitelistService = require('./services/whitelistService');

// Check access endpoint for Mini App
app.post('/api/auth/check', async (req, res) => {
  try {
    const { userId } = req.body;
    const isWhitelisted = whitelistService.isWhitelisted(parseInt(userId));
    res.json({ 
      authorized: isWhitelisted,
      isAdmin: whitelistService.isAdmin(parseInt(userId))
    });
  } catch (error) {
    logger.error('Error checking access:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
});

// Chat endpoint for Mini App (keeping for backwards compatibility)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    const response = await mainHandler.processMessage(userId || 'mini-app-user', message);
    res.json({ response });
  } catch (error) {
    logger.error('API error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Get chat history
app.get('/api/chat/history/:userId', async (req, res) => {
  try {
    const messages = mainHandler.getOrCreateContext(req.params.userId).messages;
    res.json({ messages: messages.slice(-20) });
  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Send message (main endpoint used by mini app)
app.post('/api/chat/message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const response = await mainHandler.processMessage(userId, message);
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
    await mainHandler.clearContext(userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error clearing chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

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
    mainBot.launch();
    mainBotStatus = 'active';
    if (sdkBot) {
      sdkBot.launch();
      sdkBotStatus = 'active';
    }
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