if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');
const CBOAgentHandler = require('./handlers/cboAgentHandler');
const { checkWhitelist, checkApiAccess, checkAdmin } = require('./middleware/accessControl');
const whitelistService = require('./services/whitelistService');
const configService = require('./services/configService');

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  logger.error('TELEGRAM_BOT_TOKEN is not set!');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const cboHandler = new CBOAgentHandler();

// Public commands (no whitelist check)
bot.start((ctx) => {
  const userId = ctx.from?.id;
  
  if (!whitelistService.isWhitelisted(userId)) {
    return ctx.reply('🔒 Access Restricted\n\nThis bot is for authorized users only.\n\nYour user ID: ' + userId + '\n\nPlease contact the administrator to request access.');
  }
  
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

// Apply whitelist middleware to protected commands
bot.help(checkWhitelist, (ctx) => {
  const userId = ctx.from.id;
  const isAdmin = whitelistService.isAdmin(userId);
  
  let helpText = `Commands:
/start - Welcome message
/help - This help menu
/status - Bot status
/clear - Reset conversation`;

  if (isAdmin) {
    helpText += `

Admin Commands:
/whitelist - Show whitelisted users
/adduser <user_id> [notes] - Add user to whitelist
/removeuser <user_id> - Remove user from whitelist`;
  }

  helpText += `

Example questions:
• "How do I scale my SaaS business?"
• "Customer churn is increasing"
• "Need to optimize operations"
• "Revenue is flat, help!"

I'll analyze through Value, Info, Work & Cash flows.`;

  ctx.reply(helpText);
});

bot.command('status', checkWhitelist, (ctx) => {
  ctx.reply(`Bot Status: ✅ Online
Agent: CBO-Bro
Version: 1.0.0
Uptime: ${process.uptime()}s`);
});

bot.command('clear', checkWhitelist, async (ctx) => {
  await cboHandler.clearContext(ctx.from.id);
  ctx.reply('Conversation context cleared. Fresh start! 🔄');
});

// Admin commands
bot.command('whitelist', checkAdmin, async (ctx) => {
  const users = whitelistService.getWhitelistedUsers();
  const admins = whitelistService.getAdmins();
  
  let message = '👥 Whitelisted Users:\n\n';
  users.forEach(user => {
    const isAdmin = admins.includes(user.id);
    message += `${isAdmin ? '👑' : '👤'} ${user.first_name} (@${user.username})\n`;
    message += `   ID: ${user.id}\n`;
    message += `   Added: ${user.added_date}\n\n`;
  });
  
  ctx.reply(message);
});

bot.command('adduser', checkAdmin, async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    return ctx.reply('Usage: /adduser <user_id> [notes]\n\nExample: /adduser 123456789 New team member');
  }
  
  const userId = parseInt(args[0]);
  const notes = args.slice(1).join(' ');
  
  if (isNaN(userId)) {
    return ctx.reply('Invalid user ID. Must be a number.');
  }
  
  const result = await whitelistService.addUser({
    id: userId,
    notes: notes
  });
  
  ctx.reply(result.success ? '✅ ' + result.message : '❌ ' + result.message);
});

bot.command('removeuser', checkAdmin, async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    return ctx.reply('Usage: /removeuser <user_id>');
  }
  
  const userId = parseInt(args[0]);
  if (isNaN(userId)) {
    return ctx.reply('Invalid user ID. Must be a number.');
  }
  
  const result = await whitelistService.removeUser(userId);
  ctx.reply(result.success ? '✅ ' + result.message : '❌ ' + result.message);
});

// MCP commands moved to experimental - uncomment if you need them
// bot.command('tools', checkWhitelist, async (ctx) => {
//   try {
//     if (process.env.ENABLE_MCP_TOOLS !== 'true') {
//       return ctx.reply('🔧 MCP tools are not enabled.\n\nTo enable tools, set ENABLE_MCP_TOOLS=true in environment variables.');
//     }
//     
//     const mcpManager = require('./services/mcpManager');
//     await mcpManager.initialize();
//     
//     const tools = mcpManager.listTools();
//     
//     if (tools.length === 0) {
//       return ctx.reply('🔧 No MCP tools available.\n\nMCP servers may not be connected.');
//     }
//     
//     let message = '🔧 Available MCP Tools:\n\n';
//     for (const tool of tools) {
//       message += `• ${tool.name} (${tool.server})\n  ${tool.description}\n\n`;
//     }
//     
//     ctx.reply(message);
//   } catch (error) {
//     logger.error('Error listing tools:', error);
//     ctx.reply('❌ Failed to list available tools.');
//   }
// });

// bot.command('mcphealth', checkAdmin, async (ctx) => {
//   try {
//     const mcpManager = require('./services/mcpManager');
//     await mcpManager.initialize();
//     
//     const health = await mcpManager.checkHealth();
//     
//     let message = '🏥 MCP Server Health:\n\n';
//     
//     for (const [server, status] of Object.entries(health)) {
//       const emoji = status.status === 'healthy' ? '✅' : '❌';
//       message += `${emoji} ${server}\n`;
//       message += `  Status: ${status.status}\n`;
//       message += `  Connected: ${status.connected ? 'Yes' : 'No'}\n`;
//       message += `  Tools: ${status.toolCount || 0}\n`;
//       
//       if (status.error) {
//         message += `  Error: ${status.error}\n`;
//       }
//       
//       if (status.registry) {
//         message += `  Registry: ${status.registry.healthy ? 'Healthy' : 'Unhealthy'}\n`;
//       }
//       
//       message += '\n';
//     }
//     
//     ctx.reply(message);
//   } catch (error) {
//     logger.error('Error checking MCP health:', error);
//     ctx.reply('❌ Failed to check MCP server health.');
//   }
// });

bot.on('text', checkWhitelist, async (ctx) => {
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

const PORT = process.env.PORT || 3001;

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
app.get('/api/chat/history/:userId', checkApiAccess, async (req, res) => {
  try {
    const messages = cboHandler.getOrCreateContext(req.params.userId).messages;
    res.json({ messages: messages.slice(-20) });
  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Send message
app.post('/api/chat/message', checkApiAccess, async (req, res) => {
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
app.post('/api/chat/clear', checkApiAccess, async (req, res) => {
  try {
    const { userId } = req.body;
    await cboHandler.clearContext(userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error clearing chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

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

// Admin Panel Routes

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'cbo-admin-secret-key-2025';
    const decoded = jwt.verify(token, secret);
    
    // Verify admin status
    if (!whitelistService.isAdmin(decoded.userId)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    logger.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify Telegram auth data
function verifyTelegramAuth(authData) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = crypto.createHash('sha256').update(token).digest();
  
  const checkString = Object.keys(authData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n');
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(checkString)
    .digest('hex');
  
  return hash === authData.hash;
}

// Telegram authentication endpoint
app.post('/api/admin/auth', async (req, res) => {
  const { id, first_name, username, hash, auth_date } = req.body;
  
  // For development, skip hash verification
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Verify Telegram hash in production
  if (!isDev && !verifyTelegramAuth(req.body)) {
    return res.status(401).json({ error: 'Invalid authentication' });
  }
  
  // Check admin status
  if (!whitelistService.isAdmin(id)) {
    logger.warn(`Non-admin user ${id} (${username}) attempted admin access`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // Generate JWT token
  const secret = process.env.JWT_SECRET || 'cbo-admin-secret-key-2025';
  const token = jwt.sign(
    { userId: id, username, first_name },
    secret,
    { expiresIn: '24h' }
  );
  
  logger.info(`Admin ${username} (${id}) logged in`);
  
  res.json({ 
    token, 
    user: { id, username, first_name } 
  });
});

// Get configuration
app.get('/api/admin/config', adminAuth, async (req, res) => {
  try {
    const config = await configService.getActiveConfig();
    res.json(config);
  } catch (error) {
    logger.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Save configuration
app.post('/api/admin/config', adminAuth, async (req, res) => {
  try {
    const config = req.body;
    await configService.saveConfig(config);
    
    // Reload agent with new config
    await cboHandler.reloadConfig(config);
    
    logger.info(`Configuration updated by ${req.admin.username}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Get prompt
app.get('/api/admin/prompt', adminAuth, async (req, res) => {
  try {
    const config = await configService.getActiveConfig();
    res.json({ prompt: config.system_prompt });
  } catch (error) {
    logger.error('Error getting prompt:', error);
    res.status(500).json({ error: 'Failed to get prompt' });
  }
});

// Save prompt
app.post('/api/admin/prompt', adminAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    await configService.updatePrompt(prompt);
    
    logger.info(`Prompt updated by ${req.admin.username}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving prompt:', error);
    res.status(500).json({ error: 'Failed to save prompt' });
  }
});

// Test configuration
app.post('/api/admin/test', adminAuth, async (req, res) => {
  try {
    const { message, config } = req.body;
    const startTime = Date.now();
    
    // Use test config temporarily
    const response = await cboHandler.processWithConfig(message, config);
    
    const responseTime = Date.now() - startTime;
    const tokens = Math.ceil(response.length / 4); // Rough estimate
    
    // Detect flow
    const flow = detectFlow(message);
    
    res.json({
      response,
      tokens,
      responseTime,
      flow
    });
  } catch (error) {
    logger.error('Error testing config:', error);
    res.status(500).json({ error: 'Test failed: ' + error.message });
  }
});

// Helper function to detect flow
function detectFlow(message) {
  const text = message.toLowerCase();
  
  const flowKeywords = {
    'Value Flow': ['customer', 'user', 'satisfaction', 'experience', 'retention'],
    'Info Flow': ['data', 'analytics', 'metrics', 'insights', 'report'],
    'Work Flow': ['process', 'operation', 'efficiency', 'productivity', 'workflow'],
    'Cash Flow': ['revenue', 'cost', 'profit', 'financial', 'cash', 'money']
  };
  
  let bestMatch = 'General';
  let maxScore = 0;
  
  for (const [flow, keywords] of Object.entries(flowKeywords)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      bestMatch = flow;
    }
  }
  
  return bestMatch;
}

// Deployment status
app.get('/api/admin/deploy/status', adminAuth, async (req, res) => {
  try {
    const status = await configService.getDeploymentStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting deployment status:', error);
    res.status(500).json({ error: 'Failed to get deployment status' });
  }
});

// Deploy configuration
app.post('/api/admin/deploy', adminAuth, async (req, res) => {
  try {
    const { environment } = req.body;
    
    // In production, this would trigger actual deployment
    // For now, just update the active config
    await configService.deploy(environment, req.admin.username);
    
    logger.info(`Deployment to ${environment} by ${req.admin.username}`);
    res.json({ 
      success: true, 
      message: 'Deployment initiated',
      environment,
      version: 'v2.1.0'
    });
  } catch (error) {
    logger.error('Error deploying:', error);
    res.status(500).json({ error: 'Deployment failed' });
  }
});

// Deployment history
app.get('/api/admin/deploy/history', adminAuth, async (req, res) => {
  try {
    const history = await configService.getDeploymentHistory();
    res.json(history);
  } catch (error) {
    logger.error('Error getting deployment history:', error);
    res.status(500).json({ error: 'Failed to get deployment history' });
  }
});

// Analytics stats
app.get('/api/admin/analytics/stats', adminAuth, async (req, res) => {
  try {
    const { range } = req.query;
    // In production, this would query actual analytics
    // For now, return mock data
    res.json({
      total_queries: 1247,
      active_users: 42,
      avg_response_time: 850,
      success_rate: 98.5
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Flow distribution
app.get('/api/admin/analytics/flows', adminAuth, async (req, res) => {
  try {
    const { range } = req.query;
    // Mock data for now
    res.json({
      value: 312,
      info: 374,
      work: 249,
      cash: 312
    });
  } catch (error) {
    logger.error('Error getting flow distribution:', error);
    res.status(500).json({ error: 'Failed to get flow distribution' });
  }
});

// Serve Admin Panel
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Redirect to login page
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/login-direct.html'));
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
      
      // Set Mini App in bot menu
      await bot.telegram.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: 'Open CBO-Bro',
          web_app: {
            url: process.env.WEBHOOK_URL
          }
        }
      });
      logger.info('Mini App menu button set successfully');
    } catch (error) {
      logger.error('Failed to set webhook or menu button:', error);
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