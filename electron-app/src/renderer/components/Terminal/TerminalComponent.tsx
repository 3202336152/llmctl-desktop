import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Card, Button } from 'antd';
import {
  CloseOutlined,
} from '@ant-design/icons';
import { sessionAPI } from '../../services/api';
import { useAppSelector } from '../../store';

// ✅ 全局 fit 锁：防止多个终端同时执行 fit() 导致性能问题
let globalFitLock = false;
const fitQueue: Array<() => void> = [];

const processNextFit = () => {
  if (globalFitLock || fitQueue.length === 0) return;

  globalFitLock = true;
  const nextFit = fitQueue.shift();

  if (nextFit) {
    try {
      nextFit();
    } catch (error) {
      console.error('[TerminalComponent] fit() 执行失败:', error);
    } finally {
      globalFitLock = false;
      // 延迟处理下一个，避免阻塞主线程
      setTimeout(processNextFit, 50);
    }
  }
};

interface TerminalComponentProps {
  sessionId: string;
  command?: string;
  cwd?: string;
  env?: Record<string, string>;
  providerName?: string;
  onClose?: () => void;
  showCard?: boolean; // 是否显示外层Card
}

const TerminalComponent: React.FC<TerminalComponentProps> = React.memo(({
  sessionId,
  command,
  cwd,
  env,
  providerName,
  onClose,
  showCard = true,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const createdRef = useRef<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(16); // 默认字体大小
  const fitDebounceTimerRef = useRef<NodeJS.Timeout | null>(null); // ✅ fit() 防抖定时器
  const intersectionTimerRef = useRef<NodeJS.Timeout | null>(null); // ✅ IntersectionObserver 延迟定时器

  // ✅ 从 Redux store 获取 session 数据（包含 environmentVariables）
  const session = useAppSelector((state) =>
    state.session.sessions.find((s) => s.id === sessionId)
  );

  // ✅ 获取当前打开的终端列表（用于可见性判断）
  const openTerminalSessions = useAppSelector((state) => state.session.openTerminalSessions);

  useEffect(() => {
    if (!terminalRef.current || createdRef.current) return;

    createdRef.current = true;

    const initTerminal = async () => {
      // IME 输入法组合状态跟踪（声明在最前面，让所有后续代码都能访问）
      let isComposing = false;
      let compositionText = '';
      let lastInputValue = '';
      let lastIMEInput = ''; // 记录最后一次 IME 输入，防止重复发送
      let imeInputTime = 0; // 记录 IME 输入时间
      let pendingSend = new Set<string>(); // 记录待发送的文本（用于去重）

      // 性能监控：记录初始化开始时间
      const perfStart = performance.now();
      console.log('[TerminalComponent] 🚀 开始初始化终端（乐观渲染），Session ID:', sessionId);

      // ✅ 步骤1：立即创建并渲染 Terminal UI（不等待环境变量）
      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: fontSize,
        fontFamily: 'Consolas, "Courier New", monospace',
        convertEol: true,
        windowsMode: false,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
        rows: 30,
        cols: 120,
        allowTransparency: true,
        scrollback: 5000,
      });

      console.log(`[TerminalComponent] ✅ Terminal 对象创建耗时: ${(performance.now() - perfStart).toFixed(2)}ms`);

      // 添加插件
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      // ✅ 步骤2：立即打开终端（渲染到DOM，用户立刻看到）
      if (terminalRef.current) {
        terminal.open(terminalRef.current);
        console.log(`[TerminalComponent] ✅ 终端UI渲染完成，耗时: ${(performance.now() - perfStart).toFixed(2)}ms`);
      }

      // ✅ 步骤3：显示初始化提示
      terminal.writeln('\x1b[1;34m🚀 正在初始化会话...\x1b[0m');
      terminal.writeln('');

      // 延迟调用 fit，确保终端完全初始化
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (error) {
          console.error('终端自适应失败:', error);
        }
      }, 0);

      // ✅ 步骤4：异步获取环境变量（不阻塞UI）
      const getEnvVars = async (): Promise<Record<string, string>> => {
        let envVars: Record<string, string> = env || {};

        if (session?.environmentVariables) {
          // 如果 session 中已包含环境变量（来自 startSession 响应），直接使用
          envVars = { ...envVars, ...session.environmentVariables };
          console.log('[TerminalComponent] ✅ 使用 session 中的环境变量，无需额外请求');
          return envVars;
        }

        // 如果没有环境变量（旧会话或异常情况），回退到 API 请求
        try {
          const envStart = performance.now();
          terminal.writeln('\x1b[33m⏳ 正在获取环境配置...\x1b[0m');

          const envResponse: any = await Promise.race([
            sessionAPI.getSessionEnvironment(sessionId),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('获取环境变量超时(5秒)')), 5000)
            )
          ]);

          console.log(`[TerminalComponent] API 获取环境变量耗时: ${(performance.now() - envStart).toFixed(2)}ms`);

          if (envResponse.data) {
            envVars = { ...envVars, ...envResponse.data };
            console.log('[TerminalComponent] ⚠️ 通过 API 获取环境变量（回退方案）');
          }
        } catch (error: any) {
          console.error('[TerminalComponent] 获取环境变量失败:', error);

          // 如果会话不存在（404错误），不继续初始化终端
          if (error?.response?.status === 404 || error?.code === 404) {
            console.error('[TerminalComponent] 会话不存在，停止初始化终端:', sessionId);
            terminal.writeln('\x1b[1;31m❌ 会话不存在，请重新创建\x1b[0m');
            createdRef.current = false;
            throw error;
          }

          // 其他错误只警告，继续初始化（使用默认环境变量）
          console.warn('[TerminalComponent] 使用默认环境变量继续初始化');
          terminal.writeln('\x1b[33m⚠️  使用默认配置继续...\x1b[0m');
        }

        return envVars;
      };

      // ✅ 步骤5：并行执行环境变量获取和 PTY 创建准备
      try {
        const envVars = await getEnvVars();

        terminal.writeln('\x1b[33m⏳ 正在启动终端进程...\x1b[0m');
        terminal.writeln('');

    // 创建Electron终端会话
    // 注意：不传递 command 参数，让 terminalManager 根据操作系统自动选择 shell
    window.electronAPI
      .terminalCreate({
        sessionId,
        cwd,
        env: envVars,
      })
      .then((result) => {
        if (result && !result.success) {
          terminal.write(`\r\n\x1b[1;31m❌ [错误] 创建失败: ${(result as any).error}\x1b[0m\r\n`);
        } else {
          // ✅ 成功初始化，显示欢迎信息
          terminal.write('\x1b[2K\r'); // 清除当前行
          terminal.writeln('\x1b[1;32m✅ 会话初始化完成\x1b[0m');
          terminal.writeln('');
          console.log(`[TerminalComponent] ✅ 终端初始化完成，总耗时: ${(performance.now() - perfStart).toFixed(2)}ms`);

          // 如果会话配置了命令，自动执行该命令
          if (command) {
            setTimeout(() => {
              window.electronAPI.terminalInput(sessionId, `${command}\r`).catch((error) => {
                console.error('自动执行命令失败:', error);
              });
            }, 100);
          }
        }
      })
      .catch((error) => {
        console.error('创建终端会话失败:', error);
        terminal.write('\r\n\x1b[1;31m❌ [错误] 无法创建终端会话\x1b[0m\r\n');
      });
    } catch (error) {
      // 捕获 getEnvVars 的异常（如会话不存在）
      console.error('[TerminalComponent] 初始化失败:', error);
      terminal.writeln('\x1b[1;31m❌ 初始化失败，请重试\x1b[0m');
      return; // 停止初始化
    }

    // 监听终端输出
    const unsubscribe = window.electronAPI.onTerminalOutput((data) => {
      if (data.sessionId === sessionId) {
        terminal.write(data.data);
      }
    });

    // 处理用户输入
    terminal.onData((data) => {
      // 延迟 20ms 发送，让 input 事件有机会先处理
      setTimeout(() => {
        const now = Date.now();
        const timeDiff = now - imeInputTime;

        // 如果在 pendingSend 中，说明 input 事件正在处理，跳过
        if (pendingSend.has(data)) {
          return;
        }

        // 如果是刚刚发送过的 IME 输入（200ms 内），跳过
        if (data === lastIMEInput && timeDiff < 200) {
          return;
        }

        window.electronAPI.terminalInput(sessionId, data).catch((error) => {
          console.error('发送输入失败:', error);
        });
      }, 20);
    });

    // 优化的粘贴逻辑：直接发送全部内容
    const handlePaste = async (text: string) => {
      if (!text) return;

      try {
        await window.electronAPI.terminalInput(sessionId, text);
      } catch (error) {
        console.error('[粘贴] 发送失败:', error);
      }
    };

    // 输入法组合事件处理器
    const handleCompositionStart = (event: CompositionEvent) => {
      isComposing = true;
      compositionText = '';
    };

    const handleCompositionUpdate = (event: CompositionEvent) => {
      compositionText = event.data || '';
    };

    const handleCompositionEnd = (event: CompositionEvent) => {
      isComposing = false;
      const finalText = event.data || compositionText;
      const target = event.target as HTMLTextAreaElement;

      if (finalText) {
        // 立即加入 pendingSend，阻止 onData 发送
        pendingSend.add(finalText);

        // 记录这次 IME 输入
        lastIMEInput = finalText;
        imeInputTime = Date.now();

        // 发送到终端
        window.electronAPI.terminalInput(sessionId, finalText)
          .then(() => {
            // 发送成功后，延迟 50ms 移除（确保 onData 有足够时间检查）
            setTimeout(() => {
              pendingSend.delete(finalText);
            }, 50);
          })
          .catch((error) => {
            console.error('[IME] 发送组合文本失败:', error);
            pendingSend.delete(finalText);
          });

        // 清空 textarea，防止 xterm.js 重复读取
        target.value = '';
      }

      compositionText = '';

      // 阻止事件继续传播
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    // 处理 input 事件（某些输入法不触发 composition 事件，直接使用 input 事件）
    const handleInput = (event: Event) => {
      const inputEvent = event as InputEvent;
      const target = event.target as HTMLTextAreaElement;

      // 如果正在组合，跳过（由 compositionend 处理）
      if (inputEvent.isComposing || isComposing) {
        lastInputValue = target.value;
        return;
      }

      // 检测输入法直接提交的文本（没有走 composition 流程）
      if (inputEvent.inputType === 'insertText' && inputEvent.data) {
        const text = inputEvent.data;

        // 立即加入 pendingSend，阻止 onData 发送
        pendingSend.add(text);

        // 记录这次 IME 输入
        lastIMEInput = text;
        imeInputTime = Date.now();

        // 清空 textarea（防止文本累积）
        target.value = '';
        lastInputValue = '';

        // 发送到终端
        window.electronAPI.terminalInput(sessionId, text)
          .then(() => {
            // 发送成功后，延迟 50ms 移除（确保 onData 有足够时间检查）
            setTimeout(() => {
              pendingSend.delete(text);
            }, 50);
          })
          .catch((error) => {
            console.error('[IME] 发送文本失败:', error);
            pendingSend.delete(text);
          });

        // 阻止 xterm.js 的默认处理（避免重复）
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        lastInputValue = target.value;
      }
    };

    // 等待 terminal 初始化后，找到 xterm.js 内部的 textarea 并添加监听器
    setTimeout(() => {
      if (!terminalRef.current) return;

      // xterm.js 的 textarea 通常有 class="xterm-helper-textarea"
      const textarea = terminalRef.current.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement;

      if (textarea) {
        // 使用捕获阶段（第三个参数为 true），在 xterm.js 处理之前拦截事件
        textarea.addEventListener('compositionstart', handleCompositionStart as EventListener, true);
        textarea.addEventListener('compositionupdate', handleCompositionUpdate as EventListener, true);
        textarea.addEventListener('compositionend', handleCompositionEnd as EventListener, true);
        textarea.addEventListener('input', handleInput, true);
      } else {
        console.error('[IME] 未找到 xterm textarea，IME 功能可能无法正常工作');
        // 如果找不到，尝试添加到外层容器（回退方案）
        if (terminalRef.current) {
          terminalRef.current.addEventListener('compositionstart', handleCompositionStart as EventListener, true);
          terminalRef.current.addEventListener('compositionupdate', handleCompositionUpdate as EventListener, true);
          terminalRef.current.addEventListener('compositionend', handleCompositionEnd as EventListener, true);
          terminalRef.current.addEventListener('input', handleInput, true);
        }
      }
    }, 100);

    // 复制、粘贴和换行功能
    terminal.attachCustomKeyEventHandler((event) => {
      // 如果正在使用输入法（IME 组合状态），不拦截任何键盘事件
      if (isComposing) {
        return true;
      }

      // Ctrl+C 复制
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && event.type === 'keydown') {
        const selection = terminal.getSelection();
        if (selection) {
          event.preventDefault();
          navigator.clipboard.writeText(selection).catch(err => {
            console.error('复制失败:', err);
          });
          return false;
        }
      }

      // Ctrl+V 粘贴（使用优化的粘贴逻辑）
      if ((event.ctrlKey || event.metaKey) && event.key === 'v' && event.type === 'keydown') {
        event.preventDefault();
        navigator.clipboard.readText().then(text => {
          if (text) {
            handlePaste(text);
          }
        }).catch(err => {
          console.error('读取剪贴板失败:', err);
        });
        return false;
      }

      // Ctrl+Enter 换行（不执行命令）
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && event.type === 'keydown') {
        event.preventDefault();
        // 发送换行符 \n，而不是回车符 \r
        window.electronAPI.terminalInput(sessionId, '\n').catch((error) => {
          console.error('发送换行失败:', error);
        });
        return false;
      }

      return true;
    });

    terminal.onSelectionChange(() => {
      // 选择文本变化时的处理（保留用于未来扩展）
    });

    // 保存引用
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // ✅ 防抖 fit() 调用，使用全局锁避免并发执行
    const debouncedFit = () => {
      if (fitDebounceTimerRef.current) {
        clearTimeout(fitDebounceTimerRef.current);
      }

      fitDebounceTimerRef.current = setTimeout(() => {
        // 加入全局队列，确保串行执行
        fitQueue.push(() => {
          if (fitAddonRef.current && xtermRef.current) {
            try {
              fitAddonRef.current.fit();
              // 通知后端调整PTY大小
              const { cols, rows } = xtermRef.current;
              window.electronAPI.terminalResize(sessionId, cols, rows).catch((error) => {
                console.error('[TerminalComponent] 调整终端大小失败:', error);
              });
            } catch (error) {
              console.error('[TerminalComponent] 终端自适应失败:', error);
            }
          }
        });
        processNextFit(); // 触发队列处理
      }, 300); // ✅ 增加防抖延迟到 300ms
    };

    // ✅ 窗口大小改变时自适应（只在终端可见时执行）
    const handleResize = () => {
      // ✅ 检查终端是否在打开列表中，避免隐藏终端触发 fit()
      if (!openTerminalSessions.includes(sessionId)) {
        console.log(`[TerminalComponent] resize 事件忽略（终端未打开）: ${sessionId}`);
        return;
      }

      // ✅ 检查 DOM 元素是否真正可见
      if (terminalRef.current) {
        const rect = terminalRef.current.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 &&
                          window.getComputedStyle(terminalRef.current).visibility !== 'hidden';

        if (!isVisible) {
          console.log(`[TerminalComponent] resize 事件忽略（DOM 不可见）: ${sessionId}`);
          return;
        }
      }

      console.log(`[TerminalComponent] resize 事件触发 fit(): ${sessionId}`);
      debouncedFit();
    };
    window.addEventListener('resize', handleResize);

    // 右键粘贴功能
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // 阻止默认右键菜单

      // 触发粘贴操作
      navigator.clipboard.readText().then(text => {
        if (text) {
          // 使用优化的粘贴逻辑
          handlePaste(text);
        }
      }).catch(err => {
        console.error('读取剪贴板失败:', err);
      });
    };

    // 添加右键粘贴监听
    if (terminalRef.current) {
      terminalRef.current.addEventListener('contextmenu', handleContextMenu);
    }

    // ✅ 监听终端容器可见性变化，自动调整尺寸
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // ✅ 严格的可见性检查：
          // 1. DOM 可见（isIntersecting）
          // 2. 至少 20% 可见（intersectionRatio）
          // 3. 在 Redux openTerminalSessions 列表中
          const isTerminalOpen = openTerminalSessions.includes(sessionId);
          const isActuallyVisible = entry.isIntersecting && entry.intersectionRatio >= 0.2;

          if (isActuallyVisible && isTerminalOpen) {
            // 清除旧的延迟定时器
            if (intersectionTimerRef.current) {
              clearTimeout(intersectionTimerRef.current);
            }

            // ✅ 增加延迟到 500ms，确保容器尺寸稳定且避免频繁触发
            intersectionTimerRef.current = setTimeout(() => {
              console.log(`[TerminalComponent] IntersectionObserver 触发 fit()，Session ID: ${sessionId}`);
              debouncedFit();
            }, 500);
          }
        });
      },
      { threshold: [0, 0.2, 0.5, 1.0] } // ✅ 增加检测阈值，避免误触发
    );

    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();

      // ✅ 清理所有定时器
      if (fitDebounceTimerRef.current) {
        clearTimeout(fitDebounceTimerRef.current);
      }
      if (intersectionTimerRef.current) {
        clearTimeout(intersectionTimerRef.current);
      }

      // 移除右键菜单监听
      const container = terminalRef.current;
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu);

        // 移除 IME 事件监听器
        const textarea = container.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.removeEventListener('compositionstart', handleCompositionStart as EventListener, true);
          textarea.removeEventListener('compositionupdate', handleCompositionUpdate as EventListener, true);
          textarea.removeEventListener('compositionend', handleCompositionEnd as EventListener, true);
          textarea.removeEventListener('input', handleInput, true);
        } else {
          // 如果没找到 textarea，尝试从外层容器移除（回退方案）
          container.removeEventListener('compositionstart', handleCompositionStart as EventListener, true);
          container.removeEventListener('compositionupdate', handleCompositionUpdate as EventListener, true);
          container.removeEventListener('compositionend', handleCompositionEnd as EventListener, true);
          container.removeEventListener('input', handleInput, true);
        }
      }

      // 取消监听输出
      unsubscribe();

      // 组件卸载时仅清理前端资源
      // pty 进程由 TerminalManager 的 handleCloseTerminal 显式终止
      createdRef.current = false;

      terminal.dispose();
    };
    }; // 闭合 initTerminal 函数

    // 调用异步初始化函数
    initTerminal();
  }, []); // 空依赖数组，只在挂载时执行一次

  // 监听字体大小变化，更新终端字体
  useEffect(() => {
    if (!xtermRef.current || !fitAddonRef.current) return;

    // 更新终端字体大小
    xtermRef.current.options.fontSize = fontSize;

    // 重新调整尺寸以适应新字体
    setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
        // 同步通知后端调整PTY大小
        if (xtermRef.current) {
          const { cols, rows } = xtermRef.current;
          window.electronAPI.terminalResize(sessionId, cols, rows).catch((error) => {
            console.error('调整终端大小失败:', error);
          });
        }
      } catch (error) {
        console.error('终端自适应失败:', error);
      }
    }, 50);
  }, [fontSize, sessionId]);

  // Ctrl + 鼠标滚轮调整字体大小
  useEffect(() => {
    if (!terminalRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      // 只有按下 Ctrl 键时才调整字体
      if (e.ctrlKey) {
        e.preventDefault();

        setFontSize((prevSize) => {
          let newSize = prevSize;

          // deltaY < 0 表示向上滚动（放大），> 0 表示向下滚动（缩小）
          if (e.deltaY < 0) {
            newSize = Math.min(prevSize + 1, 30); // 最大 30px
          } else {
            newSize = Math.max(prevSize - 1, 8); // 最小 8px
          }

          return newSize;
        });
      }
    };

    const container = terminalRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // ✅ 监听来自 TerminalManager 的滚动到底部事件
  useEffect(() => {
    const handleScrollEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.sessionId === sessionId) {
        if (xtermRef.current) {
          xtermRef.current.scrollToBottom();
        }
      }
    };

    window.addEventListener('terminal-scroll-to-bottom', handleScrollEvent);

    return () => {
      window.removeEventListener('terminal-scroll-to-bottom', handleScrollEvent);
    };
  }, [sessionId]);

  const terminalDiv = (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: showCard ? '500px' : '100%',
        minHeight: showCard ? '500px' : '100%',
        position: 'relative',
      }}
    />
  );

  if (!showCard) {
    return terminalDiv;
  }

  return (
    <Card
      title={`终端 - ${providerName || sessionId.substring(0, 8)}`}
      style={{ marginTop: 16 }}
      extra={
        onClose && (
          <Button
            type="text"
            danger
            icon={<CloseOutlined />}
            onClick={onClose}
          >
            关闭终端
          </Button>
        )
      }
    >
      {terminalDiv}
    </Card>
  );
});

// 添加显示名称以便调试
TerminalComponent.displayName = 'TerminalComponent';

export default TerminalComponent;