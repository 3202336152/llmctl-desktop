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
  openFile(): Promise<string | null>;
  saveFile(content: string): Promise<boolean>;

  // 系统通知
  showNotification(title: string, body: string): void;

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
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content: string) => ipcRenderer.invoke('save-file', content),

  // 系统通知
  showNotification: (title: string, body: string) => {
    new Notification(title, { body });
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
  }
} as ElectronAPI);

// 全局类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}