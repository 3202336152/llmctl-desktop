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
  outputBuffer: string; // 输出缓冲区，用于错误检测
  errorDetected: boolean; // 标记是否已检测到错误，避免重复通知
}

// Token/API 错误检测模式
const TOKEN_ERROR_PATTERNS = [
  // Claude API 错误
  /credit balance is too low/i,
  /insufficient credits/i,
  /rate limit exceeded/i,
  /quota.*exceeded/i,

  // 认证错误
  /401.*unauthorized/i,
  /403.*forbidden/i,
  /authentication.*failed/i,
  /invalid.*api.*key/i,
  /invalid.*token/i,

  // Anthropic 特定错误
  /error.*authentication_error/i,
  /error.*permission_error/i,
  /error.*rate_limit_error/i,

  // OpenAI 错误
  /insufficient_quota/i,
  /invalid_api_key/i,

  // 通用错误
  /authentication.*error/i,
  /authorization.*failed/i,
];

class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private instanceCounter: number = 0; // 实例计数器

  async createSession(sessionId: string, window: BrowserWindow, options: {
    command?: string;
    cwd?: string;
    env?: Record<string, string>;
  } = {}): Promise<{ existed: boolean }> {
    // 如果会话已存在且进程还活着，不重新创建，直接返回
    const existingSession = this.sessions.get(sessionId);
    if (existingSession) {
      try {
        // 检查进程是否还活着（尝试发送空数据）
        existingSession.process.write('');
        console.log('[TerminalManager] 会话已存在且正在运行，重用现有会话:', sessionId);
        // 更新window引用，以防窗口已重新创建
        existingSession.window = window;
        return { existed: true };
      } catch (error) {
        // 进程已死，清理并重新创建
        console.log('[TerminalManager] 会话存在但进程已死，重新创建:', sessionId);
        this.sessions.delete(sessionId);
      }
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
        outputBuffer: '', // 初始化输出缓冲区
        errorDetected: false, // 初始化错误检测标记
      });

      ptyProcess.onData((data: string) => {
        // 打印原始终端输出（帮助调试）
        if (data.toLowerCase().includes('error') || data.toLowerCase().includes('invalid') || data.toLowerCase().includes('credit')) {
          console.log('[TerminalManager] ⚠️ 检测到可疑输出:', sessionId, data.substring(0, 200));
        }

        // 检测 Token 错误（不阻塞输出）
        this.detectTokenError(sessionId, data, currentInstanceId).catch(err => {
          console.error('[TerminalManager] ❌ 错误检测失败:', err);
        });

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

      return { existed: false };
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

  /**
   * 检测终端输出中的 Token 错误
   */
  private async detectTokenError(sessionId: string, data: string, instanceId: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.instanceId !== instanceId) {
      return;
    }

    // 如果已经检测到错误，不再重复检测
    if (session.errorDetected) {
      return;
    }

    // 去除 ANSI 转义序列，方便匹配
    const cleanData = data.replace(/\x1b\[[0-9;]*m/g, '');

    // 添加到缓冲区（保留最近 2000 字符，避免内存溢出）
    session.outputBuffer += cleanData;
    if (session.outputBuffer.length > 2000) {
      session.outputBuffer = session.outputBuffer.slice(-2000);
    }

    // 检查是否匹配错误模式
    for (const pattern of TOKEN_ERROR_PATTERNS) {
      if (pattern.test(session.outputBuffer)) {
        console.warn('='.repeat(80));
        console.warn('[TerminalManager] ✅ 检测到 Token 错误!!!');
        console.warn('[TerminalManager] Session ID:', sessionId);
        console.warn('[TerminalManager] 错误模式:', pattern.toString());
        console.warn('[TerminalManager] 错误内容:', session.outputBuffer.substring(0, 500));
        console.warn('='.repeat(80));

        // 标记已检测到错误，避免重复触发
        session.errorDetected = true;

        // 调用后端 API 标记 Token 为不健康
        console.log('[TerminalManager] 🔧 即将调用 markTokenUnhealthy...');

        try {
          await this.markTokenUnhealthy(sessionId);
          console.log('[TerminalManager] ✅ markTokenUnhealthy 调用完成');
        } catch (error) {
          console.error('[TerminalManager] ❌ markTokenUnhealthy 调用失败:', error);
        }

        // 提示用户重启会话以切换 Token
        console.log('[TerminalManager] 📤 发送 token-switch-required 事件到渲染进程...');
        session.window.webContents.send('token-switch-required', {
          sessionId,
          errorMessage: '当前 Token 已失效',
        });
        console.log('[TerminalManager] ✅ 事件已发送');

        // 清空缓冲区
        session.outputBuffer = '';
        break;
      }
    }
  }

  /**
   * 标记 Token 为不健康状态
   */
  private async markTokenUnhealthy(sessionId: string): Promise<void> {
    console.log('[TerminalManager] ========== 开始标记Token为不健康 ==========');
    console.log('[TerminalManager] Session ID:', sessionId);

    try {
      // 从后端获取会话信息，直接获取保存的 tokenId
      const sessionUrl = `http://localhost:8080/llmctl/sessions/${sessionId}`;
      console.log('[TerminalManager] 正在请求会话信息:', sessionUrl);

      const sessionResponse = await fetch(sessionUrl);
      console.log('[TerminalManager] 会话请求响应状态:', sessionResponse.status);

      if (!sessionResponse.ok) {
        console.error('[TerminalManager] ❌ 获取会话信息失败:', sessionResponse.status, sessionResponse.statusText);
        return;
      }

      const sessionData = await sessionResponse.json();
      console.log('[TerminalManager] 会话数据:', JSON.stringify(sessionData, null, 2));

      const providerId = sessionData.data?.providerId;
      const tokenId = sessionData.data?.tokenId;

      console.log('[TerminalManager] 提取的信息:', { providerId, tokenId });

      if (!providerId) {
        console.error('[TerminalManager] ❌ 无法获取 Provider ID');
        return;
      }

      if (!tokenId) {
        console.error('[TerminalManager] ❌ 会话未关联 Token ID');
        return;
      }

      // 构建更新URL
      const updateUrl = `http://localhost:8080/llmctl/providers/${providerId}/tokens/${tokenId}/health`;
      const requestBody = { healthy: false };

      console.log('[TerminalManager] 准备发送PUT请求:');
      console.log('  URL:', updateUrl);
      console.log('  Body:', JSON.stringify(requestBody));

      // 直接使用保存的 tokenId 标记为不健康
      const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[TerminalManager] 更新请求响应状态:', updateResponse.status);

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('[TerminalManager] ✅ 成功标记 Token 为不健康:', tokenId);
        console.log('[TerminalManager] 更新响应:', JSON.stringify(updateResult, null, 2));

        // 验证更新是否成功
        const verifyUrl = `http://localhost:8080/llmctl/providers/${providerId}/tokens/${tokenId}`;
        console.log('[TerminalManager] 验证Token状态:', verifyUrl);

        const verifyResponse = await fetch(verifyUrl);
        if (verifyResponse.ok) {
          const tokenData = await verifyResponse.json();
          console.log('[TerminalManager] 🔍 验证结果:', {
            tokenId,
            alias: tokenData.data?.alias,
            healthy: tokenData.data?.healthy,
            enabled: tokenData.data?.enabled
          });

          if (tokenData.data?.healthy === false) {
            console.log('[TerminalManager] ✅✅ 数据库已确认Token为不健康状态');
          } else {
            console.error('[TerminalManager] ⚠️ 警告：Token状态未按预期更新！实际状态:', tokenData.data?.healthy);
          }
        }
      } else {
        const errorText = await updateResponse.text();
        console.error('[TerminalManager] ❌ 标记 Token 失败:', updateResponse.status, updateResponse.statusText);
        console.error('[TerminalManager] 错误响应体:', errorText);
      }
    } catch (error: any) {
      console.error('[TerminalManager] ❌❌ 标记 Token 过程中发生异常:');
      console.error('[TerminalManager] 错误类型:', error?.constructor?.name);
      console.error('[TerminalManager] 错误消息:', error?.message);
      console.error('[TerminalManager] 错误堆栈:', error?.stack);
    }

    console.log('[TerminalManager] ========== 标记Token流程结束 ==========');
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