import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import { createMenu } from './menu';
import terminalManager from './services/terminalManager';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 不退出应用，只记录错误
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  createMainWindow();
  Menu.setApplicationMenu(createMenu());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for communication with renderer process
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Window controls
ipcMain.handle('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow?.close();
});

// ==================== 终端 IPC Handlers ====================

ipcMain.handle('terminal-create', async (_event, options: {
  sessionId: string;
  command?: string;
  cwd?: string;
  env?: Record<string, string>;
}) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    terminalManager.createSession(options.sessionId, mainWindow, {
      command: options.command,
      cwd: options.cwd,
      env: options.env,
    });

    return { success: true, sessionId: options.sessionId };
  } catch (error) {
    console.error('[IPC] terminal-create 失败:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('terminal-input', async (_event, data: { sessionId: string; input: string }) => {
  try {
    terminalManager.sendInput(data.sessionId, data.input);
    return { success: true };
  } catch (error) {
    console.error('[IPC] terminal-input 失败:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('terminal-kill', (_event, sessionId: string) => {
  terminalManager.killSession(sessionId);
  return { success: true };
});

/**
 * 调整终端大小
 */
ipcMain.handle('terminal-resize', (_event, data: { sessionId: string; cols: number; rows: number }) => {
  console.log('[IPC] terminal-resize:', data);
  terminalManager.resize(data.sessionId, data.cols, data.rows);
  return { success: true };
});

// 清理所有会话
app.on('before-quit', () => {
  console.log('[App] 退出前清理终端会话');
  terminalManager.cleanup();
});

export { mainWindow };