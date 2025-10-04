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

const TerminalComponent: React.FC<TerminalComponentProps> = ({
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

  useEffect(() => {
    if (!terminalRef.current || createdRef.current) return;

    createdRef.current = true;

    const initTerminal = async () => {
      // 获取环境变量
      let envVars: Record<string, string> = env || {};
      try {
        const envResponse = await sessionAPI.getSessionEnvironment(sessionId);
        if (envResponse.data) {
          envVars = { ...envVars, ...envResponse.data };
        }
      } catch (error) {
        console.error('获取环境变量失败:', error);
      }

      const terminal = new Terminal({
      cursorBlink: true,
      fontSize: fontSize,
      fontFamily: 'Consolas, "Courier New", monospace',
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
    });

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
          // 检查是否是重新连接到已存在的会话
          const existed = (result as any)?.existed || false;

          if (existed) {
            // 会话已存在，重新连接
            console.log('[Terminal] 重新连接到已存在的会话:', sessionId);
            terminal.write('\r\n\x1b[1;32m[已恢复会话]\x1b[0m\r\n');
          } else {
            // 新创建的会话，等待 CMD 启动完成后自动执行用户命令
            if (command && command.trim() !== '' && command.toLowerCase() !== 'cmd.exe') {
              setTimeout(() => {
                window.electronAPI.terminalInput(sessionId, command + '\r').catch((error) => {
                  console.error('自动执行命令失败:', error);
                });
              }, 1000);
            }
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

    // 复制和粘贴功能
    terminal.attachCustomKeyEventHandler((event) => {
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

      // Ctrl+V 粘贴
      if ((event.ctrlKey || event.metaKey) && event.key === 'v' && event.type === 'keydown') {
        event.preventDefault();
        navigator.clipboard.readText().then(text => {
          if (text) {
            window.electronAPI.terminalInput(sessionId, text).catch((error) => {
              console.error('粘贴失败:', error);
            });
          }
        }).catch(err => {
          console.error('读取剪贴板失败:', err);
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

    // 窗口大小改变时自适应
    const handleResize = () => {
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
    };
    window.addEventListener('resize', handleResize);

    // 监听终端容器可见性变化，自动调整尺寸
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当终端变为可见时，重新调整尺寸
          if (entry.isIntersecting) {
            setTimeout(() => {
              try {
                fitAddon.fit();
                // 同步通知后端调整PTY大小
                const { cols, rows } = terminal;
                window.electronAPI.terminalResize(sessionId, cols, rows).catch((error) => {
                  console.error('调整终端大小失败:', error);
                });
              } catch (error) {
                console.error('终端自适应失败:', error);
              }
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

      // 取消监听输出
      unsubscribe();

      // 注意：不在这里终止终端会话
      // 终端会话的销毁由会话管理器在终止会话时控制
      // 这样可以保持会话持久化，关闭标签只是隐藏，不会销毁会话

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
};

export default TerminalComponent;