import React from 'react';
import { motion } from 'framer-motion';
import './TypingIndicator.css';

const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <div className="typing-avatar">
        <img src="/cbo-avatar.png" alt="CBO-Bro" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
      </div>
      <div className="typing-dots">
        {[1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="dot"
            animate={{
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;