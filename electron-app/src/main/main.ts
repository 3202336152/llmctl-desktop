import { app, BrowserWindow, Menu, ipcMain, shell, Tray, nativeImage, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import axios from 'axios';
import log from 'electron-log';
import { createMenu, setMenuLanguage, setAuthenticationStatus, translate as t } from './menu';
import terminalManager from './services/terminalManager';
import AutoUpdater from './services/autoUpdater';

// ========== electron-log 配置 ==========
// 日志文件路径（根据操作系统不同）:
// - Windows: %USERPROFILE%\AppData\Roaming\llmctl-desktop\logs\main.log
// - macOS: ~/Library/Logs/llmctl-desktop/main.log
// - Linux: ~/.config/llmctl-desktop/logs/main.log

// 多级日志策略
const isDev = process.env.NODE_ENV === 'development';
const isDebugMode = process.argv.includes('--debug-logs');

if (isDev) {
  // 开发环境：完整的 DEBUG 日志
  log.transports.file.level = 'debug';
  log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
  log.transports.console.level = 'debug';
} else if (isDebugMode) {
  // 生产环境（调试模式）：INFO 日志
  log.transports.file.level = 'info';
  log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
  log.transports.console.level = 'info';
} else {
  // 生产环境（普通模式）：仅 ERROR 日志
  log.transports.file.level = 'error';
  log.transports.file.maxSize = 1 * 1024 * 1024; // 1MB
  log.transports.console.level = 'warn';
}

// 自定义日志格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';

log.info('========================================');
log.info('LLMctl Desktop 启动');
log.info('应用版本:', app.getVersion());
log.info('Electron 版本:', process.versions.electron);
log.info('Node 版本:', process.versions.node);
log.info('操作系统:', process.platform, process.arch);
log.info('运行环境:', isDev ? '开发模式' : (isDebugMode ? '生产模式（调试）' : '生产模式'));
log.info('日志级别:', log.transports.file.level);
log.info('日志文件路径:', log.transports.file.getFile().path);
log.info('========================================');

// =========================================

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let minimizeToTray = false;
let isQuitting = false; // 使用局部变量而不是 app.isQuitting
let updater: AutoUpdater | null = null;

// 获取图标路径（兼容开发和生产环境）
const getIconPath = (): string => {
  return 'http://117.72.200.2/downloads/llmctl/icon.png';
};

// 获取远程图标URL（备用方案）
const getRemoteIconUrl = (): string => {
  return 'http://117.72.200.2/downloads/llmctl/icon.png';
};

// 加载托盘图标（支持本地和远程）
async function loadTrayIcon(): Promise<Electron.NativeImage> {
  const iconPath = getIconPath();

  try {
    // 首先尝试加载本地图标
    if (fs.existsSync(iconPath)) {
      console.log('[Icon] 成功加载本地图标:', iconPath);
      return nativeImage.createFromPath(iconPath);
    }
  } catch (error) {
    console.warn('[Icon] 加载本地图标失败:', error);
  }

  // 如果本地图标不可用，尝试下载远程图标
  try {
    console.log('[Icon] 尝试加载远程图标');
    const response = await axios.get(getRemoteIconUrl(), {
      responseType: 'arraybuffer',
      timeout: 5000
    });

    const buffer = Buffer.from(response.data);
    const image = nativeImage.createFromBuffer(buffer);

    if (image && !image.isEmpty()) {
      console.log('[Icon] 成功加载远程图标');
      return image;
    }
  } catch (error) {
    console.warn('[Icon] 加载远程图标失败:', error);
  }

  // 如果都失败了，创建一个默认图标
  console.warn('[Icon] 使用默认图标');
  return createDefaultIcon();
}

// 创建默认图标（使用 base64 编码的简单图标）
function createDefaultIcon(): Electron.NativeImage {
  // 创建一个简单的 16x16 蓝色圆形图标的 base64 数据
  const defaultIconData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafgwQSCxsLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG11sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLwcJCG1sLL';

  try {
    return nativeImage.createFromDataURL(defaultIconData);
  } catch (error) {
    console.warn('[Icon] 创建默认图标失败:', error);
    // 最后的备选方案：创建一个空的图标
    return nativeImage.createEmpty();
  }
}

// 获取 API Base URL（支持环境变量配置）
const getApiBaseUrl = (): string => {
  return process.env.LLMCTL_API_BASE_URL || 'http://localhost:8080/llmctl';
};

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
    icon: getIconPath(),
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
async function createTray() {
  if (tray) return;

  try {
    // 异步加载托盘图标
    const trayIcon = await loadTrayIcon();
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
          // 不要在这里设置 isQuitting，让 before-quit 处理器统一处理
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

    console.log('[Tray] 系统托盘创建成功');
  } catch (error) {
    console.error('[Tray] 创建系统托盘失败:', error);
  }
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

  // ✅ 初始化自动更新器 (仅在生产环境)
  if (mainWindow && !isDev) {
    updater = new AutoUpdater(mainWindow);
    console.log('[App] 自动更新器已初始化');
  }

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

// ==================== 日志 IPC Handlers ====================

/**
 * 渲染进程日志 - Info
 */
ipcMain.on('log-info', (_event, args: any[]) => {
  log.info('[Renderer]', ...args);
});

/**
 * 渲染进程日志 - Warn
 */
ipcMain.on('log-warn', (_event, args: any[]) => {
  log.warn('[Renderer]', ...args);
});

/**
 * 渲染进程日志 - Error
 */
ipcMain.on('log-error', (_event, args: any[]) => {
  log.error('[Renderer]', ...args);
});

/**
 * 渲染进程日志 - Debug
 */
ipcMain.on('log-debug', (_event, args: any[]) => {
  log.debug('[Renderer]', ...args);
});

/**
 * 获取日志文件路径
 */
ipcMain.handle('get-log-path', () => {
  return log.transports.file.getFile().path;
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
 * 在文件管理器中打开路径
 */
ipcMain.handle('open-path', async (_event, path: string) => {
  try {
    await shell.openPath(path);
  } catch (error) {
    console.error('[IPC] open-path 失败:', error);
    throw error;
  }
});

/**
 * 检查更新 (手动触发)
 */
ipcMain.handle('check-for-updates', async () => {
  console.log('[IPC] check-for-updates: 手动检查更新');

  if (isDev) {
    return { success: false, message: '开发模式不支持自动更新' };
  }

  if (updater) {
    updater.checkForUpdates();
    return { success: true };
  } else {
    return { success: false, message: '自动更新器未初始化' };
  }
});

/**
 * 启用/禁用系统托盘
 */
ipcMain.on('enable-tray', async (_event, enabled: boolean) => {
  console.log('[IPC] enable-tray:', enabled);
  minimizeToTray = enabled;

  if (enabled) {
    await createTray();
  } else {
    destroyTray();
  }
});

/**
 * 设置菜单语言
 */
ipcMain.on('set-menu-language', async (_event, language: 'zh' | 'en') => {
  console.log('[IPC] set-menu-language:', language);
  setMenuLanguage(language);
  Menu.setApplicationMenu(createMenu());

  // 如果托盘已创建，重新创建以更新语言
  if (tray) {
    destroyTray();
    await createTray();
  }
});

/**
 * 设置登录状态
 */
ipcMain.on('set-auth-status', (_event, authenticated: boolean) => {
  console.log('[IPC] set-auth-status:', authenticated);
  setAuthenticationStatus(authenticated);
  Menu.setApplicationMenu(createMenu());
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
  log.info('[IPC] ========== 文件写入请求 ==========');
  log.info('[IPC] 目标路径:', filePath);
  log.info('[IPC] 内容大小:', content.length, '字节');
  log.info('[IPC] 操作系统:', process.platform);
  log.info('[IPC] Node 版本:', process.version);

  try {
    // ✅ 解析路径
    const dirPath = path.dirname(filePath);
    const fileName = path.basename(filePath);
    log.info('[IPC] 父目录:', dirPath);
    log.info('[IPC] 文件名:', fileName);
    log.info('[IPC] 绝对路径:', path.resolve(filePath));

    // ✅ 检查父目录是否存在
    try {
      await fs.promises.access(dirPath);
      log.info('[IPC] ✅ 父目录已存在');
    } catch {
      log.info('[IPC] ⚠️ 父目录不存在，开始创建...');
      await fs.promises.mkdir(dirPath, { recursive: true });
      log.info('[IPC] ✅ 父目录创建成功');
    }

    // ✅ 写入文件
    log.info('[IPC] 💾 开始写入文件...');
    await fs.promises.writeFile(filePath, content, 'utf-8');
    log.info('[IPC] ✅ 文件写入成功');

    // ✅ 验证写入结果
    const stats = await fs.promises.stat(filePath);
    log.info('[IPC] 验证: 文件大小', stats.size, '字节');
    log.info('[IPC] 验证: 文件权限', stats.mode.toString(8));
    log.info('[IPC] =========================================');

    return true;
  } catch (error) {
    log.error('[IPC] ❌ ========== 文件写入失败 ==========');
    log.error('[IPC] 目标路径:', filePath);
    log.error('[IPC] 错误类型:', error instanceof Error ? error.constructor.name : typeof error);
    log.error('[IPC] 错误消息:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      log.error('[IPC] 错误堆栈:', error.stack);
    }
    log.error('[IPC] =========================================');
    return false;
  }
});

/**
 * 删除目录（递归删除）
 */
ipcMain.handle('delete-directory', async (_event, dirPath: string) => {
  try {
    console.log('[IPC] delete-directory:', dirPath);
    await fs.promises.rm(dirPath, { recursive: true, force: true });
    console.log('[IPC] ✅ 目录删除成功:', dirPath);
    return { success: true };
  } catch (error) {
    console.error('[IPC] delete-directory 失败:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * 移动目录（重命名/移动）
 */
ipcMain.handle('move-directory', async (_event, sourcePath: string, destPath: string) => {
  try {
    console.log('[IPC] move-directory:', sourcePath, '->', destPath);
    // 确保目标目录的父目录存在
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    // 移动目录
    await fs.promises.rename(sourcePath, destPath);
    console.log('[IPC] ✅ 目录移动成功:', sourcePath, '->', destPath);
    return { success: true };
  } catch (error) {
    console.error('[IPC] move-directory 失败:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * 获取目录大小（递归计算）
 */
ipcMain.handle('get-directory-size', async (_event, dirPath: string) => {
  try {
    console.log('[IPC] get-directory-size:', dirPath);

    const getSize = async (dir: string): Promise<number> => {
      let totalSize = 0;
      try {
        const items = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const item of items) {
          const itemPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            totalSize += await getSize(itemPath);
          } else {
            const stat = await fs.promises.stat(itemPath);
            totalSize += stat.size;
          }
        }
      } catch (error) {
        console.warn('[IPC] 读取目录失败:', dir, error);
      }
      return totalSize;
    };

    const size = await getSize(dirPath);
    console.log('[IPC] ✅ 目录大小:', size, '字节');
    return { success: true, size };
  } catch (error) {
    console.error('[IPC] get-directory-size 失败:', error);
    return { success: false, size: 0, error: (error as Error).message };
  }
});

/**
 * 列出归档的会话
 */
ipcMain.handle('list-archives', async (_event, workingDirectory: string) => {
  try {
    console.log('[IPC] list-archives:', workingDirectory);

    const archivesDir = path.join(workingDirectory, '.codex-sessions', 'archived');

    // 检查归档目录是否存在
    try {
      await fs.promises.access(archivesDir);
    } catch {
      console.log('[IPC] 归档目录不存在:', archivesDir);
      return { success: true, archives: [] };
    }

    const archives: Array<{ sessionId: string; archivedAt: number; size: number }> = [];
    const items = await fs.promises.readdir(archivesDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const archivePath = path.join(archivesDir, item.name);
        const stat = await fs.promises.stat(archivePath);

        // 递归计算目录大小
        const getSize = async (dir: string): Promise<number> => {
          let totalSize = 0;
          try {
            const subItems = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const subItem of subItems) {
              const subPath = path.join(dir, subItem.name);
              if (subItem.isDirectory()) {
                totalSize += await getSize(subPath);
              } else {
                const subStat = await fs.promises.stat(subPath);
                totalSize += subStat.size;
              }
            }
          } catch (error) {
            console.warn('[IPC] 计算目录大小失败:', dir, error);
          }
          return totalSize;
        };

        const size = await getSize(archivePath);

        archives.push({
          sessionId: item.name,
          archivedAt: stat.mtimeMs,
          size,
        });
      }
    }

    console.log('[IPC] ✅ 找到', archives.length, '个归档会话');
    return { success: true, archives };
  } catch (error) {
    console.error('[IPC] list-archives 失败:', error);
    return { success: false, archives: [], error: (error as Error).message };
  }
});

/**
 * 清理归档（按天数筛选，days=0表示清理所有）
 */
ipcMain.handle('clean-archives', async (_event, workingDirectory: string, days: number) => {
  try {
    console.log('[IPC] clean-archives:', workingDirectory, 'days:', days);

    const archivesDir = path.join(workingDirectory, '.codex-sessions', 'archived');

    // 检查归档目录是否存在
    try {
      await fs.promises.access(archivesDir);
    } catch {
      console.log('[IPC] 归档目录不存在:', archivesDir);
      return { success: true, deletedCount: 0 };
    }

    const now = Date.now();
    const cutoffTime = days === 0 ? Infinity : now - days * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    const items = await fs.promises.readdir(archivesDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const archivePath = path.join(archivesDir, item.name);
        const stat = await fs.promises.stat(archivePath);

        // days=0 表示清理所有，或者归档时间早于截止时间
        if (days === 0 || stat.mtimeMs < cutoffTime) {
          try {
            await fs.promises.rm(archivePath, { recursive: true, force: true });
            deletedCount++;
            console.log('[IPC] ✅ 已删除归档:', item.name);
          } catch (error) {
            console.warn('[IPC] 删除归档失败:', item.name, error);
          }
        }
      }
    }

    console.log('[IPC] ✅ 清理完成，共删除', deletedCount, '个归档');
    return { success: true, deletedCount };
  } catch (error) {
    console.error('[IPC] clean-archives 失败:', error);
    return { success: false, deletedCount: 0, error: (error as Error).message };
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

/**
 * 打开外部终端
 */
ipcMain.handle('open-external-terminal', async (_event, options: { workingDirectory: string; command: string; env?: Record<string, string> }) => {
  try {
    console.log('[IPC] open-external-terminal:', options);

    // Windows: 使用 cmd.exe 打开新窗口
    if (process.platform === 'win32') {
      // ✅ Codex 配置文件创建逻辑（在打开终端之前，直接用 Node.js 创建文件）
      if (options.env && options.env.CODEX_HOME && (options.env.CODEX_CONFIG_TOML || options.env.CODEX_AUTH_JSON)) {
        console.log('[IPC] 检测到 Codex 配置，开始创建配置文件');

        try {
          const codexDir = options.env.CODEX_HOME;

          // 创建配置目录
          if (!fs.existsSync(codexDir)) {
            fs.mkdirSync(codexDir, { recursive: true });
            console.log('[IPC] ✅ 创建 Codex 配置目录:', codexDir);
          }

          // 写入 config.toml
          if (options.env.CODEX_CONFIG_TOML) {
            const configPath = path.join(codexDir, 'config.toml');
            fs.writeFileSync(configPath, options.env.CODEX_CONFIG_TOML, 'utf-8');
            console.log('[IPC] ✅ 写入 config.toml:', configPath);
          }

          // 写入 auth.json（并替换 OPENAI_API_KEY）
          if (options.env.CODEX_AUTH_JSON) {
            const authPath = path.join(codexDir, 'auth.json');

            // 替换 auth.json 中的 OPENAI_API_KEY
            let authContent = options.env.CODEX_AUTH_JSON;
            if (options.env.CODEX_API_KEY) {
              try {
                const authObj = JSON.parse(authContent);
                if ('OPENAI_API_KEY' in authObj) {
                  authObj.OPENAI_API_KEY = options.env.CODEX_API_KEY;
                  authContent = JSON.stringify(authObj, null, 2);
                  console.log('[IPC] 已将 auth.json 中的 OPENAI_API_KEY 替换为实际 Token');
                }
              } catch (parseError) {
                console.error('[IPC] 解析 auth.json 失败，使用原始内容:', parseError);
              }
            }

            fs.writeFileSync(authPath, authContent, 'utf-8');
            console.log('[IPC] ✅ 写入 auth.json:', authPath);
          }

          // ✅ 修复：配置文件创建完成后，从环境变量中删除文件内容
          // 这样可以确保批处理文件不会包含多行内容，避免语法错误
          delete options.env.CODEX_CONFIG_TOML;
          delete options.env.CODEX_AUTH_JSON;
          delete options.env.CODEX_API_KEY; // API Key 也不需要在批处理中设置
          console.log('[IPC] ✅ Codex 配置文件创建成功，已清理环境变量');
        } catch (error) {
          console.error('[IPC] ❌ 创建 Codex 配置文件失败:', error);
          return { success: false, error: `创建 Codex 配置文件失败: ${error}` };
        }
      }

      // ✅ 使用临时批处理文件的方式设置环境变量（更可靠）
      // 创建临时批处理文件路径
      const tempDir = path.join(options.workingDirectory, '.llmctl-temp');
      const batchFile = path.join(tempDir, `launch-${Date.now()}.bat`);

      try {
        // 确保临时目录存在
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // 构建批处理文件内容
        let batchContent = '@echo off\n';
        batchContent += `chcp 65001 >nul\n`; // 设置 UTF-8 编码
        batchContent += `cd /d "${options.workingDirectory}"\n`; // 切换到工作目录

        // 添加环境变量设置
        if (options.env && Object.keys(options.env).length > 0) {
          console.log('[IPC] 设置环境变量:', options.env);
          for (const [key, value] of Object.entries(options.env)) {
            // 跳过已处理的 Codex 配置变量和 CHCP
            if (key === 'CHCP' || key === 'CODEX_CONFIG_TOML' || key === 'CODEX_AUTH_JSON' || key === 'CODEX_API_KEY') {
              continue;
            }
            // 不需要转义，直接写入批处理文件
            batchContent += `set ${key}=${value}\n`;
          }
        }

        // 添加最终命令
        batchContent += `${options.command}\n`;

        // 写入批处理文件
        fs.writeFileSync(batchFile, batchContent, { encoding: 'utf-8' });
        console.log('[IPC] 已创建临时批处理文件:', batchFile);

        // 使用 start 命令打开新的 CMD 窗口并执行批处理文件
        const command = `start "LLMctl Terminal" cmd /K "${batchFile}"`;

        child_process.exec(command, (error) => {
          if (error) {
            console.error('[IPC] 打开外部终端失败:', error);
            // 清理批处理文件和临时目录
            try {
              // 删除批处理文件
              if (fs.existsSync(batchFile)) {
                fs.unlinkSync(batchFile);
              }

              // ✅ 检查临时目录是否为空，如果为空则删除
              if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                if (files.length === 0) {
                  fs.rmSync(tempDir, { recursive: true, force: true });
                  console.log('[IPC] 已清理临时目录（失败情况）');
                }
              }
            } catch (e) {
              // 忽略删除错误
            }
          } else {
            console.log('[IPC] ✅ 外部终端已成功打开（已设置环境变量并创建 Codex 配置文件）');
            // 延迟删除批处理文件（给终端一些时间启动）
            setTimeout(() => {
              try {
                // 删除批处理文件
                if (fs.existsSync(batchFile)) {
                  fs.unlinkSync(batchFile);
                  console.log('[IPC] 已清理临时批处理文件');
                }

                // ✅ 检查临时目录是否为空，如果为空则删除
                if (fs.existsSync(tempDir)) {
                  const files = fs.readdirSync(tempDir);
                  if (files.length === 0) {
                    fs.rmdirSync(tempDir);
                    console.log('[IPC] 已清理临时目录:', tempDir);
                  }
                }
              } catch (e) {
                // 忽略删除错误
              }
            }, 5000); // 5秒后删除
          }
        });

        console.log('[IPC] 正在打开外部终端...');
        return { success: true };
      } catch (err) {
        console.error('[IPC] 创建批处理文件失败:', err);
        return { success: false, error: (err as Error).message };
      }
    }
    // macOS: 使用 Terminal.app
    else if (process.platform === 'darwin') {
      // ✅ 构建环境变量设置命令
      let envSetupCommands = '';
      if (options.env && Object.keys(options.env).length > 0) {
        console.log('[IPC] 设置环境变量:', options.env);
        for (const [key, value] of Object.entries(options.env)) {
          if (key === 'CHCP') continue;
          // ✅ 修复：为 bash 命令正确转义单引号
          const escapedValue = value.replace(/'/g, "'\\''");
          envSetupCommands += `export ${key}='${escapedValue}'; `;
        }
      }

      // ✅ 修复：为 AppleScript 字符串转义双引号和反斜杠
      const workingDirEscaped = options.workingDirectory.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const envCommandsEscaped = envSetupCommands.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const commandEscaped = options.command.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      const script = `
        tell application "Terminal"
          do script "cd \\"${workingDirEscaped}\\" && ${envCommandsEscaped}${commandEscaped}"
          activate
        end tell
      `;
      child_process.exec(`osascript -e '${script}'`, (error) => {
        if (error) {
          console.error('[IPC] 打开外部终端失败:', error);
        } else {
          console.log('[IPC] ✅ 外部终端已成功打开 (macOS，已设置环境变量)');
        }
      });

      console.log('[IPC] 正在打开外部终端 (macOS)...');
      return { success: true };
    }
    // Linux: 使用 gnome-terminal 或其他终端
    else {
      // ✅ 构建环境变量设置命令
      let envSetupCommands = '';
      if (options.env && Object.keys(options.env).length > 0) {
        console.log('[IPC] 设置环境变量:', options.env);
        for (const [key, value] of Object.entries(options.env)) {
          if (key === 'CHCP') continue;
          // ✅ 为 bash 命令正确转义单引号
          const escapedValue = value.replace(/'/g, "'\\''");
          envSetupCommands += `export ${key}='${escapedValue}'; `;
        }
      }

      // ✅ 修复：为 bash -c 参数中的双引号转义
      const workingDirEscaped = options.workingDirectory.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const commandEscaped = options.command.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      const command = `gnome-terminal --working-directory="${workingDirEscaped}" -- bash -c "${envSetupCommands}${commandEscaped}; exec bash"`;

      child_process.exec(command, (error) => {
        if (error) {
          console.error('[IPC] 打开外部终端失败:', error);
        } else {
          console.log('[IPC] ✅ 外部终端已成功打开 (Linux，已设置环境变量)');
        }
      });

      console.log('[IPC] 正在打开外部终端 (Linux)...');
      return { success: true };
    }
  } catch (error) {
    console.error('[IPC] open-external-terminal 失败:', error);
    return { success: false, error: (error as Error).message };
  }
});

// 清理所有会话
app.on('before-quit', async (event) => {
  // 如果已经处理过了，直接返回（避免重复处理）
  if (isQuitting) {
    return;
  }

  // 阻止默认退出行为，等待异步操作完成
  event.preventDefault();

  console.log('[App] 退出前清理终端会话');

  // 通知后端：将所有活跃会话设置为非活跃状态
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.post(`${apiBaseUrl}/sessions/deactivate-all`, null, {
      timeout: 3000, // 3秒超时，避免阻塞退出
    });

    if (response.data?.code === 200) {
      const count = response.data.data || 0;
      console.log(`[App] 成功停用 ${count} 个活跃会话`);
    } else {
      console.warn('[App] 停用会话失败:', response.data?.message);
    }
  } catch (error) {
    // 后端可能未启动或网络异常，不影响应用退出
    console.warn('[App] 无法连接后端服务，跳过会话状态更新:', (error as Error).message);
  }

  // 清理所有终端进程
  terminalManager.cleanup();

  // 标记为已处理，允许退出
  isQuitting = true;

  // 手动退出应用
  app.quit();
});

export { mainWindow };