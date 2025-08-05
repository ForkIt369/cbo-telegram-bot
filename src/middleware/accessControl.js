const whitelistService = require('../services/whitelistService');
const logger = require('../utils/logger');

// Telegram bot middleware
const checkWhitelist = (ctx, next) => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    return ctx.reply('❌ Unable to verify user identity.');
  }

  if (!whitelistService.isWhitelisted(userId)) {
    logger.warn(`Unauthorized access attempt from user ${userId} (@${ctx.from?.username || 'unknown'})`);
    return ctx.reply('🔒 Access Denied\n\nThis bot is restricted to authorized users only.\n\nContact the administrator to request access.');
  }

  // User is whitelisted, continue
  return next();
};

// Express middleware for Mini App API
const checkApiAccess = (req, res, next) => {
  const userId = parseInt(req.body?.userId || req.params?.userId || req.query?.userId);
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  if (!whitelistService.isWhitelisted(userId)) {
    logger.warn(`Unauthorized API access attempt from user ${userId}`);
    return res.status(403).json({ error: 'Access denied' });
  }

  // User is whitelisted, continue
  next();
};

// Admin-only middleware
const checkAdmin = (ctx, next) => {
  const userId = ctx.from?.id;
  
  if (!userId || !whitelistService.isAdmin(userId)) {
    return ctx.reply('⛔ This command requires admin privileges.');
  }

  return next();
};

module.exports = {
  checkWhitelist,
  checkApiAccess,
  checkAdmin
};