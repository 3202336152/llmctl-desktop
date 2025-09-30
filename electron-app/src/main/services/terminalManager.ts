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
}

class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();

  createSession(sessionId: string, window: BrowserWindow, options: {
    command?: string;
    cwd?: string;
    env?: Record<string, string>;
  } = {}): void {
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

      this.sessions.set(sessionId, {
        id: sessionId,
        process: ptyProcess,
        window,
        shell,
        cwd,
      });

      ptyProcess.onData((data: string) => {
        this.sendOutput(sessionId, data);
      });

      ptyProcess.onExit(({ exitCode }) => {
        this.sendOutput(sessionId, `\r\n\x1b[1;31m[进程已退出，退出码: ${exitCode}]\x1b[0m\r\n`);
        this.sessions.delete(sessionId);
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

  private sendOutput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.window.isDestroyed()) {
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