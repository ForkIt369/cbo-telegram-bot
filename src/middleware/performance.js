const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Production middleware configuration
const setupProductionMiddleware = (app) => {
  // Enable compression for all responses
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level
    threshold: 1024 // Only compress responses > 1kb
  }));

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://telegram.org"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "wss:", "ws:", "https:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://telegram.org"],
      },
    },
    crossOriginEmbedderPolicy: false // Allow Telegram embedding
  }));

  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 60
      });
    }
  });

  // WebSocket rate limiter
  const wsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit WebSocket connections
    message: 'Too many WebSocket connections',
    skipSuccessfulRequests: true
  });

  // Chat message rate limiter (more restrictive)
  const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 messages per minute max
    message: 'Please slow down. You can send up to 20 messages per minute.',
    keyGenerator: (req) => {
      return req.body?.userId || req.ip;
    }
  });

  // Apply rate limiting to specific routes
  app.use('/api/', apiLimiter);
  app.use('/ws', wsLimiter);
  app.use('/api/chat/message', chatLimiter);

  // Cache control for static assets
  app.use((req, res, next) => {
    // Static assets get long cache
    if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // HTML files should not be cached
    else if (req.url.match(/\.html$/) || req.url === '/') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // API responses get short cache
    else if (req.url.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'private, max-age=60');
    }
    next();
  });

  // Request timeout middleware
  app.use((req, res, next) => {
    // Set timeout for all requests (30 seconds)
    req.setTimeout(30000, () => {
      res.status(408).json({ error: 'Request timeout' });
    });
    
    res.setTimeout(30000, () => {
      res.status(503).json({ error: 'Response timeout' });
    });
    
    next();
  });

  // Response time header
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${duration}ms`);
    });
    
    next();
  });

  // Health check endpoint with no rate limiting
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });

  // Metrics endpoint for monitoring
  app.get('/metrics', (req, res) => {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      connections: {
        active: global.activeConnections || 0,
        total: global.totalConnections || 0
      },
      requests: {
        total: global.totalRequests || 0,
        errors: global.errorRequests || 0
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(metrics);
  });

  // Graceful shutdown handler
  const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing connections...');
    
    // Close server to stop accepting new connections
    if (global.server) {
      global.server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return {
    apiLimiter,
    wsLimiter,
    chatLimiter
  };
};

module.exports = setupProductionMiddleware;