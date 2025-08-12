import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedMessageList from './EnhancedMessageList';
import EnhancedChatInput from './EnhancedChatInput';
import FlowIndicator from './FlowIndicator';
import './EnhancedChatInterface.css';

// WebSocket hook for real-time updates
const useWebSocket = (userId, onMessage) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const connect = useCallback(() => {
    if (!userId) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?userId=${userId}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        clearTimeout(reconnectTimeoutRef.current);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [userId, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { connectionStatus, sendMessage };
};

// Enhanced Chat Interface Component
const EnhancedChatInterface = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);
  const [userTyping, setUserTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('online');
  
  const messagesEndRef = useRef(null);

  // Flow detection logic
  const detectFlow = (text) => {
    const flowPatterns = {
      'Value Flow': /customer|user|satisfaction|experience|retention|delivery|value/i,
      'Info Flow': /data|analytics|metrics|insights|report|information|decision/i,
      'Work Flow': /process|operation|efficiency|productivity|workflow|optimize|performance/i,
      'Cash Flow': /revenue|cost|profit|financial|cash|money|budget|investment/i
    };

    for (const [flow, pattern] of Object.entries(flowPatterns)) {
      if (pattern.test(text)) {
        return flow;
      }
    }
    return null;
  };

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'message') {
      const newMessage = {
        id: `ws-${Date.now()}`,
        ...data.message,
        timestamp: data.message.timestamp || new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);
      setAiTyping(false);
    } else if (data.type === 'typing') {
      setAiTyping(data.isTyping);
    } else if (data.type === 'flow_update') {
      setActiveFlow(data.flow);
    }
  }, []);

  // Initialize WebSocket connection
  const { connectionStatus: wsStatus, sendMessage: wsSendMessage } = useWebSocket(userId, handleWebSocketMessage);

  useEffect(() => {
    setConnectionStatus(wsStatus === 'connected' ? 'online' : 'offline');
  }, [wsStatus]);

  // Load initial messages
  useEffect(() => {
    if (userId) {
      loadChatHistory();
    }
  }, [userId]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history/${userId}`);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString(),
          flow: detectFlow(msg.content)
        })));
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Handle sending messages
  const handleSendMessage = async (payload) => {
    const { message, files } = payload;
    
    if (!message && files.length === 0) return;

    // Hide welcome screen
    setShowWelcome(false);

    // Add user message to UI immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      files: files,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setAiTyping(true);

    // Detect flow from user message
    const detectedFlow = detectFlow(message);
    if (detectedFlow) {
      setActiveFlow(detectedFlow);
      setTimeout(() => setActiveFlow(null), 5000);
    }

    try {
      // Send via WebSocket if connected, otherwise use HTTP
      if (wsStatus === 'connected') {
        wsSendMessage({
          type: 'message',
          userId,
          message,
          files
        });
      } else {
        // Fallback to HTTP
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            message,
            files
          })
        });

        const data = await response.json();
        
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          flow: detectFlow(data.response),
          citations: data.citations || [],
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setAiTyping(false);
    }
  };

  // Handle user typing indicator
  const handleUserTyping = (isTyping) => {
    setUserTyping(isTyping);
    if (wsStatus === 'connected') {
      wsSendMessage({
        type: 'typing',
        userId,
        isTyping
      });
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="enhanced-chat-interface">
      {/* Header */}
      <header className="chat-header glass-surface">
        <div className="header-left">
          <div className="agent-avatar">
            <span className="avatar-emoji">🟢</span>
            <span className={`status-indicator ${connectionStatus}`} />
          </div>
          <div className="header-info">
            <h1 className="header-title">CBO-Bro</h1>
            <div className="header-subtitle">
              Business Optimization Expert
              {connectionStatus === 'offline' && (
                <span className="offline-badge">Offline Mode</span>
              )}
            </div>
          </div>
        </div>
        
        <FlowIndicator activeFlow={activeFlow} />
        
        <div className="header-actions">
          <button
            className="action-icon-btn"
            onClick={() => {
              setMessages([]);
              setShowWelcome(true);
            }}
            aria-label="Clear chat"
          >
            🗑️
          </button>
          <button
            className="action-icon-btn"
            onClick={() => window.Telegram?.WebApp?.close()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="chat-content">
        <AnimatePresence mode="wait">
          {showWelcome && messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="welcome-screen"
            >
              <div className="welcome-content">
                <div className="cbo-logo-container">
                  <div className="cbo-cube">
                    <div className="cube-face front">CBO</div>
                    <div className="cube-face back">BRO</div>
                    <div className="cube-face left">💎</div>
                    <div className="cube-face right">💰</div>
                    <div className="cube-face top">⚡</div>
                    <div className="cube-face bottom">📊</div>
                  </div>
                </div>
                
                <h1 className="welcome-title">Welcome to CBO-Bro</h1>
                <p className="welcome-subtitle">
                  Your AI-powered business optimization expert using the BroVerse Biz Mental Model™
                </p>
                
                <div className="four-flows-grid">
                  <motion.div
                    className="flow-card glass-surface"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flow-icon">💎</span>
                    <h3>Value Flow</h3>
                    <p>Customer delivery & satisfaction</p>
                  </motion.div>
                  
                  <motion.div
                    className="flow-card glass-surface"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flow-icon">📊</span>
                    <h3>Info Flow</h3>
                    <p>Data-driven decisions</p>
                  </motion.div>
                  
                  <motion.div
                    className="flow-card glass-surface"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flow-icon">⚡</span>
                    <h3>Work Flow</h3>
                    <p>Operational efficiency</p>
                  </motion.div>
                  
                  <motion.div
                    className="flow-card glass-surface"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flow-icon">💰</span>
                    <h3>Cash Flow</h3>
                    <p>Financial optimization</p>
                  </motion.div>
                </div>
                
                <div className="welcome-cta">
                  <p>Ask me anything about your business challenges!</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="messages-wrapper"
            >
              <EnhancedMessageList 
                messages={messages} 
                isStreaming={aiTyping}
              />
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="chat-input-wrapper">
        <EnhancedChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder={showWelcome ? "Start with 'How can I improve customer retention?'" : "Ask CBO-Bro anything..."}
          onTyping={handleUserTyping}
        />
      </div>
    </div>
  );
};

export default EnhancedChatInterface;