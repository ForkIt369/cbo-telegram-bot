import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './EnhancedChatInput.css';

// Voice input handler (Web Speech API)
const useVoiceInput = (onTranscript) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          onTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, transcript, startListening, stopListening };
};

// Suggestion Pills Component
const SuggestionPills = ({ suggestions, onSelect, visible }) => {
  if (!visible || !suggestions.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="suggestion-pills-container"
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="suggestion-pill glass-surface-light"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion.icon && <span className="pill-icon">{suggestion.icon}</span>}
            <span className="pill-text">{suggestion.text}</span>
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

// File upload preview
const FilePreview = ({ files, onRemove }) => {
  if (!files.length) return null;

  return (
    <div className="file-preview-container">
      {files.map((file, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="file-preview glass-surface-light"
        >
          <div className="file-icon">
            {file.type.startsWith('image/') ? '🖼️' : '📄'}
          </div>
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-size">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <button
            className="file-remove"
            onClick={() => onRemove(index)}
            aria-label="Remove file"
          >
            ×
          </button>
        </motion.div>
      ))}
    </div>
  );
};

// Main Enhanced Chat Input Component
const EnhancedChatInput = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Ask CBO-Bro anything...",
  suggestions = [],
  onTyping
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Voice input integration
  const handleVoiceTranscript = useCallback((transcript) => {
    setMessage(prev => prev + ' ' + transcript);
    setCharCount(message.length + transcript.length);
  }, [message]);

  const { isListening, startListening, stopListening } = useVoiceInput(handleVoiceTranscript);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
      setIsExpanded(newHeight > 56);
    }
  }, [message]);

  // Handle typing indicator
  useEffect(() => {
    if (onTyping) {
      clearTimeout(typingTimeoutRef.current);
      if (message.length > 0) {
        onTyping(true);
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 1000);
      } else {
        onTyping(false);
      }
    }
  }, [message, onTyping]);

  const handleSend = () => {
    if ((!message.trim() && files.length === 0) || isLoading) return;

    const payload = {
      message: message.trim(),
      files: files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        data: f.data
      })),
      timestamp: new Date().toISOString()
    };

    onSendMessage(payload);
    
    // Reset state
    setMessage('');
    setFiles([]);
    setCharCount(0);
    setShowSuggestions(true);
    
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const processedFiles = await Promise.all(
      selectedFiles.map(async (file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = (e) => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: e.target.result
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );
    
    setFiles(prev => [...prev, ...processedFiles]);
    fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestionSelect = (suggestion) => {
    setMessage(suggestion.text);
    setCharCount(suggestion.text.length);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const defaultSuggestions = [
    { icon: '💎', text: 'How can I improve customer retention?' },
    { icon: '💰', text: 'Analyze my cash flow situation' },
    { icon: '⚡', text: 'Optimize my business operations' },
    { icon: '📊', text: 'What metrics should I track?' }
  ];

  const activeSuggestions = message.length === 0 ? 
    (suggestions.length > 0 ? suggestions : defaultSuggestions) : [];

  return (
    <div className={`enhanced-chat-input ${isExpanded ? 'expanded' : ''}`}>
      <SuggestionPills
        suggestions={activeSuggestions}
        onSelect={handleSuggestionSelect}
        visible={showSuggestions && !isLoading}
      />
      
      <FilePreview files={files} onRemove={removeFile} />
      
      <div className="input-container glass-surface">
        <div className="input-actions-left">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <button
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="Attach file"
          >
            📎
          </button>
          
          <button
            className={`action-btn ${isListening ? 'recording' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
          >
            {isListening ? '🔴' : '🎤'}
          </button>
        </div>
        
        <div className="input-field-wrapper">
          <textarea
            ref={textareaRef}
            className="input-field"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setCharCount(e.target.value.length);
              setShowSuggestions(e.target.value.length === 0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            maxLength={2000}
          />
          
          {charCount > 0 && (
            <div className="char-counter">
              {charCount}/2000
            </div>
          )}
        </div>
        
        <div className="input-actions-right">
          <motion.button
            className="send-button"
            onClick={handleSend}
            disabled={(!message.trim() && files.length === 0) || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="loading-spinner" />
            ) : (
              <span className="send-icon">→</span>
            )}
          </motion.button>
        </div>
      </div>
      
      <div className="input-hints">
        <span className="hint">⌘+Enter to send</span>
        <span className="hint">Shift+Enter for new line</span>
        <span className="hint">Drop files to attach</span>
      </div>
    </div>
  );
};

export default EnhancedChatInput;