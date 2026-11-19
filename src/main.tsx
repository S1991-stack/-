import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register offline-first PWA service worker only over HTTP/HTTPS (skip in Electron file://)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(<App />);
