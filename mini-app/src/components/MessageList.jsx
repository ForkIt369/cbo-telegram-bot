import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, Card, Text } from '@telegram-apps/telegram-ui';
import './MessageList.css';

const MessageList = ({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <motion.div
          key={message.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`message ${message.role}`}
        >
          {message.role === 'assistant' && (
            <img src="/cbo-character.png" alt="CBO" className="message-avatar assistant-avatar" />
          )}
          
          <Card className="message-content">
            <Text>{message.content}</Text>
            {message.flow && (
              <div className="message-flow-tag">
                {message.flow}
              </div>
            )}
          </Card>
          
          {message.role === 'user' && (
            <div className="message-avatar user-avatar">
              <span>👤</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default MessageList;