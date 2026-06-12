'use strict'

const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const http = require('http')
const fs   = require('fs')

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json',
}

// Serve dist as a local HTTP server so Firebase OAuth redirects work (file:// is rejected)
function startStaticServer(distPath) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url.split('?')[0]
      let filePath = path.join(distPath, urlPath === '/' ? 'app.html' : urlPath)
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, 'app.html')
      }
      const ext = path.extname(filePath).toLowerCase()
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
        res.end(data)
      })
    })
    server.listen(0, '127.0.0.1', () => resolve(server.address().port))
    server.on('error', reject)
  })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Simulador DB',
    backgroundColor: '#0d1117',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
  })

  win.once('ready-to-show', () => win.show())

  // Allow Firebase auth popups (Google Sign-In); open everything else in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('firebaseapp.com/__/auth') || url.includes('accounts.google.com')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 650,
          title: 'Iniciar sesión con Google',
          webPreferences: { contextIsolation: true, nodeIntegration: false },
        },
      }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    const port = await startStaticServer(path.join(__dirname, '../dist'))
    win.loadURL(`http://127.0.0.1:${port}`)
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
