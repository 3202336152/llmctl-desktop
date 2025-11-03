import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Card, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { sessionAPI } from '../../services/api';

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

  useEffect(() => {
    if (!terminalRef.current || createdRef.current) return;

    createdRef.current = true;

    const initTerminal = async () => {
      // 性能监控：记录初始化开始时间
      const perfStart = performance.now();
      console.log('[TerminalComponent] 开始初始化终端，Session ID:', sessionId);

      // 获取环境变量
      let envVars: Record<string, string> = env || {};
      try {
        const envStart = performance.now();

        // 添加超时保护（5秒超时）
        const envResponse: any = await Promise.race([
          sessionAPI.getSessionEnvironment(sessionId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('获取环境变量超时(5秒)')), 5000)
          )
        ]);

        console.log(`[TerminalComponent] 获取环境变量耗时: ${(performance.now() - envStart).toFixed(2)}ms`);

        if (envResponse.data) {
          envVars = { ...envVars, ...envResponse.data };
          console.log('[TerminalComponent] 成功获取环境变量');
        }
      } catch (error: any) {
        console.error('[TerminalComponent] 获取环境变量失败:', error);

        // 如果会话不存在（404错误），不继续初始化终端
        if (error?.response?.status === 404 || error?.code === 404) {
          console.error('[TerminalComponent] 会话不存在，停止初始化终端:', sessionId);
          createdRef.current = false; // 重置标记，允许重试
          return;
        }

        // 其他错误只警告，继续初始化（使用默认环境变量）
        console.warn('[TerminalComponent] 使用默认环境变量继续初始化');
      }

      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: fontSize,
        fontFamily: 'Consolas, "Courier New", monospace',
        // 设置字符编码为 UTF-8，避免中文乱码
        convertEol: true,
        // Windows PowerShell 模式禁用（使用 CMD）
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
        // 性能优化：限制滚动缓冲区大小，避免内存占用过高
        scrollback: 5000,
      });

      console.log(`[TerminalComponent] Terminal 对象创建耗时: ${(performance.now() - perfStart).toFixed(2)}ms`);

    // 添加插件
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // 打开终端
    if (terminalRef.current) {
      terminal.open(terminalRef.current);
    }

    // 延迟调用 fit，确保终端完全初始化
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (error) {
        console.error('终端自适应失败:', error);
      }
    }, 0);

    // 创建Electron终端会话
    window.electronAPI
      .terminalCreate({
        sessionId,
        command: 'cmd.exe',
        cwd,
        env: envVars,
      })
      .then((result) => {
        if (result && !result.success) {
          terminal.write(`\r\n\x1b[1;31m[错误] 创建失败: ${(result as any).error}\x1b[0m\r\n`);
        } else {
          // 每次打开都是全新的 pty 进程，无历史记录恢复
          // 如果会话配置了命令，自动执行该命令
          if (command && command !== 'cmd.exe') {
            // 延迟100ms确保pty完全初始化后再发送命令
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
        terminal.write('\r\n\x1b[1;31m[错误] 无法创建终端会话\x1b[0m\r\n');
      });

    // 监听终端输出
    const unsubscribe = window.electronAPI.onTerminalOutput((data) => {
      if (data.sessionId === sessionId) {
        terminal.write(data.data);
      }
    });

    // 处理用户输入
    terminal.onData((data) => {
      window.electronAPI.terminalInput(sessionId, data).catch((error) => {
        console.error('发送输入失败:', error);
      });
    });

    // 优化的粘贴逻辑：直接发送全部内容，移除分块逻辑
    const handlePaste = async (text: string) => {
      if (!text) {
        console.log('[粘贴] 内容为空，跳过');
        return;
      }

      // 打印调试信息
      console.log(`[粘贴] 接收到内容，长度: ${text.length} 字符`);
      console.log(`[粘贴] 内容预览（前100字符）: ${text.substring(0, 100)}...`);

      // 直接发送全部内容，不分块
      try {
        await window.electronAPI.terminalInput(sessionId, text);
        console.log(`[粘贴] 发送完成`);
      } catch (error) {
        console.error('[粘贴] 发送失败:', error);
      }
    };

    // 输入法组合状态跟踪
    let isComposing = false;
    let compositionText = '';
    let lastInputValue = '';

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

      if (finalText) {
        window.electronAPI.terminalInput(sessionId, finalText).catch((error) => {
          console.error('[IME] 发送组合文本失败:', error);
        });
      }

      compositionText = '';
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
        // 清空 textarea（防止文本累积）
        target.value = '';
        lastInputValue = '';

        // 发送到终端
        window.electronAPI.terminalInput(sessionId, inputEvent.data).catch((error) => {
          console.error('[IME] 发送文本失败:', error);
        });

        // 阻止 xterm.js 的默认处理（避免重复）
        event.preventDefault();
        event.stopPropagation();
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

    // 防抖 fit() 调用，避免频繁调整导致性能问题
    const debouncedFit = () => {
      if (fitDebounceTimerRef.current) {
        clearTimeout(fitDebounceTimerRef.current);
      }

      fitDebounceTimerRef.current = setTimeout(() => {
        if (fitAddonRef.current && xtermRef.current) {
          try {
            fitAddonRef.current.fit();
            // 通知后端调整PTY大小
            const { cols, rows } = xtermRef.current;
            window.electronAPI.terminalResize(sessionId, cols, rows).catch((error) => {
              console.error('调整终端大小失败:', error);
            });
          } catch (error) {
            console.error('终端自适应失败:', error);
          }
        }
      }, 200); // 200ms 防抖延迟
    };

    // 窗口大小改变时自适应（使用防抖）
    const handleResize = () => {
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

    // 监听终端容器可见性变化，自动调整尺寸（使用防抖）
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当终端变为可见时，重新调整尺寸
          if (entry.isIntersecting) {
            setTimeout(() => {
              debouncedFit();
            }, 100); // 延迟 100ms 确保容器尺寸已稳定
          }
        });
      },
      { threshold: 0.1 } // 当至少 10% 的元素可见时触发
    );

    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();

      // 清理防抖定时器
      if (fitDebounceTimerRef.current) {
        clearTimeout(fitDebounceTimerRef.current);
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

    // 终端初始化完成
    console.log(`[TerminalComponent] 终端初始化完成，耗时: ${(performance.now() - perfStart).toFixed(2)}ms`);
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

  const terminalDiv = (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: showCard ? '500px' : '100%',
        minHeight: showCard ? '500px' : '100%',
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