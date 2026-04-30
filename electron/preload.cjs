'use strict'
// Preload runs in a privileged context; keep it minimal.
// Expose only what the renderer actually needs via contextBridge.
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
})
