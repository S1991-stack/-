const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('salahDesktopBridge', {
  platform: process.platform,
  pickMusicFolder: () => ipcRenderer.invoke('salah:pick-music-folder'),
});
