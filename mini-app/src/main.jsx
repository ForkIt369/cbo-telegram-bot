import React from 'react';
import ReactDOM from 'react-dom/client';
import { init } from '@telegram-apps/sdk-react';
import '@telegram-apps/telegram-ui/dist/styles.css';
import './styles/index.css';
import App from './App';

// Initialize Telegram SDK
try {
  init();
} catch (error) {
  console.error('Failed to initialize Telegram SDK:', error);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);