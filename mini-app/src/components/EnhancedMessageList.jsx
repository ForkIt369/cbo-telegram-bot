import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './EnhancedMessageList.css';

// Message chunking utility
const chunkMessage = (text, maxLength = 280) => {
  if (text.length <= maxLength) return [text];
  
  const chunks = [];
  let currentChunk = '';
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};

// Streaming text component
const StreamingText = memo(({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef();

  useEffect(() => {
    if (currentIndex < text.length) {
      intervalRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
    } else if (onComplete) {
      onComplete();
    }

    return () => clearTimeout(intervalRef.current);
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className="streaming-text">
      {displayedText}
      {currentIndex < text.length && <span className="cursor-blink">|</span>}
    </span>
  );
});

// Citation component
const Citation = ({ citation, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="citation-container">
      <button 
        className="citation-marker"
        onClick={() => setExpanded(!expanded)}
        aria-label={`Citation ${index + 1}`}
      >
        [{index + 1}]
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="citation-content glass-surface-light"
          >
            <div className="citation-source">{citation.source}</div>
            <div className="citation-meta">
              <span className="citation-confidence">
                Confidence: {citation.confidence}%
              </span>
              <span className="citation-freshness">
                Updated: {citation.updated}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual message component with virtual rendering support
const Message = memo(({ message, isStreaming = false, agentColor = 'cbo' }) => {
  const [chunks, setChunks] = useState([]);
  const [streamComplete, setStreamComplete] = useState(!isStreaming);

  useEffect(() => {
    if (message.content) {
      setChunks(chunkMessage(message.content));
    }
  }, [message.content]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAgentAvatar = (role) => {
    if (role === 'user') return '👤';
    switch(agentColor) {
      case 'bigsis': return '🔵';
      case 'bro': return '🟠';
      case 'lilsis': return '🟣';
      default: return '🟢';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.233 }}
      className={`message-container ${message.role}`}
    >
      {message.role === 'assistant' && (
        <div className="message-avatar">
          <span className="avatar-emoji">{getAgentAvatar(message.role)}</span>
        </div>
      )}
      
      <div className={`message-bubble glass-surface glow-${agentColor}`}>
        {message.role === 'assistant' && (
          <div className="message-header">
            <span className={`agent-badge badge-${agentColor}`}>
              CBO
            </span>
            {message.flow && (
              <span className="flow-indicator">
                {message.flow}
              </span>
            )}
          </div>
        )}
        
        <div className="message-content">
          {isStreaming && !streamComplete ? (
            <StreamingText 
              text={chunks[0] || message.content}
              speed={30}
              onComplete={() => setStreamComplete(true)}
            />
          ) : (
            chunks.map((chunk, index) => (
              <div key={index} className="message-chunk">
                {chunk}
                {index < chunks.length - 1 && (
                  <div className="chunk-separator">···</div>
                )}
              </div>
            ))
          )}
        </div>
        
        {message.citations && message.citations.length > 0 && (
          <div className="citations-list">
            {message.citations.map((citation, index) => (
              <Citation key={index} citation={citation} index={index} />
            ))}
          </div>
        )}
        
        <div className="message-footer">
          <span className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.role === 'user' && (
            <span className="read-receipts">✓✓</span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Virtual scrolling container
const VirtualScrollContainer = ({ messages, height = 600 }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef();
  const itemHeight = 120; // Approximate height per message

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(height / itemHeight) + 2,
      messages.length
    );
    
    setVisibleRange({ start: Math.max(0, start - 2), end });
  };

  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * itemHeight;
  const totalHeight = messages.length * itemHeight;

  return (
    <div 
      ref={containerRef}
      className="virtual-scroll-container"
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleMessages.map((message, index) => (
            <Message 
              key={message.id} 
              message={message}
              isStreaming={index === messages.length - 1 && message.role === 'assistant'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Main EnhancedMessageList component
const EnhancedMessageList = ({ messages, isStreaming = false }) => {
  const containerRef = useRef();
  const [enableVirtualScroll, setEnableVirtualScroll] = useState(false);

  useEffect(() => {
    // Enable virtual scrolling for large message lists
    setEnableVirtualScroll(messages.length > 20);
  }, [messages.length]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (!enableVirtualScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, enableVirtualScroll]);

  if (enableVirtualScroll) {
    return <VirtualScrollContainer messages={messages} />;
  }

  return (
    <div ref={containerRef} className="enhanced-messages-container">
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <Message 
            key={message.id} 
            message={message}
            isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
          />
        ))}
      </AnimatePresence>
      
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="typing-indicator-container"
        >
          <div className="typing-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <span className="typing-text">AI thinking...</span>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedMessageList;