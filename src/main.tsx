import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket connection and closure errors that are expected when HMR is disabled
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason);
  if (
    message.includes('WebSocket') || 
    message.includes('websocket') || 
    message.includes('WebSocket closed without opened')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (
    message.includes('WebSocket') || 
    message.includes('websocket') || 
    message.includes('WebSocket closed without opened')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

