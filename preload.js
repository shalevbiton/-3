
const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  // Add more bridges here for file system, printer, etc.
});

// Listener for system events
window.addEventListener('DOMContentLoaded', () => {
  console.log('L.E.M.S Desktop Environment Initialized');
});
