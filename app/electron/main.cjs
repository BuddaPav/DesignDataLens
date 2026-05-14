'use strict';

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

/** Режим разработки: Vite на 127.0.0.1:5173 (см. npm run desktop) */
const isViteDev = process.env.CHRONOS_DESKTOP_DEV === '1';

function distIndexPath() {
  return path.join(__dirname, '..', 'dist', 'index.html');
}

function focusMainWindow() {
  const wins = BrowserWindow.getAllWindows();
  const win = wins[0];
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#05070d',
    title: 'Chronos: AI Chronicles',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
    autoHideMenuBar: true,
  });

  win.once('ready-to-show', () => win.show());

  win.on('minimize', () => win.webContents.send('chronos-occlusion', { occluded: true }));
  win.on('restore', () => win.webContents.send('chronos-occlusion', { occluded: false }));

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isViteDev) {
    void win.loadURL('http://127.0.0.1:5173/');
    win.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  const indexHtml = distIndexPath();
  if (!fs.existsSync(indexHtml)) {
    void win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          '<h1>Chronos Desktop</h1><p>Сначала выполните в папке <code>app</code>: <code>npm run build</code>, затем снова запустите exe.</p>'
        )
    );
    return;
  }

  void win.loadFile(indexHtml);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  ipcMain.handle('chronos-write-crash-log', (_e, text) => {
    try {
      const p = path.join(app.getPath('temp'), 'chronos-crash.log');
      const MAX_FILE = 512 * 1024;
      const MAX_CHUNK = 12000;
      let body = typeof text === 'string' ? text : String(text);
      if (Buffer.byteLength(body, 'utf8') > MAX_CHUNK) {
        body = body.slice(0, MAX_CHUNK) + '\n...[truncated]\n';
      }
      const chunk = `[${new Date().toISOString()}] ${body}\n`;
      if (fs.existsSync(p) && fs.statSync(p).size > MAX_FILE) {
        try {
          fs.unlinkSync(p);
        } catch {
          /* ignore */
        }
      }
      fs.appendFileSync(p, chunk, 'utf8');
      return true;
    } catch {
      return false;
    }
  });

  app.on('second-instance', () => {
    focusMainWindow();
  });

  app.whenReady().then(() => {
    app.setName?.('Chronos: AI Chronicles');
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
