'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('chronosDesktop', {
  preload: true,
  onOcclusionChanged: (cb) => {
    const listener = (_e, payload) => {
      if (typeof cb === 'function') cb(payload);
    };
    ipcRenderer.on('chronos-occlusion', listener);
    return () => ipcRenderer.removeListener('chronos-occlusion', listener);
  },
  writeCrashLog: (text) => ipcRenderer.invoke('chronos-write-crash-log', text),
});
