const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    restartApp: () => ipcRenderer.send('restart-app'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    removeAllListeners: () => {
        ipcRenderer.removeAllListeners('update-available');
        ipcRenderer.removeAllListeners('download-progress');
        ipcRenderer.removeAllListeners('update-downloaded');
    }
});

// Expose version information
contextBridge.exposeInMainWorld('electronInfo', {
    platform: process.platform,
    versions: process.versions
});