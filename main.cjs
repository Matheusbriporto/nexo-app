const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Habilita logs básicos no terminal para ajudar a diagnosticar problemas de download/GitHub
autoUpdater.logger = console;

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    frame: false, // Remove a barra padrão do Windows
    transparent: true, // Permite que a Splash Screen fique flutuando
    backgroundColor: '#00000000',
    icon: path.join(__dirname, 'icon.ico'), // O seu ícone na barra de tarefas
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Em produção, ele carrega a pasta dist. 
  // (Caso teste localmente com npm start, use win.loadURL('http://localhost:5173'))
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  // Inicia a busca automática por atualizações assim que abre
  autoUpdater.checkForUpdatesAndNotify();

  // ==========================================
  // RADARES DE ATUALIZAÇÃO (Mandam msg pro App)
  // ==========================================
  autoUpdater.on('checking-for-update', () => {
    if (win) win.webContents.send('update-status', 'Procurando atualizações no servidor...');
  });

  autoUpdater.on('update-available', () => {
    if (win) win.webContents.send('update-status', 'Oba! Atualização encontrada. Baixando em segundo plano...');
  });

  autoUpdater.on('update-not-available', () => {
    if (win) win.webContents.send('update-status', 'Seu aplicativo já está na versão mais recente!');
  });

  autoUpdater.on('error', (err) => {
    if (win) win.webContents.send('update-status', 'Erro ao buscar update: ' + err.message);
  });

  // Gatilho final: Download terminou
  autoUpdater.on('update-downloaded', () => {
    if (win) win.webContents.send('update-ready');
  });
});

// ==========================================
// COMANDOS RECEBIDOS DO REACT (IPC)
// ==========================================

// Gatilho para a busca MANUAL de atualizações na engrenagem
ipcMain.on('check-for-updates-manual', () => {
  if (win) win.webContents.send('update-status', 'Buscando atualizações manualmente...');
  // Executa a rotina completa idêntica ao início do app
  autoUpdater.checkForUpdatesAndNotify();
});

// Recebe o comando do React para fechar e instalar
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Controles manuais da barra de título do Windows
ipcMain.on('window-minimize', () => {
  if (win) win.minimize();
});

ipcMain.on('window-maximize', () => {
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (win) win.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});