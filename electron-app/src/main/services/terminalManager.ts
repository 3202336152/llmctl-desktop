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
  createdAt: number; // 会话创建时间戳，用于延迟错误检测
  errorDetectionEnabled: boolean; // 是否启用错误检测（延迟启动）
  errorDetectionTimer?: NodeJS.Timeout; // 错误检测延迟定时器（用于清除）
  isResumed: boolean; // 标记是否为重建的会话(/resume)
  resumeDetectionActive: boolean; // 是否正在等待 resume 完成
  resumeCompletionDetected: boolean; // 是否已检测到 resume 完成
  timedOutputBuffer: Array<{ timestamp: number; content: string }>; // 带时间戳的输出缓冲区
}

// /resume 命令完成检测模式
const RESUME_COMPLETION_PATTERNS = [
  // Claude CLI 的典型完成模式
  /Continue\s+this\s+conversation/i,           // "Continue this conversation?"
  /\[Y\/n\]/i,                                  // 用户输入提示
  />\s*$/,                                      // 命令提示符 ">"
  /\$\s*$/,                                     // Shell 提示符
  /\w+>\s*$/,                                   // 带路径的提示符 "C:\Users\xxx>"
  /\w+@\w+:\S+\$\s*$/,                         // Linux 提示符 "user@host:~$"
];

// Token/API 错误检测模式
const TOKEN_ERROR_PATTERNS = [
  // ===== Claude/Anthropic API 错误 =====
  // 余额/配额错误
  /credit balance is too low/i,
  /insufficient credits/i,
  /rate limit exceeded/i,
  /quota.*exceeded/i,

  // 账户/组织错误
  /no available claude account/i,                    // ✅ 新增: 无可用Claude账户
  /this organization has been disabled/i,            // ✅ 新增: 组织已被禁用
  /organization.*disabled/i,                         // ✅ 新增: 组织禁用(通用)
  /account.*suspended/i,                             // ✅ 新增: 账户已暂停
  /account.*disabled/i,                              // ✅ 新增: 账户已禁用

  // 认证/权限错误
  /401.*unauthorized/i,
  /403.*forbidden/i,
  /authentication.*failed/i,
  /invalid.*api.*key/i,
  /invalid.*token/i,
  /api.*key.*invalid/i,                              // ✅ 新增: API密钥无效
  /api.*key.*expired/i,                              // ✅ 新增: API密钥过期

  // Anthropic 特定错误类型
  /error.*authentication_error/i,
  /error.*permission_error/i,
  /error.*rate_limit_error/i,
  /error.*api_error/i,                               // ✅ 新增: API错误
  /error.*overloaded_error/i,                        // ✅ 新增: 过载错误

  // ===== OpenAI 错误 =====
  /insufficient_quota/i,
  /invalid_api_key/i,
  /account.*deactivated/i,                           // ✅ 新增: 账户已停用
  /billing.*hard.*limit/i,                           // ✅ 新增: 计费硬限制

  // ===== 通用 HTTP 错误 =====
  /500.*internal.*server.*error/i,                   // ✅ 新增: 服务器内部错误
  /502.*bad.*gateway/i,                              // ✅ 新增: 网关错误
  /503.*service.*unavailable/i,                      // ✅ 新增: 服务不可用
  /504.*gateway.*timeout/i,                          // ✅ 新增: 网关超时

  // ===== 通用认证/授权错误 =====
  /authentication.*error/i,
  /authorization.*failed/i,
  /access.*denied/i,                                 // ✅ 新增: 访问被拒绝
  /permission.*denied/i,                             // ✅ 新增: 权限被拒绝

  // ===== API 错误消息格式 =====
  /"type"\s*:\s*"error"/i,                           // ✅ 新增: JSON错误类型
  /api.*error.*\d{3}/i,                              // ✅ 新增: API错误带状态码
];

class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private instanceCounter: number = 0; // 实例计数器

  async createSession(sessionId: string, window: BrowserWindow, options: {
    command?: string;
    cwd?: string;
    env?: Record<string, string>;
  } = {}): Promise<{ existed: boolean }> {
    // ✅ 检查是否已存在会话
    const existingSession = this.sessions.get(sessionId);
    const isResumed = !!existingSession; // 如果会话已存在，说明是 /resume 重建

    if (existingSession) {
      console.log('[TerminalManager] ⚠️ 会话已存在，销毁旧进程并创建新的 (resume):', sessionId);

      // ✅ 清除之前的错误检测定时器
      if (existingSession.errorDetectionTimer) {
        clearTimeout(existingSession.errorDetectionTimer);
        console.log('[TerminalManager] ✅ 已清除旧的错误检测定时器');
      }

      try {
        existingSession.process.kill();
      } catch (error) {
        console.error('[TerminalManager] 销毁旧进程失败:', error);
      }
      this.sessions.delete(sessionId);
    }

    console.log('[TerminalManager] 🚀 创建新的 pty 会话:', sessionId);

    const { command = 'cmd.exe', cwd = process.cwd(), env = {} } = options;

    const isWindows = os.platform() === 'win32';
    const shell = isWindows ? 'cmd.exe' : (command || 'bash');

    // ✅ Windows 编码设置：强制使用 UTF-8 避免终端乱码
    const fullEnv = {
      ...process.env,
      ...env,
    };

    // Windows 系统：添加完整的 UTF-8 编码支持
    if (isWindows) {
      fullEnv.PYTHONIOENCODING = 'utf-8';
      fullEnv.PYTHONUTF8 = '1';
      fullEnv.LANG = 'zh_CN.UTF-8';
      fullEnv.LC_ALL = 'zh_CN.UTF-8';
      fullEnv.CHCP = '65001'; // UTF-8 code page
      console.log('[TerminalManager] 检测到 Windows 系统，已添加完整的 UTF-8 编码环境变量');
    }

    try {
      const ptyOptions: any = {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd,
        env: fullEnv,
        // ✅ 设置编码为 UTF-8（node-pty 支持）
        encoding: 'utf8',
      };

      if (isWindows) {
        // ✅ Windows 使用 ConPTY（更好的 UTF-8 支持）
        ptyOptions.useConpty = true;
        ptyOptions.conptyInheritCursor = true;
      }

      const ptyProcess = pty.spawn(shell, [], ptyOptions);

      // 分配新的实例ID
      const currentInstanceId = ++this.instanceCounter;

      // ✅ 创建会话对象（暂不设置定时器）
      const newSession: TerminalSession = {
        id: sessionId,
        process: ptyProcess,
        window,
        shell,
        cwd,
        instanceId: currentInstanceId,
        outputBuffer: '', // 初始化输出缓冲区
        errorDetected: false, // 初始化错误检测标记
        createdAt: Date.now(), // 记录创建时间
        errorDetectionEnabled: !isResumed, // resume 会话等待完成检测，首次创建延迟启用
        errorDetectionTimer: undefined, // 初始无定时器
        isResumed, // 标记是否为重建的会话
        resumeDetectionActive: isResumed, // resume 会话启用完成检测
        resumeCompletionDetected: false, // 初始未检测到完成
        timedOutputBuffer: [], // 初始化时间戳缓冲区
      };

      this.sessions.set(sessionId, newSession);

      // ✅ 智能延迟启动错误检测
      // - 首次创建会话: 延迟5秒（避免检测到历史错误）
      // - resume 会话: 不延迟，等待检测到命令完成标记后启用
      if (!isResumed) {
        const detectionDelay = 5000;
        console.log(`[TerminalManager] ⏰ 将在 5秒 后启用错误检测:`, sessionId);

        // ✅ 保存定时器引用，以便后续可以清除
        const timer = setTimeout(() => {
          const session = this.sessions.get(sessionId);
          if (session && session.instanceId === currentInstanceId) {
            session.errorDetectionEnabled = true;
            session.errorDetectionTimer = undefined; // 清除定时器引用
            console.log('[TerminalManager] ✅ 错误检测已启用 (首次创建):', sessionId);
          }
        }, detectionDelay);

        // ✅ 将定时器保存到会话对象中
        newSession.errorDetectionTimer = timer;
      } else {
        console.log(`[TerminalManager] ⏰ Resume 会话，等待检测命令完成标记后启用错误检测:`, sessionId);
      }

      // ✅ Windows 系统：启动后立即执行 chcp 65001 切换到 UTF-8 编码
      if (isWindows) {
        console.log('[TerminalManager] 执行 chcp 65001 切换到 UTF-8 编码');
        // 使用静默方式执行（> nul 隐藏输出）
        ptyProcess.write('chcp 65001 > nul\r');
      }

      ptyProcess.onData((data: string) => {
        // 打印原始终端输出（帮助调试）
        if (data.toLowerCase().includes('error') || data.toLowerCase().includes('invalid') || data.toLowerCase().includes('credit')) {
          console.log('[TerminalManager] ⚠️ 检测到可疑输出:', sessionId, data.substring(0, 200));
        }

        // ✅ 过滤掉 bracketed paste mode 的控制序列
        // 1. 移除启用/禁用控制序列：\x1b[?2004h 和 \x1b[?2004l
        // 2. 移除 bracketed paste 包裹序列：\x1b[200~ 和 \x1b[201~
        // ✅ 保留 CMD 的粘贴提示文本 [Pasted text #N +X lines]
        let filteredData = data
          .replace(/\x1b\[\?2004[hl]/g, '')
          .replace(/\x1b\[20[01]~/g, '');

        // 检测 Token 错误（不阻塞输出）
        this.detectTokenError(sessionId, filteredData, currentInstanceId).catch(err => {
          console.error('[TerminalManager] ❌ 错误检测失败:', err);
        });

        this.sendOutput(sessionId, filteredData, currentInstanceId);
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
      // ✅ 过滤掉 bracketed paste mode 的控制序列
      // 移除 \x1b[?2004h (启用) 和 \x1b[?2004l (禁用)
      let filteredData = data.replace(/\x1b\[\?2004[hl]/g, '');

      // 如果过滤后数据为空，直接返回
      if (!filteredData) {
        return;
      }

      // ✅ 检测 /resume 命令
      const cleanInput = filteredData.trim().toLowerCase();
      if (cleanInput.startsWith('/resume')) {
        console.log('[TerminalManager] 🔄 检测到 /resume 命令，重新启动完成检测:', sessionId);

        // 暂时禁用错误检测
        session.errorDetectionEnabled = false;
        session.resumeDetectionActive = true;
        session.resumeCompletionDetected = false;

        // 清空时间戳缓冲区，避免检测旧的历史错误
        session.timedOutputBuffer = [];

        console.log('[TerminalManager] ⏰ 等待 /resume 命令完成...');
      }

      // 如果数据较小，直接写入
      if (filteredData.length <= 1024) {
        session.process.write(filteredData);
        return;
      }

      // 大数据分块写入，避免PTY缓冲区溢出
      const chunkSize = 1024; // 每块1KB
      const delay = 5; // 每块之间延迟5ms

      let offset = 0;
      const writeChunk = () => {
        if (offset >= filteredData.length) {
          return; // 写入完成
        }

        const chunk = filteredData.slice(offset, offset + chunkSize);
        session.process.write(chunk);
        offset += chunkSize;

        // 延迟后写入下一块
        setTimeout(writeChunk, delay);
      };

      writeChunk();
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

    // 去除 ANSI 转义序列，方便匹配
    const cleanData = data.replace(/\x1b\[[0-9;]*m/g, '');

    // ✅ 方案1: 如果正在等待 resume 完成，先检测是否完成
    if (session.resumeDetectionActive && !session.resumeCompletionDetected) {
      // 检查是否匹配 resume 完成模式
      for (const pattern of RESUME_COMPLETION_PATTERNS) {
        if (pattern.test(cleanData)) {
          console.log('[TerminalManager] ✅ 检测到 /resume 命令完成，启用错误检测:', sessionId);
          session.resumeCompletionDetected = true;
          session.errorDetectionEnabled = true;
          session.resumeDetectionActive = false; // 停止检测

          // ✅ 重置 errorDetected 标记，允许检测新的错误
          session.errorDetected = false;

          console.log('[TerminalManager] 🔄 已重置错误检测状态，开始监控新的输出');
          break;
        }
      }

      // ✅ 关键修复：如果还未检测到完成，直接返回，不添加任何内容到缓冲区
      if (!session.resumeCompletionDetected) {
        console.log('[TerminalManager] ⏸️  Resume 未完成，跳过此输出（避免检测历史错误）:', cleanData.substring(0, 100));
        return;
      }
    }

    // ✅ 如果错误检测未启用，跳过检测（避免检测历史输出）
    if (!session.errorDetectionEnabled) {
      return;
    }

    // 如果已经检测到错误，不再重复检测
    if (session.errorDetected) {
      return;
    }

    // ✅ 方案3: 添加到时间戳缓冲区（只有在 resume 完成后才会执行到这里）
    const now = Date.now();
    session.timedOutputBuffer.push({ timestamp: now, content: cleanData });

    // ✅ 移除超过10秒的旧数据
    session.timedOutputBuffer = session.timedOutputBuffer.filter(
      item => now - item.timestamp < 10000
    );

    // ✅ 只检测3秒前的输出（给历史输出留出时间）
    const oldOutputs = session.timedOutputBuffer
      .filter(item => now - item.timestamp >= 3000)
      .map(item => item.content)
      .join('');

    // 如果没有足够的旧输出，跳过检测
    if (oldOutputs.length < 50) {
      return;
    }

    // 检查是否匹配错误模式（使用3秒前的输出）
    for (const pattern of TOKEN_ERROR_PATTERNS) {
      if (pattern.test(oldOutputs)) {
        console.warn('='.repeat(80));
        console.warn('[TerminalManager] ✅ 检测到 Token 错误 (3秒前的输出)!!!');
        console.warn('[TerminalManager] Session ID:', sessionId);
        console.warn('[TerminalManager] 错误模式:', pattern.toString());
        console.warn('[TerminalManager] 错误内容:', oldOutputs.substring(0, 500));
        console.warn('='.repeat(80));

        // 标记已检测到错误，避免重复触发
        session.errorDetected = true;

        // ✅ 不在主进程调用健康状态更新API（因为缺少JWT认证）
        // ✅ 改为在渲染进程的App.tsx中调用tokenAPI.updateTokenHealth（携带JWT）
        console.log('[TerminalManager] 📤 发送 token-switch-required 事件到渲染进程...');
        session.window.webContents.send('token-switch-required', {
          sessionId,
          errorMessage: '当前 Token 已失效',
        });
        console.log('[TerminalManager] ✅ 事件已发送（渲染进程将负责更新Token健康状态）');

        // 清空缓冲区
        session.timedOutputBuffer = [];
        break;
      }
    }
  }

  killSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // ✅ 清除错误检测定时器
    if (session.errorDetectionTimer) {
      clearTimeout(session.errorDetectionTimer);
      console.log('[TerminalManager] ✅ 已清除错误检测定时器 (killSession)');
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
      // ✅ 清除错误检测定时器
      if (session.errorDetectionTimer) {
        clearTimeout(session.errorDetectionTimer);
      }

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