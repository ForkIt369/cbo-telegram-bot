import React, { useEffect, useState } from 'react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import ChatInterface from './components/ChatInterface';

function App() {
  const [theme, setTheme] = useState('dark');
  
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
      
      // Clean up event listeners
      return () => {
        tg.offEvent('themeChanged', applyThemeColors);
      };
    }
  }, []);
  
  return (
    <AppRoot
      appearance={theme}
      platform={window.Telegram?.WebApp?.platform || 'ios'}
    >
      <ChatInterface userId={userId} />
    </AppRoot>
  );
}

export default App;