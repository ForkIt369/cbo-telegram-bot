import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Input, 
  Button, 
  Spinner,
  Avatar,
  Text,
  Caption
} from '@telegram-apps/telegram-ui';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import FlowIndicator from './FlowIndicator';
import useChat from '../hooks/useChat';
import './ChatInterface.css';

const ChatInterface = ({ userId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const {
    messages,
    isLoading,
    activeFlow,
    sendMessage,
    clearChat
  } = useChat(userId);

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
    await sendMessage(message);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface">
      <header className="chat-header">
        <Avatar 
          src="/cbo-avatar.svg" 
          size={40}
          alt="CBO-Bro - Business Optimization Expert"
          fallbackIcon={
            <div className="avatar-fallback">💼</div>
          }
        />
        <div className="header-info">
          <Text weight="2">CBO-Bro Assistant</Text>
          <Caption>Business Optimization Expert</Caption>
        </div>
        <FlowIndicator activeFlow={activeFlow} />
      </header>

      <div className="chat-messages">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="welcome-message"
            >
              <div className="welcome-avatar">
                <Avatar 
                  size={80}
                  src="/cbo-avatar.svg"
                  fallbackIcon={
                    <span style={{ fontSize: '40px' }}>💼</span>
                  }
                />
              </div>
              <Text weight="2">Welcome to CBO-Bro!</Text>
              <Caption>
                I analyze businesses through 4 key flows:
                Value, Info, Work & Cash
              </Caption>
              <div className="quick-actions">
                <Button
                  size="s"
                  mode="outline"
                  onClick={() => setInputMessage("How can I improve customer retention?")}
                >
                  Customer Retention
                </Button>
                <Button
                  size="s"
                  mode="outline"
                  onClick={() => setInputMessage("My cash flow is tight")}
                >
                  Cash Flow Help
                </Button>
                <Button
                  size="s"
                  mode="outline"
                  onClick={() => setInputMessage("Need to optimize operations")}
                >
                  Operations
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <MessageList messages={messages} />
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <Input
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your business..."
          disabled={isLoading}
          after={
            <Button
              size="s"
              mode="plain"
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? <Spinner size="s" /> : '→'}
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default ChatInterface;