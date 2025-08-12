import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import EnhancedMessageList from './EnhancedMessageList';
import EnhancedChatInput from './EnhancedChatInput';
import FlowIndicator from './FlowIndicator';
import AgentToolPanel from './AgentToolPanel';
import './EnhancedChatInterface.css';
import './EnhancedChatInterface-mobile.css';

// Agent configuration
const agents = {
  cbo: {
    name: 'CBO',
    avatar: '/avatars/cbo-new.png',
    color: 'var(--cbo-primary)',
    glow: 'var(--cbo-glow)',
    role: 'Chief Bro Officer',
    expertise: 'Business optimization & Four Flows analysis',
    personality: 'Strategic, data-driven, results-focused'
  },
  bigsis: {
    name: 'Big Sis',
    avatar: '/avatars/bigsis.png',
    color: 'var(--bigsis-primary)',
    glow: 'var(--bigsis-glow)',
    role: 'Strategic Wisdom',
    expertise: 'Long-term planning & risk management',
    personality: 'Wise, patient, forward-thinking'
  },
  bro: {
    name: 'Bro',
    avatar: '/avatars/bro.png',
    color: 'var(--bro-primary)',
    glow: 'var(--bro-glow)',
    role: 'Execution Excellence',
    expertise: 'Operations & rapid implementation',
    personality: 'Energetic, action-oriented, supportive'
  },
  lilsis: {
    name: 'Lil Sis',
    avatar: '/avatars/lilsis.png',
    color: 'var(--lilsis-primary)',
    glow: 'var(--lilsis-glow)',
    role: 'Creative Innovation',
    expertise: 'Disruption & new opportunities',
    personality: 'Creative, innovative, boundary-pushing'
  }
};

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
  // Thread management for separate conversations per agent
  const [threads, setThreads] = useState({
    cbo: [],
    bigsis: [],
    bro: [],
    lilsis: [],
    shared: [] // Cross-agent important messages
  });
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState('cbo');
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);
  const [userTyping, setUserTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [viewMode, setViewMode] = useState('single'); // 'single', 'split', 'unified'
  const [selectedTool, setSelectedTool] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);
  
  // Swipe gesture values
  const dragX = useMotionValue(0);
  const backgroundOpacity = useTransform(dragX, [-100, 0, 100], [0.3, 0, 0.3]);
  
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

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
        timestamp: data.message.timestamp || new Date().toISOString(),
        agent: currentAgent
      };
      setMessages(prev => [...prev, newMessage]);
      setAiTyping(false);
    } else if (data.type === 'typing') {
      setAiTyping(data.isTyping);
    } else if (data.type === 'flow_update') {
      setActiveFlow(data.flow);
    }
  }, [currentAgent]);

  // Initialize WebSocket connection
  const { connectionStatus: wsStatus, sendMessage: wsSendMessage } = useWebSocket(userId, handleWebSocketMessage);

  useEffect(() => {
    setConnectionStatus(wsStatus === 'connected' ? 'online' : 'offline');
  }, [wsStatus]);

  // State for initial loading
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Load initial messages
  useEffect(() => {
    if (userId) {
      loadChatHistory();
    }
  }, [userId]);

  const loadChatHistory = async () => {
    setInitialLoading(true);
    try {
      const response = await fetch(`/api/chat/history/${userId}`);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString(),
          flow: detectFlow(msg.content),
          agent: msg.agent || 'cbo'
        })));
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setInitialLoading(false);
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
          files,
          agent: currentAgent
        });
      } else {
        // Fallback to HTTP
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            message,
            files,
            agent: currentAgent
          })
        });

        const data = await response.json();
        
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          flow: detectFlow(data.response),
          citations: data.citations || [],
          timestamp: new Date().toISOString(),
          agent: currentAgent
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
        isError: true,
        agent: currentAgent
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

  // Thread management functions
  const switchThread = useCallback((newAgent) => {
    // Save current thread
    setThreads(prev => ({
      ...prev,
      [currentAgent]: messages
    }));
    
    // Load new thread
    const newThread = threads[newAgent] || [];
    setMessages(newThread);
    setCurrentAgent(newAgent);
    
    // Transfer context - last 3 messages to shared
    if (messages.length > 0) {
      const contextMessages = messages.slice(-3);
      setThreads(prev => ({
        ...prev,
        shared: [...prev.shared, ...contextMessages]
      }));
    }
    
    // Dynamic theme switching
    document.documentElement.setAttribute('data-agent', newAgent);
    
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  }, [currentAgent, messages, threads]);
  
  // Handle tool selection
  const handleToolSelect = useCallback((tool) => {
    // Insert tool command into message
    const toolCommand = `/${tool.action}`;
    
    // Send as a message
    handleSendMessage({ 
      message: `${toolCommand} - ${tool.description}`,
      files: []
    });
    
    // Close tool panel
    setShowToolPanel(false);
    
    // Track tool usage
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify({
        action: 'tool_used',
        tool: tool.id,
        agent: currentAgent
      }));
    }
  }, [currentAgent, handleSendMessage]);
  
  // Swipe gesture handlers
  const handleDragEnd = useCallback((event, info) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    
    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      const agentOrder = ['bigsis', 'cbo', 'bro', 'lilsis'];
      const currentIndex = agentOrder.indexOf(currentAgent);
      
      if (offset > 0 && currentIndex > 0) {
        // Swipe right - previous agent
        switchThread(agentOrder[currentIndex - 1]);
      } else if (offset < 0 && currentIndex < agentOrder.length - 1) {
        // Swipe left - next agent
        switchThread(agentOrder[currentIndex + 1]);
      }
    }
  }, [currentAgent, switchThread]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize agent theme
  useEffect(() => {
    document.documentElement.setAttribute('data-agent', currentAgent);
  }, [currentAgent]);
  
  // Voice control functions
  const startVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setVoiceTranscript('');
      // Haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    };
    
    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setVoiceTranscript(finalTranscript || interimTranscript);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (voiceTranscript) {
        handleSendMessage({ message: voiceTranscript, files: [] });
        setVoiceTranscript('');
      }
    };
    
    recognitionRef.current.start();
  }, [voiceTranscript, handleSendMessage]);
  
  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return (
    <div className="enhanced-chat-interface">
      {/* Header with Agent Selector */}
      <header className="chat-header glass-surface" style={{
        borderBottom: `2px solid ${agents[currentAgent].color}`,
        background: `linear-gradient(135deg, ${agents[currentAgent].glow} 0%, transparent 60%)`
      }}>
        <div className="header-left">
          <div className="agent-selector-container">
            <button 
              className="current-agent-btn"
              onClick={() => setShowAgentSelector(!showAgentSelector)}
              style={{
                background: `linear-gradient(135deg, ${agents[currentAgent].color} 0%, ${agents[currentAgent].glow} 100%)`,
                boxShadow: `0 4px 24px ${agents[currentAgent].glow}`
              }}
            >
              <img 
                src={agents[currentAgent].avatar} 
                alt={agents[currentAgent].name}
                className="agent-avatar"
              />
              <div className="agent-info">
                <span className="agent-name">{agents[currentAgent].name}</span>
                <span className="agent-role">{agents[currentAgent].role}</span>
              </div>
              <motion.span 
                className="switch-indicator"
                animate={{ rotate: showAgentSelector ? 180 : 0 }}
              >
                ▼
              </motion.span>
            </button>
            
            <AnimatePresence>
              {showAgentSelector && (
                <motion.div 
                  className="agent-selector glass-surface"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {Object.entries(agents).map(([key, agent]) => (
                    <motion.button
                      key={key}
                      className={`agent-option ${key === currentAgent ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentAgent(key);
                        setShowAgentSelector(false);
                        // Haptic feedback
                        if (window.Telegram?.WebApp?.HapticFeedback) {
                          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                        }
                      }}
                      style={{
                        borderLeft: `3px solid ${agent.color}`,
                        background: key === currentAgent ? agent.glow : 'transparent'
                      }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <img src={agent.avatar} alt={agent.name} className="option-avatar" />
                      <div className="option-info">
                        <div className="option-name">{agent.name}</div>
                        <div className="option-expertise">{agent.expertise}</div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="header-info">
            <h1 className="header-title">BroVerse Optimizer</h1>
            <div className="header-subtitle">
              {agents[currentAgent].personality}
              {connectionStatus === 'offline' && (
                <span className="offline-badge">Offline Mode</span>
              )}
            </div>
          </div>
        </div>
        
        <FlowIndicator activeFlow={activeFlow} />
        
        <div className="header-actions">
          <motion.button
            className="action-icon-btn"
            onClick={() => {
              setMessages([]);
              setShowWelcome(true);
            }}
            aria-label="Clear chat"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            🗑️
          </motion.button>
          <motion.button
            className="action-icon-btn"
            onClick={() => window.Telegram?.WebApp?.close()}
            aria-label="Close"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>
      </header>
      
      {/* Tool Panel */}
      <AgentToolPanel 
        currentAgent={currentAgent}
        onToolSelect={handleToolSelect}
        isExpanded={showToolPanel}
      />
      
      {/* Context Bar for Thread Info */}
      <motion.div 
        className="context-bar glass-surface"
        initial={{ height: 0 }}
        animate={{ height: viewMode !== 'single' ? 32 : 0 }}
      >
        <div className="thread-info">
          <span className="thread-label">Thread:</span>
          <span className="thread-name">{agents[currentAgent].name}</span>
          <span className="thread-count">{messages.length} messages</span>
        </div>
        <div className="view-mode-toggle">
          <button 
            className={viewMode === 'single' ? 'active' : ''}
            onClick={() => setViewMode('single')}
          >Single</button>
          <button 
            className={viewMode === 'split' ? 'active' : ''}
            onClick={() => setViewMode('split')}
          >Split</button>
          <button 
            className={viewMode === 'unified' ? 'active' : ''}
            onClick={() => setViewMode('unified')}
          >Unified</button>
        </div>
      </motion.div>

      {/* Messages Area with Swipe Gestures */}
      <motion.div 
        className="chat-content"
        ref={containerRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
      >
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
                <motion.div 
                  className="welcome-hero"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={agents[currentAgent].avatar} 
                    alt={agents[currentAgent].name}
                    className="welcome-avatar"
                    style={{ 
                      width: '80px', 
                      height: '80px',
                      borderRadius: '50%',
                      border: `3px solid ${agents[currentAgent].color}`,
                      boxShadow: `0 0 30px ${agents[currentAgent].glow}`
                    }}
                  />
                  <h2 className="welcome-agent-name" style={{ 
                    color: agents[currentAgent].color,
                    fontSize: '24px',
                    marginTop: '12px'
                  }}>
                    {agents[currentAgent].name}
                  </h2>
                  <p className="welcome-agent-role" style={{
                    fontSize: '14px',
                    opacity: 0.8,
                    marginTop: '4px'
                  }}>
                    {agents[currentAgent].role}
                  </p>
                </motion.div>
                
                <div className="welcome-cta" style={{ marginTop: '24px' }}>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>
                    Ask me anything about your business challenges!
                  </p>
                  <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>
                    Swipe left/right or use bottom nav to switch advisors
                  </p>
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
                currentAgent={agents[currentAgent]}
              />
              
              {/* Skeleton Loading State */}
              {isLoading && (
                <div className="skeleton-message">
                  <div className="skeleton-avatar pulse"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line pulse" style={{ width: '80%' }}></div>
                    <div className="skeleton-line pulse" style={{ width: '60%' }}></div>
                    <div className="skeleton-line pulse" style={{ width: '70%' }}></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Navigation with Tools Toggle */}
      <div className="bottom-navigation glass-surface">
        <motion.button
          className="nav-btn"
          onClick={() => switchThread('bigsis')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ 
            color: currentAgent === 'bigsis' ? agents.bigsis.color : 'var(--text-secondary)'
          }}
        >
          <img src={agents.bigsis.avatar} alt="Big Sis" className="nav-avatar" />
        </motion.button>
        
        <motion.button
          className="nav-btn"
          onClick={() => switchThread('cbo')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ 
            color: currentAgent === 'cbo' ? agents.cbo.color : 'var(--text-secondary)'
          }}
        >
          <img src={agents.cbo.avatar} alt="CBO" className="nav-avatar" />
        </motion.button>
        
        <motion.button
          className="nav-btn tools-toggle"
          onClick={() => setShowToolPanel(!showToolPanel)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            rotate: showToolPanel ? 45 : 0,
            backgroundColor: showToolPanel ? agents[currentAgent].color : 'transparent'
          }}
        >
          🛠️
        </motion.button>
        
        <motion.button
          className="nav-btn"
          onClick={() => switchThread('bro')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ 
            color: currentAgent === 'bro' ? agents.bro.color : 'var(--text-secondary)'
          }}
        >
          <img src={agents.bro.avatar} alt="Bro" className="nav-avatar" />
        </motion.button>
        
        <motion.button
          className="nav-btn"
          onClick={() => switchThread('lilsis')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{ 
            color: currentAgent === 'lilsis' ? agents.lilsis.color : 'var(--text-secondary)'
          }}
        >
          <img src={agents.lilsis.avatar} alt="Lil Sis" className="nav-avatar" />
        </motion.button>
      </div>
      
      {/* Voice Control Button */}
      <motion.button
        className={`voice-btn ${isListening ? 'active' : ''}`}
        onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          backgroundColor: isListening ? agents[currentAgent].color : 'var(--bg-secondary)',
          boxShadow: isListening ? `0 0 20px ${agents[currentAgent].glow}` : 'none'
        }}
      >
        {isListening ? '🎤' : '🎙️'}
      </motion.button>
      
      {/* Voice Transcript Display */}
      {voiceTranscript && (
        <motion.div 
          className="voice-transcript glass-surface"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <span className="transcript-label">Listening:</span>
          <span className="transcript-text">{voiceTranscript}</span>
        </motion.div>
      )}
      
      {/* Input Area */}
      <div className="chat-input-wrapper">
        <EnhancedChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder={showWelcome ? `Ask ${agents[currentAgent].name} to analyze your business...` : `Message ${agents[currentAgent].name}...`}
          onTyping={handleUserTyping}
          currentAgent={agents[currentAgent]}
        />
      </div>
    </div>
  );
};

export default EnhancedChatInterface;