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
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const detectFlow = (text) => {
    const flowKeywords = {
      value: ['customer', 'user', 'satisfaction', 'experience', 'retention'],
      info: ['data', 'analytics', 'metrics', 'insights', 'report'],
      work: ['process', 'operation', 'efficiency', 'productivity', 'workflow'],
      cash: ['revenue', 'cost', 'profit', 'financial', 'cash', 'money']
    };

    for (const [flow, keywords] of Object.entries(flowKeywords)) {
      if (keywords.some(kw => text.toLowerCase().includes(kw))) {
        return flow;
      }
    }
    return null;
  };

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Haptic feedback would go here if available

    try {
      const response = await axios.post('/api/chat/message', {
        userId,
        message: content
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response,
        flow: detectFlow(response.data.response),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setActiveFlow(assistantMessage.flow);
      
      // Success feedback
      
      // Clear active flow after 3 seconds
      setTimeout(() => setActiveFlow(null), 3000);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    
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