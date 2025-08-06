import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import winston from 'winston';
import { ClaudeService } from './services/claude.js';
import { WebSocketHandler } from './websocket/handler.js';
import { SessionManager } from './websocket/sessions.js';

dotenv.config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;
const WS_PORT = process.env.WS_PORT || 8081;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/status', (req, res) => {
  const sessionCount = SessionManager.getActiveSessionCount();
  res.json({
    status: 'operational',
    sessions: sessionCount,
    uptime: process.uptime()
  });
});

const wss = new WebSocketServer({ port: WS_PORT });

const claudeService = new ClaudeService(process.env.ANTHROPIC_API_KEY);
const sessionManager = new SessionManager();
const wsHandler = new WebSocketHandler(claudeService, sessionManager, logger);

wss.on('connection', (ws, req) => {
  logger.info('New WebSocket connection', {
    ip: req.socket.remoteAddress,
    headers: req.headers
  });
  
  wsHandler.handleConnection(ws, req);
});

wss.on('error', (error) => {
  logger.error('WebSocket server error:', error);
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`WebSocket server running on port ${WS_PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing servers...');
  wss.close(() => {
    logger.info('WebSocket server closed');
  });
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

export { app, wss, logger };