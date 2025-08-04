import React from 'react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import ChatInterface from './components/ChatInterface';

function App() {
  // Get user ID from Telegram WebApp if available
  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  return (
    <AppRoot
      appearance="light"
      platform="ios"
    >
      <ChatInterface userId={userId} />
    </AppRoot>
  );
}

export default App;