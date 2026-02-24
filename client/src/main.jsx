import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Unregister any existing service workers first to clear stale caches,
// then only register in production builds.
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In development: unregister all SWs and clear caches
    navigator.serviceWorker.getRegistrations().then(regs =>
      regs.forEach(r => r.unregister())
    );
    caches.keys().then(keys =>
      keys.forEach(k => caches.delete(k))
    );
  } else {
    // In production: register the service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { });
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
