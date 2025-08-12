import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { motion, AnimatePresence } from 'framer-motion';

// Memoized message component for virtual scrolling
const MessageRow = memo(({ index, style, data }) => {
  const { messages, currentAgent, formatMessage } = data;
  const message = messages[index];
  
  if (!message) return null;
  
  const isUser = message.role === 'user';
  
  return (
    <div style={style} className="virtual-message-row">
      <motion.div
        initial={{ opacity: 0, x: isUser ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={`message ${isUser ? 'user-message' : 'assistant-message'}`}
      >
        {!isUser && (
          <img 
            src={currentAgent.avatar} 
            alt={currentAgent.name}
            className="message-avatar"
            loading="lazy"
            width="32"
            height="32"
          />
        )}
        <div 
          className="message-bubble"
          style={{
            background: isUser 
              ? `linear-gradient(135deg, ${currentAgent.color}, ${currentAgent.glow})`
              : 'var(--bg-tertiary)',
            borderColor: isUser ? 'transparent' : currentAgent.color + '30'
          }}
        >
          <div 
            className="message-content"
            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
          />
          {message.timestamp && (
            <div className="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
});

MessageRow.displayName = 'MessageRow';

// Virtual scrolling message list with performance optimizations
const VirtualMessageList = memo(({ 
  messages, 
  currentAgent, 
  isStreaming 
}) => {
  const listRef = useRef(null);
  const rowHeights = useRef({});
  const averageHeight = useRef(100);
  
  // Format message content with markdown support
  const formatMessage = useCallback((content) => {
    if (!content) return '';
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }, []);
  
  // Calculate dynamic row height based on content
  const getItemSize = useCallback((index) => {
    return rowHeights.current[index] || averageHeight.current;
  }, []);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);
  
  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    messages,
    currentAgent,
    formatMessage
  }), [messages, currentAgent, formatMessage]);
  
  return (
    <div className="virtual-message-list">
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            height={height}
            itemCount={messages.length}
            itemSize={getItemSize}
            itemData={itemData}
            width={width}
            overscanCount={5}
            className="message-list-container"
          >
            {MessageRow}
          </List>
        )}
      </AutoSizer>
      
      {isStreaming && (
        <motion.div 
          className="streaming-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </motion.div>
      )}
    </div>
  );
});

VirtualMessageList.displayName = 'VirtualMessageList';

export default VirtualMessageList;