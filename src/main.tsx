import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import WebApp from '@twa-dev/sdk';

// ============================================
// TELEGRAM MINI APP INITIALIZATION
// ============================================
const initTelegram = () => {
  try {
    WebApp.ready();
    WebApp.expand(); // Expands the app to full screen
    
    // Set Telegram theme colors to match your dark theme
    // This ensures the native Telegram header matches your 'ink' color
    if (WebApp.colorScheme === 'dark') {
      document.documentElement.style.setProperty('--tg-theme-bg-color', '#171007'); // --color-ink
      document.documentElement.style.setProperty('--tg-theme-text-color', '#f2e8d5'); // --color-bone
    } else {
      // Fallback for light mode users (though your app is dark-first)
      document.documentElement.style.setProperty('--tg-theme-bg-color', '#f5eede'); // --color-linen
      document.documentElement.style.setProperty('--tg-theme-text-color', '#171007'); // --color-ink
    }
    
    console.log('✅ Telegram Mini App initialized');
  } catch (err) {
    console.log('⚠️ Not running in Telegram:', err);
  }
};

// ============================================
// 🚀 FIX: Dynamic Viewport Height for Mobile
// ============================================
// Telegram's mobile webview height fluctuates. This calculates the true height
// so your background image always covers the screen perfectly without gaps.
const setVh = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Run on load and whenever the user rotates their phone or keyboard opens
initTelegram();
setVh();
window.addEventListener('resize', setVh);

// ============================================
// REACT RENDER
// ============================================
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);