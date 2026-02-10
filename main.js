
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "L.E.M.S - מערכת ניהול מוצגים",
    backgroundColor: '#020617', // Match your slate-950 background
    show: false, // Don't show until ready-to-show to prevent white flicker
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the local index.html
  mainWindow.loadFile('index.html');

  // Open the DevTools (Optional for development)
  // mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// Handle app lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC communication example for potential future desktop features (e.g., printing)
ipcMain.handle('app:get-version', () => app.getVersion());
