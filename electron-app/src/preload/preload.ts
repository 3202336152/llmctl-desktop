import { contextBridge, ipcRenderer } from 'electron';

// 定义暴露给渲染进程的API接口
export interface ElectronAPI {
  // 应用信息
  getAppVersion(): Promise<string>;
  getPlatform(): Promise<string>;

  // 窗口控制
  minimizeWindow(): Promise<void>;
  maximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;

  // 文件操作
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<boolean>;
  selectDirectory(): Promise<{ canceled: boolean; path: string | null }>;

  // 系统功能
  showNotification(title: string, body: string): void;
  openExternal(url: string): Promise<void>;
  send(channel: string, data?: any): void;

  // 自动更新
  checkForUpdates(): Promise<{ success: boolean; message?: string }>;
  onUpdateStatus(callback: (message: string) => void): () => void;
  onDownloadProgress(callback: (percent: number) => void): () => void;
  onTriggerCheckUpdates(callback: () => void): () => void;

  // ==================== 终端 API ====================
  // 创建终端会话
  terminalCreate(options: {
    sessionId: string;
    command?: string;
    cwd?: string;
    env?: Record<string, string>;
  }): Promise<{ success: boolean; sessionId: string }>;

  // 发送输入到终端
  terminalInput(sessionId: string, input: string): Promise<{ success: boolean }>;

  // 终止终端会话
  terminalKill(sessionId: string): Promise<{ success: boolean }>;

  // 调整终端大小
  terminalResize(sessionId: string, cols: number, rows: number): Promise<{ success: boolean }>;

  // 监听终端输出
  onTerminalOutput(callback: (data: { sessionId: string; data: string }) => void): () => void;

  // 监听 Token 切换要求
  onTokenSwitchRequired(callback: (data: { sessionId: string; errorMessage: string }) => void): () => void;

  // 打开外部终端（支持环境变量传递）
  openExternalTerminal(options: {
    workingDirectory: string;
    command: string;
    env?: Record<string, string>; // ✅ 可选的环境变量参数
  }): Promise<{ success: boolean }>;

  // ==================== 配置导入导出 ====================
  // 监听导入配置消息
  onImportConfig(callback: (filePath: string) => void): () => void;

  // 监听导出配置消息
  onExportConfig(callback: (filePath: string) => void): () => void;
}

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // 文件操作
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // 系统功能
  showNotification: (title: string, body: string) => {
    new Notification(title, { body });
  },
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  send: (channel: string, data?: any) => ipcRenderer.send(channel, data),

  // ==================== 自动更新 API ====================
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  onUpdateStatus: (callback) => {
    const listener = (_event: any, message: string) => {
      callback(message);
    };
    ipcRenderer.on('update-status', listener);

    return () => {
      ipcRenderer.removeListener('update-status', listener);
    };
  },

  onDownloadProgress: (callback) => {
    const listener = (_event: any, percent: number) => {
      callback(percent);
    };
    ipcRenderer.on('download-progress', listener);

    return () => {
      ipcRenderer.removeListener('download-progress', listener);
    };
  },

  onTriggerCheckUpdates: (callback) => {
    const listener = () => {
      callback();
    };
    ipcRenderer.on('trigger-check-updates', listener);

    return () => {
      ipcRenderer.removeListener('trigger-check-updates', listener);
    };
  },

  // ==================== 终端 API ====================
  terminalCreate: (options) => ipcRenderer.invoke('terminal-create', options),

  terminalInput: (sessionId, input) => ipcRenderer.invoke('terminal-input', { sessionId, input }),

  terminalKill: (sessionId) => ipcRenderer.invoke('terminal-kill', sessionId),

  terminalResize: (sessionId, cols, rows) => ipcRenderer.invoke('terminal-resize', { sessionId, cols, rows }),

  onTerminalOutput: (callback) => {
    const listener = (_event: any, data: { sessionId: string; data: string }) => {
      callback(data);
    };
    ipcRenderer.on('terminal-output', listener);

    // 返回取消监听函数
    return () => {
      ipcRenderer.removeListener('terminal-output', listener);
    };
  },

  onTokenSwitchRequired: (callback) => {
    const listener = (_event: any, data: { sessionId: string; errorMessage: string }) => {
      callback(data);
    };
    ipcRenderer.on('token-switch-required', listener);

    return () => {
      ipcRenderer.removeListener('token-switch-required', listener);
    };
  },

  openExternalTerminal: (options) => ipcRenderer.invoke('open-external-terminal', options),

  // ==================== 配置导入导出 ====================
  onImportConfig: (callback) => {
    const listener = (_event: any, filePath: string) => {
      callback(filePath);
    };
    ipcRenderer.on('import-config', listener);

    return () => {
      ipcRenderer.removeListener('import-config', listener);
    };
  },

  onExportConfig: (callback) => {
    const listener = (_event: any, filePath: string) => {
      callback(filePath);
    };
    ipcRenderer.on('export-config', listener);

    return () => {
      ipcRenderer.removeListener('export-config', listener);
    };
  }
} as ElectronAPI);

// 全局类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}