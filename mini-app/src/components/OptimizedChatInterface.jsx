import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo, 
  lazy, 
  Suspense,
  useDeferredValue,
  useTransition
} from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import WebSocketManager from '../services/WebSocketManager';
import VirtualMessageList from './VirtualMessageList';
import ErrorBoundary from './ErrorBoundary';
import '../styles/performance.css';
import './EnhancedChatInterface.css';
import './EnhancedChatInterface-mobile.css';

// Lazy load heavy components
const AgentToolPanel = lazy(() => import('./AgentToolPanel'));
const FlowIndicator = lazy(() => import('./FlowIndicator'));

// Agent configuration with optimized data structure
const AGENTS = {
  cbo: {
    id: 'cbo',
    name: 'CBO',
    avatar: '/avatars/cbo-new.png',
    color: '#30D158',
    glow: 'rgba(48, 209, 88, 0.3)',
    role: 'Chief Bro Officer',
    expertise: 'Business optimization & Four Flows',
    systemPrompt: 'Strategic, data-driven, results-focused'
  },
  bigsis: {
    id: 'bigsis',
    name: 'Big Sis',
    avatar: '/avatars/bigsis.png',
    color: '#00D4FF',
    glow: 'rgba(0, 212, 255, 0.3)',
    role: 'Strategic Wisdom',
    expertise: 'Long-term planning & risk',
    systemPrompt: 'Wise, patient, forward-thinking'
  },
  bro: {
    id: 'bro',
    name: 'Bro',
    avatar: '/avatars/bro.png',
    color: '#FF9500',
    glow: 'rgba(255, 149, 0, 0.3)',
    role: 'Execution Excellence',
    expertise: 'Operations & implementation',
    systemPrompt: 'Energetic, action-oriented'
  },
  lilsis: {
    id: 'lilsis',
    name: 'Lil Sis',
    avatar: '/avatars/lilsis.png',
    color: '#9D4EDD',
    glow: 'rgba(157, 78, 221, 0.3)',
    role: 'Creative Innovation',
    expertise: 'Disruption & opportunities',
    systemPrompt: 'Creative, innovative'
  }
};

// Memory management constants
const MAX_MESSAGES_PER_THREAD = 100;
const MESSAGE_CLEANUP_THRESHOLD = 150;

// Optimized Chat Interface Component
const OptimizedChatInterface = ({ userId }) => {
  // State with optimized initial values
  const [threads, setThreads] = useState(() => ({
    cbo: [],
    bigsis: [],
    bro: [],
    lilsis: []
  }));
  
  const [currentAgent, setCurrentAgent] = useState('cbo');
  const [messages, setMessages] = useState(() => threads[currentAgent]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [inputValue, setInputValue] = useState('');
  
  // Performance hooks
  const deferredMessages = useDeferredValue(messages);
  const [isPending, startTransition] = useTransition();
  
  // Refs for performance
  const wsManager = useRef(null);
  const inputRef = useRef(null);
  const threadCleanupTimer = useRef(null);
  
  // Memoized current agent data
  const agent = useMemo(() => AGENTS[currentAgent], [currentAgent]);
  
  // Initialize WebSocket manager
  useEffect(() => {
    if (!userId) return;
    
    wsManager.current = new WebSocketManager(
      userId,
      handleWebSocketMessage,
      setConnectionStatus
    );
    
    wsManager.current.connect();
    
    return () => {
      wsManager.current?.disconnect();
    };
  }, [userId]);
  
  // WebSocket message handler with optimization
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'message') {
      startTransition(() => {
        setMessages(prev => {
          const newMessages = [...prev, {
            id: `msg-${Date.now()}-${Math.random()}`,
            ...data.message,
            timestamp: data.message.timestamp || new Date().toISOString()
          }];
          
          // Implement message limit for memory management
          if (newMessages.length > MESSAGE_CLEANUP_THRESHOLD) {
            return newMessages.slice(-MAX_MESSAGES_PER_THREAD);
          }
          
          return newMessages;
        });
      });
      
      setIsLoading(false);
    }
  }, []);
  
  // Optimized message sending
  const handleSendMessage = useCallback(async (e) => {
    e?.preventDefault();
    
    const message = inputValue.trim();
    if (!message || isLoading) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      agent: currentAgent
    };
    
    // Optimistic update
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Send via WebSocket
    const sent = wsManager.current?.send({
      type: 'message',
      userId,
      message,
      agent: currentAgent
    });
    
    // Fallback to HTTP if WebSocket fails
    if (!sent) {
      try {
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            message,
            agent: currentAgent
          })
        });
        
        const data = await response.json();
        
        startTransition(() => {
          setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toISOString(),
            agent: currentAgent
          }]);
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [inputValue, isLoading, currentAgent, userId]);
  
  // Optimized agent switching
  const switchAgent = useCallback((agentId) => {
    if (agentId === currentAgent) return;
    
    // Save current thread
    startTransition(() => {
      setThreads(prev => ({
        ...prev,
        [currentAgent]: messages
      }));
      
      // Load new thread
      setMessages(threads[agentId] || []);
      setCurrentAgent(agentId);
      setShowAgentSelector(false);
    });
    
    // Update theme
    document.documentElement.setAttribute('data-agent', agentId);
    
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  }, [currentAgent, messages, threads]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Cmd/Ctrl + / to toggle tools
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowToolPanel(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Clean up old messages periodically
  useEffect(() => {
    threadCleanupTimer.current = setInterval(() => {
      setThreads(prev => {
        const cleaned = {};
        for (const [key, msgs] of Object.entries(prev)) {
          if (msgs.length > MESSAGE_CLEANUP_THRESHOLD) {
            cleaned[key] = msgs.slice(-MAX_MESSAGES_PER_THREAD);
          } else {
            cleaned[key] = msgs;
          }
        }
        return cleaned;
      });
    }, 60000); // Every minute
    
    return () => {
      if (threadCleanupTimer.current) {
        clearInterval(threadCleanupTimer.current);
      }
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <div className="enhanced-chat-interface gpu-accelerated">
          {/* Connection Status */}
          <AnimatePresence>
            {connectionStatus !== 'connected' && (
              <motion.div
                className={`connection-status ${connectionStatus}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {connectionStatus === 'connecting' && 'Connecting...'}
                {connectionStatus === 'reconnecting' && 'Reconnecting...'}
                {connectionStatus === 'disconnected' && 'Offline Mode'}
                {connectionStatus === 'error' && 'Connection Error'}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Header */}
          <header 
            className="chat-header glass-surface"
            style={{
              borderBottom: `1px solid ${agent.color}30`,
              background: `linear-gradient(135deg, ${agent.glow}20 0%, transparent 60%)`
            }}
          >
            <div className="header-left">
              <button
                className="current-agent-btn"
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                style={{
                  background: `linear-gradient(135deg, ${agent.color} 0%, ${agent.glow} 100%)`,
                  boxShadow: `0 4px 24px ${agent.glow}`
                }}
              >
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="agent-avatar"
                  loading="lazy"
                  width="28"
                  height="28"
                />
                <div className="agent-info">
                  <span className="agent-name">{agent.name}</span>
                  <span className="agent-role">{agent.role}</span>
                </div>
                <motion.span
                  className="switch-indicator"
                  animate={{ rotate: showAgentSelector ? 180 : 0 }}
                >
                  ▼
                </motion.span>
              </button>
              
              {/* Agent Selector Dropdown */}
              <AnimatePresence>
                {showAgentSelector && (
                  <motion.div
                    className="agent-selector glass-surface"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {Object.values(AGENTS).map((a) => (
                      <motion.button
                        key={a.id}
                        className={`agent-option ${a.id === currentAgent ? 'active' : ''}`}
                        onClick={() => switchAgent(a.id)}
                        style={{
                          borderLeft: `3px solid ${a.color}`,
                          background: a.id === currentAgent ? a.glow : 'transparent'
                        }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img 
                          src={a.avatar} 
                          alt={a.name} 
                          className="option-avatar"
                          loading="lazy"
                          width="32"
                          height="32"
                        />
                        <div className="option-info">
                          <div className="option-name">{a.name}</div>
                          <div className="option-expertise">{a.expertise}</div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <img
              src="/broverse-logo.svg"
              alt="BroVerse"
              className="header-logo"
              style={{
                height: '28px',
                marginLeft: '12px',
                filter: `drop-shadow(0 0 8px ${agent.glow})`
              }}
            />
            
            <Suspense fallback={<div />}>
              <FlowIndicator activeFlow={null} />
            </Suspense>
          </header>
          
          {/* Tool Panel */}
          <AnimatePresence>
            {showToolPanel && (
              <Suspense fallback={<div className="loading-panel">Loading tools...</div>}>
                <AgentToolPanel
                  currentAgent={currentAgent}
                  onToolSelect={(tool) => {
                    console.log('Tool selected:', tool);
                    setShowToolPanel(false);
                  }}
                  isExpanded={showToolPanel}
                />
              </Suspense>
            )}
          </AnimatePresence>
          
          {/* Messages Area */}
          <div className="chat-content">
            {deferredMessages.length === 0 ? (
              <motion.div
                className="welcome-screen"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="welcome-content">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="welcome-avatar"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: `3px solid ${agent.color}`,
                      boxShadow: `0 0 30px ${agent.glow}`
                    }}
                  />
                  <h2 style={{ color: agent.color }}>{agent.name}</h2>
                  <p>{agent.role}</p>
                  <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '24px' }}>
                    Ask me anything about your business challenges!
                  </p>
                </div>
              </motion.div>
            ) : (
              <VirtualMessageList
                messages={deferredMessages}
                currentAgent={agent}
                isStreaming={isLoading}
              />
            )}
          </div>
          
          {/* Bottom Navigation */}
          <div className="bottom-navigation glass-surface">
            {Object.values(AGENTS).map((a) => (
              <motion.button
                key={a.id}
                className="nav-btn"
                onClick={() => switchAgent(a.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  color: currentAgent === a.id ? a.color : 'var(--text-secondary)'
                }}
              >
                <img 
                  src={a.avatar} 
                  alt={a.name} 
                  className="nav-avatar"
                  loading="lazy"
                  width="24"
                  height="24"
                />
              </motion.button>
            ))}
            
            <motion.button
              className="nav-btn tools-toggle"
              onClick={() => setShowToolPanel(!showToolPanel)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                rotate: showToolPanel ? 45 : 0,
                backgroundColor: showToolPanel ? agent.color : 'transparent'
              }}
            >
              🛠️
            </motion.button>
          </div>
          
          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="chat-input-wrapper compact">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask ${agent.name}...`}
              className="chat-input"
              disabled={isLoading}
              autoComplete="off"
              style={{
                borderColor: agent.color + '30',
                fontSize: '13px',
                padding: '6px 10px',
                minHeight: '32px'
              }}
            />
            <motion.button
              type="submit"
              className="send-btn"
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: agent.color,
                opacity: inputValue.trim() ? 1 : 0.5,
                width: '32px',
                height: '32px',
                fontSize: '16px'
              }}
            >
              {isLoading ? '⏳' : '➤'}
            </motion.button>
          </form>
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
};

export default OptimizedChatInterface;