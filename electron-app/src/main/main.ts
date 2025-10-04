import { app, BrowserWindow, Menu, ipcMain, shell, Tray, nativeImage, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createMenu, setMenuLanguage, translate as t } from './menu';
import terminalManager from './services/terminalManager';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let minimizeToTray = false;
let isQuitting = false; // 使用局部变量而不是 app.isQuitting

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
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 监听窗口关闭事件
  mainWindow.on('close', (event) => {
    if (minimizeToTray && !isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  return mainWindow;
}

/**
 * 创建系统托盘
 */
function createTray() {
  if (tray) return;

  // 创建托盘图标
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

  tray.setToolTip(t('trayTooltip'));

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('showMainWindow'),
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: t('exit'),
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * 销毁系统托盘
 */
function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
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

// ==================== 系统功能 IPC Handlers ====================

/**
 * 打开外部链接
 */
ipcMain.handle('open-external', async (_event, url: string) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error('[IPC] open-external 失败:', error);
    throw error;
  }
});

/**
 * 启用/禁用系统托盘
 */
ipcMain.on('enable-tray', (_event, enabled: boolean) => {
  console.log('[IPC] enable-tray:', enabled);
  minimizeToTray = enabled;

  if (enabled) {
    createTray();
  } else {
    destroyTray();
  }
});

/**
 * 设置菜单语言
 */
ipcMain.on('set-menu-language', (_event, language: 'zh' | 'en') => {
  console.log('[IPC] set-menu-language:', language);
  setMenuLanguage(language);
  Menu.setApplicationMenu(createMenu());

  // 如果托盘已创建，重新创建以更新语言
  if (tray) {
    destroyTray();
    createTray();
  }
});

// ==================== 文件操作 IPC Handlers ====================

/**
 * 打开文件夹选择对话框
 */
ipcMain.handle('select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: '选择工作目录',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, path: null };
    }

    return { canceled: false, path: result.filePaths[0] };
  } catch (error) {
    console.error('[IPC] select-directory 失败:', error);
    throw error;
  }
});

/**
 * 读取文件内容
 */
ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('[IPC] read-file 失败:', error);
    throw error;
  }
});

/**
 * 写入文件内容
 */
ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('[IPC] write-file 失败:', error);
    return false;
  }
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

    await terminalManager.createSession(options.sessionId, mainWindow, {
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