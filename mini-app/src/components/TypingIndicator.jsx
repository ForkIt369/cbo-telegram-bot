import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TypingIndicator.css';

const TypingIndicator = ({ delay = 400 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Add cognitive pause before showing typing indicator
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        className="typing-indicator"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        role="status"
        aria-label="CBO-Bro is typing"
      >
        <div className="typing-avatar">
          <img 
            src="/cbo-character.png" 
            alt="CBO-Bro" 
            className="typing-avatar-img"
            loading="lazy"
          />
        </div>
        <div className="typing-content">
          <div className="typing-dots">
            {[1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="dot"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          <span className="typing-text">AI is thinking...</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TypingIndicator;