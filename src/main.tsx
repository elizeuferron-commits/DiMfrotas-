import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Silencia avisos de depuração do React relacionados aos defaultProps do Recharts que não afetam a execução
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('defaultProps') || args[0].includes('Support for defaultProps'))
  ) {
    return;
  }
  originalError(...args);
};

const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('defaultProps') || args[0].includes('Support for defaultProps'))
  ) {
    return;
  }
  originalWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

// Registrar o Service Worker de forma agressiva na inicialização para habilitar Cache Offline e abrir rápido (0ms)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((reg) => {
        console.log('[DM ServiceWorker] Registrado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.warn('[DM ServiceWorker] Falha ao registrar Service Worker:', err);
      });
  });
}

