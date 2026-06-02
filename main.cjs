const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
// Importa o sistema de auto-update
const { autoUpdater } = require('electron-updater')

function createWindow () {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile(path.join(__dirname, 'dist', 'index.html'))

  // Escutadores para os botões estilo macOS
  ipcMain.on('window-minimize', () => win.minimize());
  ipcMain.on('window-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.on('window-close', () => win.close());

  // AUTO-UPDATER: Avisa o React que a nova versão já foi baixada no fundo
  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('update-ready');
  });
}

app.whenReady().then(() => {
  createWindow()
  
  // Assim que o app abre, ele vai na nuvem checar se tem versão nova
  autoUpdater.checkForUpdatesAndNotify()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// AUTO-UPDATER: Escuta o React mandar instalar a atualização
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall()
})