import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AgentToolPanel.css';

// Agent-specific tool configurations
const agentTools = {
  cbo: [
    { 
      id: 'dashboard',
      icon: '📊',
      name: 'Business Dashboard',
      description: 'Real-time KPI tracking',
      action: 'analyze_dashboard'
    },
    {
      id: 'fourflows',
      icon: '💎',
      name: 'Four Flows Analysis',
      description: 'Value, Info, Work, Cash flows',
      action: 'analyze_flows'
    },
    {
      id: 'strategy',
      icon: '🎯',
      name: 'Strategy Canvas',
      description: 'Strategic planning tool',
      action: 'open_strategy'
    },
    {
      id: 'team',
      icon: '👥',
      name: 'Team Alignment',
      description: 'Team sync & coordination',
      action: 'team_sync'
    },
    {
      id: 'metrics',
      icon: '📈',
      name: 'Metrics Center',
      description: 'Performance analytics',
      action: 'view_metrics'
    }
  ],
  bigsis: [
    {
      id: 'risk',
      icon: '🛡️',
      name: 'Risk Matrix',
      description: 'Identify & assess risks',
      action: 'risk_assessment'
    },
    {
      id: 'scenario',
      icon: '🔮',
      name: 'Scenario Planner',
      description: 'Future scenario modeling',
      action: 'scenario_planning'
    },
    {
      id: 'competitor',
      icon: '🎯',
      name: 'Competitor Radar',
      description: 'Competitive analysis',
      action: 'competitor_analysis'
    },
    {
      id: 'trends',
      icon: '📊',
      name: 'Trend Forecaster',
      description: 'Market trend predictions',
      action: 'trend_forecast'
    },
    {
      id: 'decision',
      icon: '🌳',
      name: 'Decision Tree',
      description: 'Strategic decision mapping',
      action: 'decision_tree'
    }
  ],
  bro: [
    {
      id: 'tasks',
      icon: '✅',
      name: 'Task Board',
      description: 'Execution tracking',
      action: 'task_board'
    },
    {
      id: 'sprint',
      icon: '🏃',
      name: 'Sprint Planner',
      description: 'Agile sprint management',
      action: 'sprint_plan'
    },
    {
      id: 'process',
      icon: '⚡',
      name: 'Process Optimizer',
      description: 'Workflow optimization',
      action: 'optimize_process'
    },
    {
      id: 'resources',
      icon: '📦',
      name: 'Resource Manager',
      description: 'Resource allocation',
      action: 'manage_resources'
    },
    {
      id: 'quickwins',
      icon: '🎯',
      name: 'Quick Wins',
      description: 'Low-hanging fruit finder',
      action: 'find_quickwins'
    }
  ],
  lilsis: [
    {
      id: 'ideas',
      icon: '💡',
      name: 'Innovation Lab',
      description: 'Brainstorm & ideate',
      action: 'innovation_lab'
    },
    {
      id: 'trends',
      icon: '🔍',
      name: 'Trend Spotter',
      description: 'Emerging opportunities',
      action: 'spot_trends'
    },
    {
      id: 'experiment',
      icon: '🧪',
      name: 'Experiment Designer',
      description: 'Test new concepts',
      action: 'design_experiment'
    },
    {
      id: 'pivot',
      icon: '🔄',
      name: 'Pivot Analyzer',
      description: 'Find pivot opportunities',
      action: 'analyze_pivot'
    },
    {
      id: 'creative',
      icon: '✨',
      name: 'Creative Spark',
      description: 'Unlock creativity',
      action: 'creative_spark'
    }
  ]
};

const AgentToolPanel = ({ currentAgent, onToolSelect, isExpanded = false }) => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolsReady, setToolsReady] = useState(false);
  
  const tools = agentTools[currentAgent] || [];
  
  useEffect(() => {
    // Animate tools entrance
    setToolsReady(false);
    const timer = setTimeout(() => setToolsReady(true), 100);
    return () => clearTimeout(timer);
  }, [currentAgent]);
  
  const handleToolClick = (tool) => {
    setSelectedTool(tool.id);
    
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Notify parent component
    onToolSelect(tool);
    
    // Reset selection after animation
    setTimeout(() => setSelectedTool(null), 300);
  };
  
  const getAgentStyle = () => {
    const styles = {
      cbo: {
        background: 'linear-gradient(135deg, rgba(48, 209, 88, 0.1) 0%, transparent 60%)',
        borderColor: 'var(--cbo-primary)',
        glowColor: 'var(--cbo-glow)'
      },
      bigsis: {
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, transparent 60%)',
        borderColor: 'var(--bigsis-primary)',
        glowColor: 'var(--bigsis-glow)'
      },
      bro: {
        background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, transparent 60%)',
        borderColor: 'var(--bro-primary)',
        glowColor: 'var(--bro-glow)'
      },
      lilsis: {
        background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, transparent 60%)',
        borderColor: 'var(--lilsis-primary)',
        glowColor: 'var(--lilsis-glow)'
      }
    };
    
    return styles[currentAgent] || styles.cbo;
  };
  
  const agentStyle = getAgentStyle();
  
  return (
    <AnimatePresence mode="wait">
      {isExpanded && (
        <motion.div
          className="agent-tool-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="tools-header">
            <h3 className="tools-title">
              {currentAgent === 'cbo' && 'Strategic Tools'}
              {currentAgent === 'bigsis' && 'Wisdom Arsenal'}
              {currentAgent === 'bro' && 'Execution Kit'}
              {currentAgent === 'lilsis' && 'Innovation Toolkit'}
            </h3>
            <span className="tools-count">{tools.length} tools available</span>
          </div>
          
          <div className="tools-grid">
            {tools.map((tool, index) => (
              <motion.button
                key={tool.id}
                className={`tool-card glass-surface ${selectedTool === tool.id ? 'selected' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: toolsReady ? 1 : 0, 
                  y: toolsReady ? 0 : 20,
                  scale: selectedTool === tool.id ? 0.95 : 1
                }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  boxShadow: `0 8px 32px ${agentStyle.glowColor}`
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToolClick(tool)}
                style={{
                  background: agentStyle.background,
                  borderTop: `3px solid ${agentStyle.borderColor}`
                }}
              >
                <motion.div 
                  className="tool-icon"
                  animate={{ 
                    rotate: selectedTool === tool.id ? [0, -10, 10, -10, 0] : 0 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {tool.icon}
                </motion.div>
                <div className="tool-info">
                  <h4 className="tool-name">{tool.name}</h4>
                  <p className="tool-description">{tool.description}</p>
                </div>
                <div className="tool-hover-indicator">
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path 
                      d="M6 2L12 8L6 14" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
          
          <motion.div 
            className="tools-tip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="tip-icon">💡</span>
            <span className="tip-text">
              {currentAgent === 'cbo' && 'Use these tools to get a holistic view of your business'}
              {currentAgent === 'bigsis' && 'Plan for the long-term and manage risks effectively'}
              {currentAgent === 'bro' && 'Execute fast and optimize your operations'}
              {currentAgent === 'lilsis' && 'Innovate and discover new opportunities'}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentToolPanel;