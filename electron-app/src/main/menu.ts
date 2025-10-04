import { Menu, MenuItemConstructorOptions, app, shell, BrowserWindow, dialog } from 'electron';

// 菜单翻译
const menuTranslations = {
  zh: {
    file: '文件',
    importConfig: '导入配置',
    exportConfig: '导出配置',
    exit: '退出',
    session: '会话',
    startNewSession: '启动新会话',
    viewAllSessions: '查看所有会话',
    terminateAllSessions: '终止所有会话',
    confirmOperation: '确认操作',
    terminateAllConfirm: '确定要终止所有活跃会话吗？',
    terminateAllDesc: '此操作将终止所有正在运行的会话，无法恢复。',
    cancel: '取消',
    confirmTerminate: '确定终止',
    navigation: '导航',
    providerManagement: 'Provider管理',
    tokenManagement: 'Token管理',
    sessionManagement: '会话管理',
    statistics: '统计信息',
    systemSettings: '系统设置',
    view: '视图',
    reload: '重新加载',
    forceReload: '强制重新加载',
    actualSize: '实际大小',
    zoomIn: '放大',
    zoomOut: '缩小',
    fullscreen: '全屏',
    developerTools: '开发者工具',
    help: '帮助',
    documentation: '使用文档',
    projectHome: '项目主页',
    reportIssue: '报告问题',
    aboutLlmctl: '关于 LLMctl',
    aboutTitle: '关于 LLMctl',
    aboutMessage: 'LLMctl - LLM控制系统',
    aboutDetail: '版本: {{version}}\n\n基于 Electron + Spring Boot 构建的桌面应用程序\n用于管理多个 LLM Provider、Token 和会话。\n\n© 2025 LLMctl Team',
    ok: '确定',
    checkUpdate: '检查更新',
    updateTitle: '检查更新',
    updateMessage: '当前已是最新版本',
    updateDetail: '版本: {{version}}',
    jsonConfigFile: 'JSON配置文件',
    allFiles: '所有文件',
    services: '服务',
    hideLlmctl: '隐藏 LLMctl',
    hideOthers: '隐藏其他',
    unhide: '显示全部',
    showMainWindow: '显示主窗口',
    trayTooltip: 'LLMctl - LLM 控制系统',
  },
  en: {
    file: 'File',
    importConfig: 'Import Config',
    exportConfig: 'Export Config',
    exit: 'Exit',
    session: 'Session',
    startNewSession: 'Start New Session',
    viewAllSessions: 'View All Sessions',
    terminateAllSessions: 'Terminate All Sessions',
    confirmOperation: 'Confirm Operation',
    terminateAllConfirm: 'Are you sure you want to terminate all active sessions?',
    terminateAllDesc: 'This action will terminate all running sessions and cannot be undone.',
    cancel: 'Cancel',
    confirmTerminate: 'Confirm Terminate',
    navigation: 'Navigation',
    providerManagement: 'Provider Management',
    tokenManagement: 'Token Management',
    sessionManagement: 'Session Management',
    statistics: 'Statistics',
    systemSettings: 'System Settings',
    view: 'View',
    reload: 'Reload',
    forceReload: 'Force Reload',
    actualSize: 'Actual Size',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fullscreen: 'Fullscreen',
    developerTools: 'Developer Tools',
    help: 'Help',
    documentation: 'Documentation',
    projectHome: 'Project Home',
    reportIssue: 'Report Issue',
    aboutLlmctl: 'About LLMctl',
    aboutTitle: 'About LLMctl',
    aboutMessage: 'LLMctl - LLM Control System',
    aboutDetail: 'Version: {{version}}\n\nDesktop application built with Electron + Spring Boot\nFor managing multiple LLM Providers, Tokens and Sessions.\n\n© 2025 LLMctl Team',
    ok: 'OK',
    checkUpdate: 'Check Update',
    updateTitle: 'Check Update',
    updateMessage: 'You are using the latest version',
    updateDetail: 'Version: {{version}}',
    jsonConfigFile: 'JSON Config File',
    allFiles: 'All Files',
    services: 'Services',
    hideLlmctl: 'Hide LLMctl',
    hideOthers: 'Hide Others',
    unhide: 'Show All',
    showMainWindow: 'Show Main Window',
    trayTooltip: 'LLMctl - LLM Control System',
  }
};

let currentLanguage: 'zh' | 'en' = 'zh';

// 获取翻译文本
function t(key: string): string {
  const keys = key.split('.');
  let value: any = menuTranslations[currentLanguage];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}

// 设置菜单语言
export function setMenuLanguage(language: 'zh' | 'en') {
  currentLanguage = language;
}

// 导出翻译函数供其他模块使用
export function translate(key: string): string {
  return t(key);
}

export function createMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: t('file'),
      submenu: [
        {
          label: t('importConfig'),
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            const result = await dialog.showOpenDialog(win, {
              title: t('importConfig'),
              filters: [
                { name: t('jsonConfigFile'), extensions: ['json'] },
                { name: t('allFiles'), extensions: ['*'] }
              ],
              properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
              win.webContents.send('import-config', result.filePaths[0]);
            }
          }
        },
        {
          label: t('exportConfig'),
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            const result = await dialog.showSaveDialog(win, {
              title: t('exportConfig'),
              defaultPath: 'llmctl-config.json',
              filters: [
                { name: t('jsonConfigFile'), extensions: ['json'] },
                { name: t('allFiles'), extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePath) {
              win.webContents.send('export-config', result.filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: t('exit'),
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: t('session'),
      submenu: [
        {
          label: t('startNewSession'),
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            win.webContents.send('new-session');
          }
        },
        {
          label: t('viewAllSessions'),
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
          label: t('terminateAllSessions'),
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            dialog.showMessageBox(win, {
              type: 'warning',
              title: t('confirmOperation'),
              message: t('terminateAllConfirm'),
              detail: t('terminateAllDesc'),
              buttons: [t('cancel'), t('confirmTerminate')],
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
      label: t('navigation'),
      submenu: [
        {
          label: t('providerManagement'),
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
          label: t('tokenManagement'),
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
          label: t('sessionManagement'),
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
          label: t('statistics'),
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
          label: t('systemSettings'),
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
      label: t('view'),
      submenu: [
        { role: 'reload', label: t('reload') },
        { role: 'forceReload', label: t('forceReload') },
        { type: 'separator' },
        { role: 'resetZoom', label: t('actualSize') },
        { role: 'zoomIn', label: t('zoomIn') },
        { role: 'zoomOut', label: t('zoomOut') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: t('fullscreen') },
        { type: 'separator' },
        { role: 'toggleDevTools', label: t('developerTools'), accelerator: 'F12' }
      ]
    },
    {
      label: t('help'),
      submenu: [
        {
          label: t('documentation'),
          click: () => {
            shell.openExternal('https://github.com/3202336152/llmctl-desktop/wiki');
          }
        },
        {
          label: t('projectHome'),
          click: () => {
            shell.openExternal('https://github.com/3202336152/llmctl-desktop');
          }
        },
        {
          label: t('reportIssue'),
          click: () => {
            shell.openExternal('https://github.com/3202336152/llmctl-desktop/issues');
          }
        },
        { type: 'separator' },
        {
          label: t('aboutLlmctl'),
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            const version = app.getVersion();
            dialog.showMessageBox(win, {
              type: 'info',
              title: t('aboutTitle'),
              message: t('aboutMessage'),
              detail: t('aboutDetail').replace('{{version}}', version),
              buttons: [t('ok')]
            });
          }
        },
        {
          label: t('checkUpdate'),
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;

            const version = app.getVersion();
            dialog.showMessageBox(win, {
              type: 'info',
              title: t('updateTitle'),
              message: t('updateMessage'),
              detail: t('updateDetail').replace('{{version}}', version),
              buttons: [t('ok')]
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
        { role: 'about', label: t('aboutLlmctl') },
        { type: 'separator' },
        { role: 'services', label: t('services') },
        { type: 'separator' },
        { role: 'hide', label: t('hideLlmctl') },
        { role: 'hideOthers', label: t('hideOthers') },
        { role: 'unhide', label: t('unhide') },
        { type: 'separator' },
        { role: 'quit', label: t('exit') }
      ]
    });
  }

  return Menu.buildFromTemplate(template);
}
