import { v4 as uuidv4 } from 'uuid';

export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MS) || 3600000; // 1 hour
    this.setupCleanupInterval();
  }

  getOrCreateSession(sessionId) {
    if (!sessionId) {
      sessionId = uuidv4();
    }

    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      session.lastActivity = new Date();
      return session;
    }

    const newSession = {
      id: sessionId,
      messages: [],
      context: {
        mode: 'analyze',
        activeTools: [],
        permissions: {
          'notion.read': true,
          'notion.write': false,
          'supabase.read': true,
          'supabase.write': false
        },
        preferences: {}
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, newSession);
    return newSession;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  updateSession(sessionId, sessionData) {
    if (this.sessions.has(sessionId)) {
      sessionData.lastActivity = new Date();
      this.sessions.set(sessionId, sessionData);
      return true;
    }
    return false;
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  static getActiveSessionCount() {
    return this.sessions ? this.sessions.size : 0;
  }

  getActiveSessionCount() {
    return this.sessions.size;
  }

  setupCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastActivity.getTime() > this.sessionTimeout) {
          console.log(`Cleaning up inactive session: ${sessionId}`);
          this.deleteSession(sessionId);
        }
      }
    }, 60000); // Check every minute
  }

  addMessageToSession(sessionId, message) {
    const session = this.getSession(sessionId);
    if (session) {
      session.messages.push({
        ...message,
        timestamp: new Date()
      });
      
      // Keep only last 100 messages to prevent memory issues
      if (session.messages.length > 100) {
        session.messages = session.messages.slice(-100);
      }
      
      this.updateSession(sessionId, session);
      return true;
    }
    return false;
  }

  getSessionHistory(sessionId, limit = 10) {
    const session = this.getSession(sessionId);
    if (session) {
      return session.messages.slice(-limit);
    }
    return [];
  }

  updateSessionContext(sessionId, contextUpdates) {
    const session = this.getSession(sessionId);
    if (session) {
      session.context = {
        ...session.context,
        ...contextUpdates
      };
      this.updateSession(sessionId, session);
      return true;
    }
    return false;
  }

  clearSession(sessionId) {
    const session = this.getSession(sessionId);
    if (session) {
      session.messages = [];
      session.context.activeTools = [];
      this.updateSession(sessionId, session);
      return true;
    }
    return false;
  }

  exportSession(sessionId) {
    const session = this.getSession(sessionId);
    if (session) {
      return {
        id: session.id,
        messages: session.messages,
        context: session.context,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        exportedAt: new Date()
      };
    }
    return null;
  }

  importSession(sessionData) {
    if (sessionData && sessionData.id) {
      const session = {
        ...sessionData,
        lastActivity: new Date()
      };
      this.sessions.set(session.id, session);
      return session;
    }
    return null;
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  getSessionStats() {
    const sessions = this.getAllSessions();
    const now = Date.now();
    
    return {
      total: sessions.length,
      active: sessions.filter(s => now - s.lastActivity.getTime() < 300000).length, // Active in last 5 min
      idle: sessions.filter(s => now - s.lastActivity.getTime() >= 300000).length,
      avgMessages: sessions.reduce((sum, s) => sum + s.messages.length, 0) / (sessions.length || 1),
      modes: sessions.reduce((acc, s) => {
        acc[s.context.mode] = (acc[s.context.mode] || 0) + 1;
        return acc;
      }, {})
    };
  }
}