import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs'; // ✅ 添加异步文件操作

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
  errorDetectionEnabledAt?: number; // ✅ 新增：错误检测启用的时间戳（用于过滤启用前的输出）
  errorDetectionTimer?: NodeJS.Timeout; // 错误检测延迟定时器（用于清除）
  waitingForNextInput: boolean; // ✅ 新增：等待用户下次输入（用于 /resume 后重新启用错误检测）
  timedOutputBuffer: Array<{ timestamp: number; content: string }>; // 带时间戳的输出缓冲区
  codexConfigPath?: string; // Codex 配置文件目录路径（用于会话结束时清理）
  // ✅ PTY 监听器引用，用于清理时移除
  dataListener?: pty.IDisposable;
  exitListener?: pty.IDisposable;
}

/**
 * ✅ 文件操作队列
 * 防止并发文件操作阻塞磁盘IO，特别是在机械硬盘或杀毒软件扫描时
 */
class FileOperationQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;
  private operationCounter = 0;

  /**
   * 添加文件操作到队列
   * @param operation 要执行的异步操作
   * @returns 操作结果
   */
  async add<T>(operation: () => Promise<T>): Promise<T> {
    const operationId = ++this.operationCounter;
    console.log(`[FileQueue] 📥 添加操作 #${operationId} 到队列，当前队列长度: ${this.queue.length}`);

    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        const startTime = Date.now();
        console.log(`[FileQueue] ▶️  开始执行操作 #${operationId}`);
        try {
          const result = await operation();
          const elapsedTime = Date.now() - startTime;
          console.log(`[FileQueue] ✅ 操作 #${operationId} 完成，耗时: ${elapsedTime}ms`);
          resolve(result);
        } catch (error) {
          const elapsedTime = Date.now() - startTime;
          console.error(`[FileQueue] ❌ 操作 #${operationId} 失败，耗时: ${elapsedTime}ms`, error);
          reject(error);
        }
      });

      // 如果队列未运行，立即开始处理
      if (!this.running) {
        this.processQueue();
      }
    });
  }

  /**
   * 处理队列中的操作（串行执行）
   */
  private async processQueue() {
    if (this.running || this.queue.length === 0) {
      return;
    }

    this.running = true;
    console.log(`[FileQueue] 🏃 开始处理队列，队列长度: ${this.queue.length}`);

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('[FileQueue] 任务执行失败:', error);
        }
      }
    }

    this.running = false;
    console.log('[FileQueue] ✅ 队列处理完成');
  }
}

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
  private fileQueue = new FileOperationQueue(); // ✅ 文件操作队列
  private readonly MAX_SESSIONS = 10; // ✅ 最大并发终端数量限制

  async createSession(sessionId: string, window: BrowserWindow, options: {
    command?: string;
    cwd?: string;
    env?: Record<string, string>;
  } = {}): Promise<{ existed: boolean }> {
    // ✅ 检查是否超过最大会话数量（排除当前正在重建的会话）
    const existingSession = this.sessions.get(sessionId);
    const isResumed = !!existingSession;

    if (!isResumed && this.sessions.size >= this.MAX_SESSIONS) {
      const errorMsg = `已达到最大终端数量限制（${this.MAX_SESSIONS}），请先关闭部分终端`;
      console.error('[TerminalManager]', errorMsg);
      throw new Error(errorMsg);
    }

    // ✅ 检查是否已存在会话

    if (existingSession) {
      console.log('[TerminalManager] ⚠️ 会话已存在，销毁旧进程并创建新的 (resume):', sessionId);

      // ✅ 优化清理顺序，避免EPIPE错误：
      // 1. 先清除定时器
      // 2. 再kill进程（停止数据流）
      // 3. 等待100ms让pending的IO操作完成
      // 4. 最后dispose监听器

      // Step 1: 清除错误检测定时器
      if (existingSession.errorDetectionTimer) {
        clearTimeout(existingSession.errorDetectionTimer);
        console.log('[TerminalManager] ✅ 已清除旧的错误检测定时器');
      }

      // Step 2: 尝试kill进程（停止数据流）
      try {
        existingSession.process.kill();
        console.log('[TerminalManager] ✅ 已终止旧的PTY进程');
      } catch (error) {
        console.error('[TerminalManager] 销毁旧进程失败:', error);
      }

      // Step 3: 等待100ms，让pending的IO操作完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 4: 移除监听器（此时数据流已停止，不会触发EPIPE）
      if (existingSession.dataListener) {
        existingSession.dataListener.dispose();
        console.log('[TerminalManager] ✅ 已移除旧的 dataListener');
      }
      if (existingSession.exitListener) {
        existingSession.exitListener.dispose();
        console.log('[TerminalManager] ✅ 已移除旧的 exitListener');
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

    // ✅ Codex 配置文件处理（会话独立方案）- 使用队列和超时保护
    // 目录结构: 工作目录/.codex-sessions/{sessionId}/
    let codexConfigPath: string | undefined;
    if (fullEnv.CODEX_CONFIG_TOML || fullEnv.CODEX_AUTH_JSON) {
      console.log('[TerminalManager] 检测到 Codex 配置，开始创建会话独立的配置文件');
      const perfStart = Date.now();

      try {
        // ✅ 使用文件操作队列，避免并发文件操作阻塞磁盘
        await this.fileQueue.add(async () => {
          // ✅ 从环境变量中获取 CODEX_HOME（已由后端设置为 .codex-sessions/{sessionId}）
          const codexDir = fullEnv.CODEX_HOME || path.join(cwd, '.codex-sessions', sessionId);

          // ✅ 文件创建Promise
          const createFilesPromise = (async () => {
            // 异步创建目录（避免阻塞主进程）
            await fsPromises.mkdir(codexDir, { recursive: true });
            console.log(`[TerminalManager] 创建 Codex 配置目录耗时: ${Date.now() - perfStart}ms`);

            // 保存配置路径用于后续清理
            codexConfigPath = codexDir;

            // 异步写入 config.toml
            if (fullEnv.CODEX_CONFIG_TOML) {
              const configPath = path.join(codexDir, 'config.toml');
              const writeStart = Date.now();

              await fsPromises.writeFile(configPath, fullEnv.CODEX_CONFIG_TOML, 'utf-8');
              console.log(`[TerminalManager] 写入 config.toml 耗时: ${Date.now() - writeStart}ms`);

              // 异步验证文件是否真的存在
              try {
                const fileContent = await fsPromises.readFile(configPath, 'utf-8');
                console.log('[TerminalManager] ✅ 验证成功，文件大小:', fileContent.length, '字符');
                console.log('[TerminalManager] 📄 配置内容预览（前200字符）:', fileContent.substring(0, 200));
              } catch (verifyError) {
                console.error('[TerminalManager] ❌ 文件验证失败：', verifyError);
              }

              // 从环境变量中移除（已写入文件）
              delete fullEnv.CODEX_CONFIG_TOML;
            }

            // 异步写入 auth.json
            if (fullEnv.CODEX_AUTH_JSON) {
              const authPath = path.join(codexDir, 'auth.json');

              // 如果有 CODEX_API_KEY 环境变量，需要替换 auth.json 中的 Token
              let authContent = fullEnv.CODEX_AUTH_JSON;
              if (fullEnv.CODEX_API_KEY) {
                try {
                  // 解析 auth.json
                  const authObj = JSON.parse(authContent);

                  // 替换 OPENAI_API_KEY 为实际的 Token
                  if ('OPENAI_API_KEY' in authObj) {
                    authObj.OPENAI_API_KEY = fullEnv.CODEX_API_KEY;
                    authContent = JSON.stringify(authObj, null, 2);
                    console.log('[TerminalManager] 已将 auth.json 中的 OPENAI_API_KEY 替换为实际 Token');
                  }
                } catch (parseError) {
                  console.error('[TerminalManager] 解析 auth.json 失败，使用原始内容:', parseError);
                }
              }

              const authWriteStart = Date.now();
              await fsPromises.writeFile(authPath, authContent, 'utf-8');
              console.log(`[TerminalManager] 写入 auth.json 耗时: ${Date.now() - authWriteStart}ms`);

              // 异步验证文件是否真的存在
              try {
                await fsPromises.access(authPath, fs.constants.F_OK);
                console.log('[TerminalManager] ✅ 验证成功，auth.json 已创建');
              } catch (verifyError) {
                console.error('[TerminalManager] ❌ 文件验证失败：auth.json 不存在!');
              }

              // 从环境变量中移除（已写入文件）
              delete fullEnv.CODEX_AUTH_JSON;
              delete fullEnv.CODEX_API_KEY; // 也删除 Token 环境变量
            }

            console.log(`[TerminalManager] ✅ Codex 配置文件创建成功，总耗时: ${Date.now() - perfStart}ms`);
          })();

          // ✅ 3秒超时保护（防止磁盘IO慢导致长时间阻塞）
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('创建 Codex 配置文件超时（3秒），可能是磁盘IO慢或杀毒软件扫描'));
            }, 3000);
          });

          // ✅ 竞速：哪个先完成用哪个
          await Promise.race([createFilesPromise, timeoutPromise]);
        });
      } catch (error) {
        console.error('[TerminalManager] ❌ 创建 Codex 配置文件失败:', error);
        throw new Error(`创建 Codex 配置文件失败: ${error}`);
      }
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
        errorDetectionEnabled: false, // 初始禁用，延迟5秒后启用
        errorDetectionTimer: undefined, // 初始无定时器
        waitingForNextInput: false, // 初始不等待用户输入
        timedOutputBuffer: [], // 初始化时间戳缓冲区
        codexConfigPath, // 保存 Codex 配置路径（用于清理）
      };

      this.sessions.set(sessionId, newSession);

      // ✅ 延迟5秒后启用错误检测（避免检测初始化输出）
      const detectionDelay = 5000;
      console.log(`[TerminalManager] ⏰ 将在 5秒 后启用错误检测:`, sessionId);

      const timer = setTimeout(() => {
        const session = this.sessions.get(sessionId);
        if (session && session.instanceId === currentInstanceId) {
          session.errorDetectionEnabled = true;
          session.errorDetectionTimer = undefined;
          console.log('[TerminalManager] ✅ 错误检测已启用 (首次创建):', sessionId);
        }
      }, detectionDelay);

      newSession.errorDetectionTimer = timer;

      // ✅ Windows 系统：启动后立即执行 chcp 65001 切换到 UTF-8 编码
      if (isWindows) {
        console.log('[TerminalManager] 执行 chcp 65001 切换到 UTF-8 编码');
        // 直接执行，xterm.js会自动捕获输出（避免重定向产生文件）
        ptyProcess.write('chcp 65001\r');
      }

      // ✅ 添加 PTY 数据监听器
      const dataListener = ptyProcess.onData((data: string) => {
        // 检查会话是否仍然有效
        const session = this.sessions.get(sessionId);
        if (!session || session.instanceId !== currentInstanceId) {
          return; // 会话已被删除或实例已过期，忽略数据
        }

        // ✅ 核心修复：在输出中检测 /resume 命令（因为用户可能通过历史命令选择）
        const cleanData = data.replace(/\x1b\[[0-9;]*m/g, ''); // 移除 ANSI
        if (cleanData.includes('/resume') || cleanData.includes('> /resume')) {
          console.log('[TerminalManager] 🔄 检测到 /resume 命令，禁用错误检测');

          // 禁用错误检测，等待用户下次输入
          session.errorDetectionEnabled = false;
          session.waitingForNextInput = true;

          // 清空时间戳缓冲区
          session.timedOutputBuffer = [];
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

      // ✅ 添加 PTY 退出监听器
      const exitListener = ptyProcess.onExit(({ exitCode }) => {
        // 只有当前实例才发送退出消息
        const currentSession = this.sessions.get(sessionId);
        if (currentSession && currentSession.instanceId === currentInstanceId) {
          this.sendOutput(sessionId, `\r\n\x1b[1;31m[进程已退出，退出码: ${exitCode}]\x1b[0m\r\n`, currentInstanceId);

          // ✅ 清理监听器
          if (currentSession.dataListener) {
            currentSession.dataListener.dispose();
          }
          if (currentSession.exitListener) {
            currentSession.exitListener.dispose();
          }

          this.sessions.delete(sessionId);
        }
      });

      // ✅ 保存监听器引用到会话对象
      const session = this.sessions.get(sessionId);
      if (session) {
        session.dataListener = dataListener;
        session.exitListener = exitListener;
      }

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

      // ✅ 新方案：检测 /resume 命令和用户再次输入
      const cleanInput = filteredData.trim().toLowerCase();

      if (cleanInput.startsWith('/resume')) {
        console.log('[TerminalManager] 🔄 检测到 /resume 命令，禁用错误检测');

        // 禁用错误检测，等待用户下次输入
        session.errorDetectionEnabled = false;
        session.waitingForNextInput = true;

        // 清空时间戳缓冲区
        session.timedOutputBuffer = [];
      } else if (session.waitingForNextInput) {
        // ✅ 核心修复：过滤掉控制键（方向键、回车、退格等）
        // 只有真正的文本命令才重新启用错误检测
        const isControlKey = /^[\x00-\x1f\x7f]$/.test(cleanInput) || // ASCII 控制字符
                             /^\x1b\[/.test(cleanInput); // ANSI 转义序列（方向键等）

        if (!isControlKey && cleanInput.length > 0) {
          // ✅ 用户再次输入真正的文本命令，重新启用错误检测
          const now = Date.now();
          console.log('[TerminalManager] ✅ 用户输入新命令，重新启用错误检测');

          // 清空缓冲区，只检测新的输出
          session.timedOutputBuffer = [];

          // 重置 errorDetected 标记，允许检测新的错误
          session.errorDetected = false;

          // 启用错误检测，并记录启用时间戳
          session.errorDetectionEnabled = true;
          session.errorDetectionEnabledAt = now;
          session.waitingForNextInput = false;
        }
      }

      // ✅ 直接写入所有数据，不分块（PTY 会自动处理缓冲区）
      session.process.write(filteredData);
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

    // ✅ 如果错误检测未启用，跳过检测（/resume 期间会被禁用）
    if (!session.errorDetectionEnabled) {
      return;
    }

    // 如果已经检测到错误，不再重复检测
    if (session.errorDetected) {
      return;
    }

    // ✅ 添加到时间戳缓冲区
    const now = Date.now();
    session.timedOutputBuffer.push({ timestamp: now, content: cleanData });

    // ✅ 移除超过10秒的旧数据
    session.timedOutputBuffer = session.timedOutputBuffer.filter(
      item => now - item.timestamp < 10000
    );

    // ✅ 核心修复：只检测错误检测启用之后的输出
    // 如果有 errorDetectionEnabledAt，则过滤掉启用前的输出
    let bufferToCheck = session.timedOutputBuffer;
    if (session.errorDetectionEnabledAt) {
      bufferToCheck = session.timedOutputBuffer.filter(
        item => item.timestamp >= session.errorDetectionEnabledAt!
      );
    }

    // ✅ 只检测3秒前的输出（给输出留出缓冲时间）
    const oldOutputs = bufferToCheck
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
        console.warn('[TerminalManager] ⚠️ 检测到可能的 Token 错误!!!');
        console.warn('[TerminalManager] Session ID:', sessionId);
        console.warn('[TerminalManager] 错误模式:', pattern.toString());
        console.warn('[TerminalManager] 错误内容长度:', oldOutputs.length);
        console.warn('[TerminalManager] 错误内容（前200字符）:', oldOutputs.substring(0, 200));
        console.warn('[TerminalManager] 错误内容（后200字符）:', oldOutputs.substring(Math.max(0, oldOutputs.length - 200)));
        console.warn('[TerminalManager] 原始数据（当前）:', cleanData.substring(0, 200));
        console.warn('[TerminalManager] 缓冲区项数:', session.timedOutputBuffer.length);
        console.warn('[TerminalManager] 会话创建时间:', new Date(session.createdAt).toLocaleString());
        console.warn('[TerminalManager] 错误检测启用时间:', now - session.createdAt, 'ms');
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

    console.log('[TerminalManager] 🛑 开始终止会话:', sessionId);

    // ✅ 1. 先移除 PTY 监听器，防止 EPIPE 错误
    if (session.dataListener) {
      session.dataListener.dispose();
      console.log('[TerminalManager] ✅ 已移除 dataListener');
    }
    if (session.exitListener) {
      session.exitListener.dispose();
      console.log('[TerminalManager] ✅ 已移除 exitListener');
    }

    // ✅ 2. 清除错误检测定时器
    if (session.errorDetectionTimer) {
      clearTimeout(session.errorDetectionTimer);
      console.log('[TerminalManager] ✅ 已清除错误检测定时器');
    }

    // ✅ 3. Codex 配置文件处理
    // 注意：会话独立配置目录 .codex-sessions/{sessionId}/ 不在此处理
    // 删除会话时由前端 SessionManager 负责移动到归档目录 .codex-sessions/archived/{sessionId}/
    // 保留对话历史，用户可随时恢复或手动清理归档
    if (session.codexConfigPath) {
      console.log('[TerminalManager] ℹ️  Codex 配置文件位于:', session.codexConfigPath);
      console.log('[TerminalManager] ℹ️  配置目录将由前端负责归档（保留对话历史）');
    }

    // ✅ 4. 最后才杀掉 PTY 进程
    try {
      session.process.kill();
      console.log('[TerminalManager] ✅ PTY 进程已终止');
      this.sessions.delete(sessionId);
    } catch (error) {
      console.error('[TerminalManager] ⚠️  终止 PTY 进程失败:', error);
      // 即使失败也删除会话记录
      this.sessions.delete(sessionId);
    }

    console.log('[TerminalManager] ✅ 会话终止完成:', sessionId);
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
    console.log('[TerminalManager] 🧹 开始清理所有会话...');

    this.sessions.forEach((session, sessionId) => {
      // ✅ 1. 移除 PTY 监听器
      if (session.dataListener) {
        session.dataListener.dispose();
      }
      if (session.exitListener) {
        session.exitListener.dispose();
      }

      // ✅ 2. 清除错误检测定时器
      if (session.errorDetectionTimer) {
        clearTimeout(session.errorDetectionTimer);
      }

      // ✅ 3. Codex 配置文件不在此处删除（由前端SessionManager负责归档）
      if (session.codexConfigPath) {
        console.log('[TerminalManager] ℹ️  保留 Codex 配置（将由前端归档）:', session.codexConfigPath);
      }

      // ✅ 4. 杀掉 PTY 进程
      try {
        session.process.kill();
      } catch (error) {
        // 忽略错误
      }
    });

    this.sessions.clear();
    console.log('[TerminalManager] ✅ 所有会话已清理');
  }
}

export default new TerminalManager();