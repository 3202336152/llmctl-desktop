import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import log from 'electron-log';

// 配置日志
autoUpdater.logger = log;
(autoUpdater.logger as typeof log).transports.file.level = 'info';

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  /**
   * 配置自动更新器
   */
  private setupAutoUpdater() {
    // 设置为手动检查更新(避免应用启动时自动检查)
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // 监听更新事件
    autoUpdater.on('checking-for-update', () => {
      log.info('[AutoUpdater] 正在检查更新...');
      this.sendStatusToWindow('正在检查更新...');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('[AutoUpdater] 发现新版本:', info.version);
      this.sendStatusToWindow(`发现新版本 ${info.version}`);

      // 询问用户是否下载
      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: '发现新版本',
        message: `检测到新版本 ${info.version},是否立即下载?`,
        detail: `当前版本: ${autoUpdater.currentVersion.version}\n新版本: ${info.version}`,
        buttons: ['立即下载', '稍后提醒'],
        defaultId: 0,
        cancelId: 1,
      }).then(result => {
        if (result.response === 0) {
          // 开始下载
          autoUpdater.downloadUpdate();
        }
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('[AutoUpdater] 已是最新版本:', info.version);
      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: '检查更新',
        message: '您已经是最新版本!',
        detail: `当前版本: ${info.version}`,
        buttons: ['确定'],
      });
    });

    autoUpdater.on('error', (err) => {
      log.error('[AutoUpdater] 更新错误:', err);
      dialog.showMessageBox(this.mainWindow!, {
        type: 'error',
        title: '更新失败',
        message: '检查更新时发生错误',
        detail: err.message,
        buttons: ['确定'],
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      log.info(`[AutoUpdater] 下载进度: ${percent}%`);
      this.sendStatusToWindow(`正在下载更新: ${percent}%`);

      // 发送下载进度到渲染进程
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('download-progress', percent);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('[AutoUpdater] 更新下载完成:', info.version);

      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: '更新已就绪',
        message: `新版本 ${info.version} 已下载完成`,
        detail: '点击"立即重启"安装更新并重启应用',
        buttons: ['立即重启', '稍后重启'],
        defaultId: 0,
        cancelId: 1,
      }).then(result => {
        if (result.response === 0) {
          // 立即退出并安装更新
          autoUpdater.quitAndInstall(false, true);
        }
      });
    });
  }

  /**
   * 检查更新(手动触发)
   */
  public checkForUpdates() {
    log.info('[AutoUpdater] 手动检查更新');
    autoUpdater.checkForUpdates();
  }

  /**
   * 向渲染进程发送状态消息
   */
  private sendStatusToWindow(message: string) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', message);
    }
  }
}

export default AutoUpdater;
