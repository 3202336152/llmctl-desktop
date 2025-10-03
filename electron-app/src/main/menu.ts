import { Menu, MenuItemConstructorOptions, app, shell, BrowserWindow, dialog } from 'electron';

export function createMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入配置',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            const result = await dialog.showOpenDialog(win, {
              title: '导入配置文件',
              filters: [
                { name: 'JSON配置文件', extensions: ['json'] },
                { name: '所有文件', extensions: ['*'] }
              ],
              properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
              // 发送消息到渲染进程处理导入
              win.webContents.send('import-config', result.filePaths[0]);
            }
          }
        },
        {
          label: '导出配置',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            const result = await dialog.showSaveDialog(win, {
              title: '导出配置文件',
              defaultPath: 'llmctl-config.json',
              filters: [
                { name: 'JSON配置文件', extensions: ['json'] },
                { name: '所有文件', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePath) {
              // 发送消息到渲染进程处理导出
              win.webContents.send('export-config', result.filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '会话',
      submenu: [
        {
          label: '启动新会话',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            win.webContents.send('new-session');
          }
        },
        {
          label: '查看所有会话',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            win.webContents.executeJavaScript(`
              window.location.hash = '#/sessions';
            `);
          }
        },
        { type: 'separator' },
        {
          label: '终止所有会话',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            dialog.showMessageBox(win, {
              type: 'warning',
              title: '确认操作',
              message: '确定要终止所有活跃会话吗？',
              detail: '此操作将终止所有正在运行的会话，无法恢复。',
              buttons: ['取消', '确定终止'],
              defaultId: 0,
              cancelId: 0
            }).then(result => {
              if (result.response === 1) {
                win.webContents.send('terminate-all-sessions');
              }
            });
          }
        }
      ]
    },
    {
      label: '导航',
      submenu: [
        {
          label: 'Provider管理',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            win.webContents.executeJavaScript(`
              window.location.hash = '#/providers';
            `);
          }
        },
        {
          label: 'Token管理',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            win.webContents.executeJavaScript(`
              window.location.hash = '#/tokens';
            `);
          }
        },
        {
          label: '会话管理',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            win.webContents.executeJavaScript(`
              window.location.hash = '#/sessions';
            `);
          }
        },
        {
          label: '统计信息',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            win.webContents.executeJavaScript(`
              window.location.hash = '#/statistics';
            `);
          }
        },
        { type: 'separator' },
        {
          label: '系统设置',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            win.webContents.executeJavaScript(`
              window.location.hash = '#/settings';
            `);
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '使用文档',
          click: () => {
            shell.openExternal('https://github.com/your-repo/llmctl/wiki');
          }
        },
        {
          label: '项目主页',
          click: () => {
            shell.openExternal('https://github.com/your-repo/llmctl');
          }
        },
        {
          label: '报告问题',
          click: () => {
            shell.openExternal('https://github.com/your-repo/llmctl/issues');
          }
        },
        { type: 'separator' },
        {
          label: '关于 LLMctl',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            dialog.showMessageBox(win, {
              type: 'info',
              title: '关于 LLMctl',
              message: 'LLMctl - LLM控制系统',
              detail: `版本: ${app.getVersion()}\n\n基于 Electron + Spring Boot 构建的桌面应用程序\n用于管理多个 LLM Provider、Token 和会话。\n\n© 2025 LLMctl Team`,
              buttons: ['确定']
            });
          }
        },
        {
          label: '检查更新',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            dialog.showMessageBox(win, {
              type: 'info',
              title: '检查更新',
              message: '当前已是最新版本',
              detail: `版本: ${app.getVersion()}`,
              buttons: ['确定']
            });
          }
        }
      ]
    }
  ];

  // macOS 特殊处理
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: '关于 LLMctl' },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏 LLMctl' },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '显示全部' },
        { type: 'separator' },
        { role: 'quit', label: '退出 LLMctl' }
      ]
    });
  }

  return Menu.buildFromTemplate(template);
}