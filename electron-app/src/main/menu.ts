import { Menu, MenuItemConstructorOptions, app, shell } from 'electron';

export function createMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入配置',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            // TODO: 实现导入配置功能
          }
        },
        {
          label: '导出配置',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            // TODO: 实现导出配置功能
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
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
      label: '工具',
      submenu: [
        {
          label: 'Provider管理',
          click: () => {
            // TODO: 切换到Provider管理页面
          }
        },
        {
          label: 'Token管理',
          click: () => {
            // TODO: 切换到Token管理页面
          }
        },
        {
          label: '会话管理',
          click: () => {
            // TODO: 切换到会话管理页面
          }
        },
        { type: 'separator' },
        {
          label: '系统设置',
          click: () => {
            // TODO: 打开设置页面
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 LLMctl',
          click: () => {
            // TODO: 打开关于对话框
          }
        },
        {
          label: '项目主页',
          click: () => {
            shell.openExternal('https://github.com/your-repo/llmctl');
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

    // Window menu
    template[4].submenu = [
      { role: 'close', label: '关闭' },
      { role: 'minimize', label: '最小化' },
      { role: 'zoom', label: '缩放' },
      { type: 'separator' },
      { role: 'front', label: '前置全部窗口' }
    ];
  }

  return Menu.buildFromTemplate(template);
}