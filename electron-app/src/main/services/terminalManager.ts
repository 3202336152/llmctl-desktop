import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as os from 'os';

interface TerminalSession {
  id: string;
  process: pty.IPty;
  window: BrowserWindow;
  shell: string;
  cwd: string;
  instanceId: number; // 添加实例ID，用于区分不同的会话实例
}

class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private instanceCounter: number = 0; // 实例计数器

  async createSession(sessionId: string, window: BrowserWindow, options: {
    command?: string;
    cwd?: string;
    env?: Record<string, string>;
  } = {}): Promise<void> {
    // 如果会话已存在，先清理旧的并等待清理完成
    if (this.sessions.has(sessionId)) {
      console.log('[TerminalManager] 会话已存在，先清理旧会话:', sessionId);
      this.killSession(sessionId);
      // 等待50ms确保PTY进程完全退出
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const { command = 'cmd.exe', cwd = process.cwd(), env = {} } = options;

    const isWindows = os.platform() === 'win32';
    const shell = isWindows ? 'cmd.exe' : (command || 'bash');

    const fullEnv = {
      ...process.env,
      ...env,
    };

    try {
      const ptyOptions: any = {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd,
        env: fullEnv,
      };

      if (isWindows) {
        ptyOptions.useConpty = false;
      }

      const ptyProcess = pty.spawn(shell, [], ptyOptions);

      // 分配新的实例ID
      const currentInstanceId = ++this.instanceCounter;

      this.sessions.set(sessionId, {
        id: sessionId,
        process: ptyProcess,
        window,
        shell,
        cwd,
        instanceId: currentInstanceId,
      });

      ptyProcess.onData((data: string) => {
        this.sendOutput(sessionId, data, currentInstanceId);
      });

      ptyProcess.onExit(({ exitCode }) => {
        // 只有当前实例才发送退出消息
        const currentSession = this.sessions.get(sessionId);
        if (currentSession && currentSession.instanceId === currentInstanceId) {
          this.sendOutput(sessionId, `\r\n\x1b[1;31m[进程已退出，退出码: ${exitCode}]\x1b[0m\r\n`, currentInstanceId);
          this.sessions.delete(sessionId);
        }
      });

    } catch (error) {
      console.error('[TerminalManager] 启动PTY进程失败:', error);
      throw error;
    }
  }

  sendInput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('[TerminalManager] 会话不存在:', sessionId);
      return;
    }

    try {
      session.process.write(data);
    } catch (error) {
      console.error('[TerminalManager] 发送输入失败:', error);
    }
  }

  private sendOutput(sessionId: string, data: string, instanceId: number): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.window.isDestroyed()) {
      return;
    }

    // 只发送匹配实例ID的输出，避免旧实例的输出干扰新实例
    if (session.instanceId !== instanceId) {
      console.log('[TerminalManager] 忽略旧实例的输出:', sessionId, '旧ID:', instanceId, '新ID:', session.instanceId);
      return;
    }

    session.window.webContents.send('terminal-output', {
      sessionId,
      data,
    });
  }

  killSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    try {
      session.process.kill();
      this.sessions.delete(sessionId);
    } catch (error) {
      console.error('[TerminalManager] 终止会话失败:', error);
    }
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    try {
      session.process.resize(cols, rows);
    } catch (error) {
      console.error('[TerminalManager] 调整大小失败:', error);
    }
  }

  cleanup(): void {
    this.sessions.forEach((session) => {
      try {
        session.process.kill();
      } catch (error) {
        // 忽略错误
      }
    });
    this.sessions.clear();
  }
}

export default new TerminalManager();