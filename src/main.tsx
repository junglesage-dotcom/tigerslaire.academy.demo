import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import WebApp from '@twa-dev/sdk';

// Initialize Telegram Mini App
const initTelegram = () => {
  try {
    WebApp.ready();
    WebApp.expand();
    
    // Set Telegram theme colors
    if (WebApp.colorScheme === 'dark') {
      document.documentElement.style.setProperty('--tg-theme-bg-color', '#171007');
      document.documentElement.style.setProperty('--tg-theme-text-color', '#f2e8d5');
    } else {
      document.documentElement.style.setProperty('--tg-theme-bg-color', '#f5eede');
      document.documentElement.style.setProperty('--tg-theme-text-color', '#171007');
    }
    
    console.log('✅ Telegram Mini App initialized');
  } catch (err) {
    console.log('⚠️ Not running in Telegram:', err);
  }
};

initTelegram();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);