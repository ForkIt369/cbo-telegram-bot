import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Card, Text } from '@telegram-apps/telegram-ui';
import './MessageList.css';

const MessageFormatter = ({ content }) => {
  const formatMessage = (text) => {
    if (!text) return '';
    
    // Convert markdown-like formatting to HTML
    let formatted = text
      // Code blocks with syntax highlighting
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre class="code-block" data-lang="${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`;
      })
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      // Bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic text (ensure it doesn't conflict with bold)
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      // Underline
      .replace(/__([^_]+)__/g, '<u>$1</u>')
      // Strikethrough
      .replace(/~~([^~]+)~~/g, '<del>$1</del>')
      // Block quotes
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
    
    // Wrap in paragraph if not already wrapped
    if (!formatted.startsWith('<')) {
      formatted = `<p>${formatted}</p>`;
    }
    
    return formatted;
  };
  
  const escapeHtml = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  };
  
  return (
    <div 
      className="formatted-message"
      dangerouslySetInnerHTML={{ __html: formatMessage(content) }}
    />
  );
};

const ProgressiveMessage = ({ content, isNew = false }) => {
  const [displayedContent, setDisplayedContent] = useState(isNew ? '' : content);
  const [isTyping, setIsTyping] = useState(isNew);
  const wordsRef = useRef([]);
  const currentIndexRef = useRef(0);
  
  useEffect(() => {
    if (!isNew) {
      setDisplayedContent(content);
      return;
    }
    
    // Split content into words for progressive display
    wordsRef.current = content.split(' ');
    currentIndexRef.current = 0;
    setDisplayedContent('');
    setIsTyping(true);
    
    const typeNextWord = () => {
      if (currentIndexRef.current < wordsRef.current.length) {
        const newWords = wordsRef.current.slice(0, currentIndexRef.current + 1).join(' ');
        setDisplayedContent(newWords);
        currentIndexRef.current++;
        
        // Variable typing speed based on word position
        const delay = currentIndexRef.current > 6 ? 50 : 30;
        setTimeout(typeNextWord, delay);
      } else {
        setIsTyping(false);
      }
    };
    
    // Add initial cognitive pause for complex responses
    const initialDelay = content.length > 100 ? 800 : 400;
    const timer = setTimeout(typeNextWord, initialDelay);
    
    return () => clearTimeout(timer);
  }, [content, isNew]);
  
  return (
    <>
      <MessageFormatter content={displayedContent} />
      {isTyping && <span className="typing-cursor">▊</span>}
    </>
  );
};

const MessageTimestamp = ({ timestamp }) => {
  const formatTime = (date) => {
    const options = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    };
    return new Date(date).toLocaleTimeString('en-US', options);
  };
  
  return (
    <time className="message-timestamp" dateTime={timestamp}>
      {formatTime(timestamp)}
    </time>
  );
};

const MessageChunk = ({ chunk, isLast, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!isVisible) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="message-chunk"
    >
      <MessageFormatter content={chunk} />
      {isLast && <div className="chunk-separator" />}
    </motion.div>
  );
};

const MessageBubble = ({ message, index, isNew }) => {
  const [chunks, setChunks] = useState([]);
  const isLongMessage = message.content.length > 280;
  
  useEffect(() => {
    if (isLongMessage && message.role === 'assistant') {
      // Break long messages into chunks
      const chunkSize = 280;
      const sentences = message.content.match(/[^.!?]+[.!?]+/g) || [message.content];
      const messageChunks = [];
      let currentChunk = '';
      
      sentences.forEach(sentence => {
        if ((currentChunk + sentence).length > chunkSize && currentChunk) {
          messageChunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      });
      
      if (currentChunk) {
        messageChunks.push(currentChunk.trim());
      }
      
      setChunks(messageChunks);
    } else {
      setChunks([message.content]);
    }
  }, [message.content, isLongMessage, message.role]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`message ${message.role}`}
      role="article"
      aria-label={`Message from ${message.role === 'user' ? 'you' : 'CBO-Bro'}`}
    >
      {message.role === 'assistant' && (
        <img 
          src="/cbo-character.png" 
          alt="CBO" 
          className="message-avatar assistant-avatar"
          loading="lazy"
        />
      )}
      
      <div className="message-bubble-container">
        <Card className="message-content">
          {isLongMessage && message.role === 'assistant' ? (
            chunks.map((chunk, i) => (
              <MessageChunk
                key={i}
                chunk={chunk}
                isLast={i === chunks.length - 1}
                delay={i * 1000}
              />
            ))
          ) : (
            <ProgressiveMessage 
              content={message.content} 
              isNew={isNew && message.role === 'assistant'}
            />
          )}
          
          {message.flow && (
            <motion.div 
              className={`message-flow-tag ${message.flow.toLowerCase().replace(' ', '-')}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {message.flow}
            </motion.div>
          )}
        </Card>
        
        <MessageTimestamp timestamp={message.timestamp || new Date().toISOString()} />
      </div>
      
      {message.role === 'user' && (
        <div className="message-avatar user-avatar" aria-hidden="true">
          <span>👤</span>
        </div>
      )}
    </motion.div>
  );
};

const MessageList = ({ messages }) => {
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const previousMessagesRef = useRef([]);
  
  useEffect(() => {
    // Track new messages for animation
    const previousIds = new Set(previousMessagesRef.current.map(m => m.id));
    const newIds = new Set();
    
    messages.forEach(message => {
      if (!previousIds.has(message.id)) {
        newIds.add(message.id);
      }
    });
    
    setNewMessageIds(newIds);
    previousMessagesRef.current = [...messages];
    
    // Clear new message IDs after animation
    const timer = setTimeout(() => {
      setNewMessageIds(new Set());
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [messages]);
  
  return (
    <div className="message-list" role="log" aria-live="polite" aria-label="Chat messages">
      <AnimatePresence>
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || index}
            message={message}
            index={index}
            isNew={newMessageIds.has(message.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;