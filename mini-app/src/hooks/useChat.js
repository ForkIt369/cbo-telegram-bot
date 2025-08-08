import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const useChat = (userId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);

  // Load chat history
  useEffect(() => {
    if (userId) {
      loadChatHistory();
    }
  }, [userId]);

  const loadChatHistory = async () => {
    try {
      const response = await axios.get(`/api/chat/history/${userId}`);
      if (response.data.messages) {
        // Ensure messages have timestamps
        const messagesWithTimestamps = response.data.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        setMessages(messagesWithTimestamps);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const detectFlow = (text) => {
    const flowKeywords = {
      'Value Flow': ['customer', 'user', 'satisfaction', 'experience', 'retention', 'delivery', 'value'],
      'Info Flow': ['data', 'analytics', 'metrics', 'insights', 'report', 'information', 'decision'],
      'Work Flow': ['process', 'operation', 'efficiency', 'productivity', 'workflow', 'optimize', 'performance'],
      'Cash Flow': ['revenue', 'cost', 'profit', 'financial', 'cash', 'money', 'budget', 'investment']
    };

    let bestMatch = null;
    let maxCount = 0;

    for (const [flow, keywords] of Object.entries(flowKeywords)) {
      const count = keywords.filter(kw => text.toLowerCase().includes(kw)).length;
      if (count > maxCount) {
        maxCount = count;
        bestMatch = flow;
      }
    }
    
    return maxCount > 0 ? bestMatch : null;
  };

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    // Add user message with unique ID and timestamp
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Trigger haptic feedback if available
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    try {
      const response = await axios.post('/api/chat/message', {
        userId,
        message: content
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data.response,
        flow: detectFlow(response.data.response),
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setActiveFlow(assistantMessage.flow);
      
      // Success haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      
      // Clear active flow after 3 seconds
      setTimeout(() => setActiveFlow(null), 3000);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Error haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    setActiveFlow(null);
    
    // Haptic feedback for clear action
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    try {
      await axios.post('/api/chat/clear', { userId });
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  }, [userId]);

  return {
    messages,
    isLoading,
    activeFlow,
    sendMessage,
    clearChat
  };
};

export default useChat;