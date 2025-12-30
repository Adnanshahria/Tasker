import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Auto-reload on chunk load failure (fixes "Failed to fetch dynamically imported module")
window.addEventListener('error', (e) => {
  if (/Loading chunk [\d]+ failed|Failed to fetch dynamically imported module/.test(e.message)) {
    const isReloaded = sessionStorage.getItem('chunk_reload');
    if (!isReloaded) {
      sessionStorage.setItem('chunk_reload', 'true');
      window.location.reload();
    }
  }
});
window.addEventListener('load', () => sessionStorage.removeItem('chunk_reload'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);