import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Input, 
  Button, 
  Spinner,
  Avatar,
  Text,
  Caption,
  Title,
  Subheadline
} from '@telegram-apps/telegram-ui';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import FlowIndicator from './FlowIndicator';
import useChat from '../hooks/useChat';
import './ChatInterface.css';

const ChatInterface = ({ userId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [authorized, setAuthorized] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    messages,
    isLoading,
    activeFlow,
    sendMessage,
    clearChat
  } = useChat(userId);

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        const data = await response.json();
        setAuthorized(data.authorized);
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthorized(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    if (userId) {
      checkAuth();
    } else {
      setCheckingAuth(false);
      setAuthorized(false);
    }
  }, [userId]);

  // Hide welcome screen when messages exist
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage;
    setInputMessage('');
    setShowWelcome(false);
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (message) => {
    setInputMessage(message);
    setShowWelcome(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="chat-interface auth-check">
        <div className="auth-loading">
          <Spinner size="l" />
          <Text>Verifying access...</Text>
        </div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!authorized) {
    return (
      <div className="chat-interface access-denied">
        <div className="denied-content">
          <div className="denied-icon">🔒</div>
          <Text weight="2">Access Restricted</Text>
          <Caption>This Mini App is for authorized users only.</Caption>
          <Caption>Your User ID: {userId || 'Not detected'}</Caption>
          <Caption>Please contact the administrator for access.</Caption>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <header className="chat-header">
        <Avatar 
          src="/cbo-avatar.svg" 
          size={40}
          alt="CBO-Bro"
          fallbackIcon={
            <div className="avatar-fallback">CBO</div>
          }
        />
        <div className="header-info">
          <div className="header-title">
            CBO-Bro Assistant
            <span className="status-badge">AI Powered</span>
          </div>
          <Caption>Business Optimization Expert</Caption>
        </div>
        <FlowIndicator activeFlow={activeFlow} />
      </header>

      <div className="chat-messages">
        <AnimatePresence>
          {showWelcome && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="welcome-message"
            >
              <div className="welcome-avatar">
                <img src="/cbo-avatar.png" alt="CBO-Bro" />
              </div>
              
              <h1 className="welcome-title">Chief Bro Officer</h1>
              <p className="welcome-subtitle">Your AI Business Optimization Expert</p>
              
              <div className="features-grid">
                <div className="feature-card">
                  <span className="feature-icon">💎</span>
                  <div className="feature-title">Value Flow</div>
                  <div className="feature-desc">Customer delivery</div>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">📊</span>
                  <div className="feature-title">Info Flow</div>
                  <div className="feature-desc">Data & decisions</div>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">⚡</span>
                  <div className="feature-title">Work Flow</div>
                  <div className="feature-desc">Operations</div>
                </div>
                <div className="feature-card">
                  <span className="feature-icon">💰</span>
                  <div className="feature-title">Cash Flow</div>
                  <div className="feature-desc">Financial health</div>
                </div>
              </div>
              
              <div className="quick-actions">
                <button
                  className="quick-action"
                  onClick={() => handleQuickAction("How can I improve customer retention?")}
                >
                  📈 Customer Retention
                </button>
                <button
                  className="quick-action"
                  onClick={() => handleQuickAction("My cash flow is tight, what should I do?")}
                >
                  💰 Cash Flow Help
                </button>
                <button
                  className="quick-action"
                  onClick={() => handleQuickAction("Need to optimize my operations")}
                >
                  ⚙️ Operations
                </button>
                <button
                  className="quick-action"
                  onClick={() => handleQuickAction("How do I scale my business?")}
                >
                  🚀 Scale Business
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showWelcome && <MessageList messages={messages} />}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-actions">
          <button 
            className="attach-btn coming-soon tooltip" 
            data-tooltip="File attachments coming soon!"
            disabled
          >
            📎
          </button>
          <button 
            className="voice-btn coming-soon tooltip" 
            data-tooltip="Voice input coming soon!"
            disabled
          >
            🎤
          </button>
        </div>
        
        <div className="message-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="message-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your business..."
            disabled={isLoading}
          />
        </div>
        
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputMessage.trim() || isLoading}
        >
          {isLoading ? '...' : '→'}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;