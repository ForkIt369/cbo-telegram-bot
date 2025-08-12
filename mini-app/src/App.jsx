import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState('cbo');
  
  // Initialize Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Apply theme
      document.body.style.backgroundColor = tg.backgroundColor || '#0D1117';
      document.body.style.color = tg.themeParams?.text_color || '#ffffff';
    }
  }, []);

  const agents = {
    cbo: { name: 'CBO', color: '#30D158', emoji: '🎯' },
    bro: { name: 'Bro', color: '#FF9500', emoji: '💪' },
    bigsis: { name: 'Big Sis', color: '#00D4FF', emoji: '🧠' },
    lilsis: { name: 'Lil Sis', color: '#9D4EDD', emoji: '✨' }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          agent: currentAgent,
          userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'web-user'
        })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.message || 'No response',
        agent: currentAgent,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        agent: currentAgent,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <h1>BroVerse Chat</h1>
        <div className="agent-selector">
          {Object.entries(agents).map(([key, agent]) => (
            <button
              key={key}
              className={`agent-btn ${currentAgent === key ? 'active' : ''}`}
              onClick={() => setCurrentAgent(key)}
              style={{
                '--agent-color': agent.color,
                backgroundColor: currentAgent === key ? agent.color : 'transparent',
                color: currentAgent === key ? '#fff' : agent.color,
                borderColor: agent.color
              }}
            >
              <span>{agent.emoji}</span>
              <span>{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{agents[currentAgent].emoji}</div>
            <p>Start a conversation with {agents[currentAgent].name}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.role}`}
              style={{
                '--msg-color': msg.role === 'assistant' ? agents[msg.agent || currentAgent].color : '#667eea'
              }}
            >
              {msg.role === 'assistant' && (
                <div className="agent-avatar">
                  {agents[msg.agent || currentAgent].emoji}
                </div>
              )}
              <div className="message-bubble">
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant">
            <div className="agent-avatar">{agents[currentAgent].emoji}</div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message ${agents[currentAgent].name}...`}
          disabled={isLoading}
          className="message-input"
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
          style={{ backgroundColor: agents[currentAgent].color }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default App;