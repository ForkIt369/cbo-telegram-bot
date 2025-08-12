import React, { useEffect, useState, lazy, Suspense } from 'react';
import './styles/design-system.css';
import './styles/performance.css';

// Lazy load the main interface for better initial load
const OptimizedChatInterface = lazy(() => import('./components/OptimizedChatInterface').catch(() => {
  // Fallback to simple chat interface if optimized version fails
  console.warn('Failed to load OptimizedChatInterface, falling back to SimpleChatInterface');
  return import('./components/SimpleChatInterface');
}));

function App() {
  const [theme, setTheme] = useState('dark');
  const [isReady, setIsReady] = useState(false);
  
  // Get user ID from Telegram WebApp if available
  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  
  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Ready the app
      tg.ready();
      
      // Expand to full height
      tg.expand();
      
      // Apply Telegram theme colors
      const applyThemeColors = () => {
        const themeParams = tg.themeParams;
        const root = document.documentElement;
        
        // Map Telegram theme colors to CSS variables
        if (themeParams.bg_color) {
          root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
        }
        if (themeParams.text_color) {
          root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
        }
        if (themeParams.hint_color) {
          root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
        }
        if (themeParams.link_color) {
          root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
        }
        if (themeParams.button_color) {
          root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
        }
        if (themeParams.button_text_color) {
          root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
        }
        if (themeParams.secondary_bg_color) {
          root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
        }
        if (themeParams.header_bg_color) {
          root.style.setProperty('--tg-theme-header-bg-color', themeParams.header_bg_color);
        }
        if (themeParams.accent_text_color) {
          root.style.setProperty('--tg-theme-accent-text-color', themeParams.accent_text_color);
        }
        if (themeParams.section_bg_color) {
          root.style.setProperty('--tg-theme-section-bg-color', themeParams.section_bg_color);
        }
        if (themeParams.section_header_text_color) {
          root.style.setProperty('--tg-theme-section-header-text-color', themeParams.section_header_text_color);
        }
        if (themeParams.subtitle_text_color) {
          root.style.setProperty('--tg-theme-subtitle-text-color', themeParams.subtitle_text_color);
        }
        if (themeParams.destructive_text_color) {
          root.style.setProperty('--tg-theme-destructive-text-color', themeParams.destructive_text_color);
        }
        
        // Detect theme mode
        const isDark = tg.colorScheme === 'dark';
        setTheme(isDark ? 'dark' : 'light');
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      };
      
      // Apply initial theme
      applyThemeColors();
      
      // Listen for theme changes
      tg.onEvent('themeChanged', applyThemeColors);
      
      // Set viewport settings
      const viewport = tg.viewportHeight;
      const root = document.documentElement;
      if (viewport) {
        root.style.setProperty('--tg-viewport-height', `${viewport}px`);
      }
      
      // Handle viewport changes
      tg.onEvent('viewportChanged', ({ isStateStable }) => {
        if (isStateStable) {
          const newViewport = tg.viewportHeight;
          document.documentElement.style.setProperty('--tg-viewport-height', `${newViewport}px`);
        }
      });
      
      // Enable closing confirmation if needed
      tg.enableClosingConfirmation();
      
      // Enable haptic feedback on init
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
      
      // Mark as ready
      setIsReady(true);
      
      // Clean up event listeners
      return () => {
        tg.offEvent('themeChanged', applyThemeColors);
      };
    } else {
      // Fallback for non-Telegram environment
      setIsReady(true);
    }
  }, []);
  
  // Show loading spinner while initializing
  if (!isReady) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    );
  }
  
  return (
    <div 
      className={`app-root enhanced telegram-app theme-${theme}`}
      data-platform={window.Telegram?.WebApp?.platform || 'ios'}
    >
      <Suspense fallback={
        <div className="app-loading">
          <div className="loading-spinner" />
          <p style={{ marginTop: '16px', opacity: 0.7 }}>Loading BroVerse...</p>
        </div>
      }>
        <OptimizedChatInterface userId={userId} />
      </Suspense>
    </div>
  );
}

export default App;