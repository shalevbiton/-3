
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Add TypeScript global declaration to allow access to window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
    };
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Log environment for debugging
if (window.electronAPI) {
    console.log("Running in Desktop (Electron) mode");
} else {
    console.log("Running in Web mode");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
