const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const AUDIO_EXTS = new Set(['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.opus', '.webm']);

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#03081C',
    title: 'SALAH Neon Player | مشغل الصوت المتطور',
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const distIndex = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distIndex)) {
    win.loadFile(distIndex);
  } else {
    win.loadURL('http://localhost:3000');
  }
}

ipcMain.handle('salah:pick-music-folder', async () => {
  const res = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'اختر مجلد الموسيقى',
  });
  if (res.canceled || res.filePaths.length === 0) {
    return null;
  }
  const rootDir = res.filePaths[0];
  const files = [];

  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && AUDIO_EXTS.has(path.extname(entry.name).toLowerCase())) {
        try {
          const stat = fs.statSync(fullPath);
          files.push({
            path: fullPath,
            name: entry.name,
            folder: path.relative(rootDir, dir) || path.basename(rootDir),
            size: stat.size,
          });
        } catch {
          // Skip inaccessible file
        }
      }
    }
  }

  walk(rootDir);
  return { rootDir, files };
});

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
