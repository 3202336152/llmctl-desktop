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
  }
} as ElectronAPI);

// 全局类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}