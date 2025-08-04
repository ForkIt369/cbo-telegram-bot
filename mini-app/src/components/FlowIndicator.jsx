import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FlowIndicator.css';

const flows = {
  value: { emoji: '💎', color: '#667eea' },
  info: { emoji: '📊', color: '#48bb78' },
  work: { emoji: '⚙️', color: '#ed8936' },
  cash: { emoji: '💰', color: '#38b2ac' }
};

const FlowIndicator = ({ activeFlow }) => {
  if (!activeFlow) return null;

  const flow = flows[activeFlow.toLowerCase()];
  if (!flow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="flow-indicator"
        style={{ background: flow.color }}
      >
        <span className="flow-emoji">{flow.emoji}</span>
        <span className="flow-name">{activeFlow}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default FlowIndicator;