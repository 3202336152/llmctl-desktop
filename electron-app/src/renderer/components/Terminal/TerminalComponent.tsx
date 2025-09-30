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
  onClose?: () => void;
}

const TerminalComponent: React.FC<TerminalComponentProps> = ({
  sessionId,
  command,
  cwd,
  env,
  onClose
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const createdRef = useRef<boolean>(false);

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
      fontSize: 14,
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
          // 等待 CMD 启动完成后自动执行用户命令
          if (command && command.trim() !== '' && command.toLowerCase() !== 'cmd.exe') {
            setTimeout(() => {
              window.electronAPI.terminalInput(sessionId, command + '\r').catch((error) => {
                console.error('自动执行命令失败:', error);
              });
            }, 1000);
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

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);

      // 取消监听输出
      unsubscribe();

      // 终止终端会话
      window.electronAPI.terminalKill(sessionId).catch((error) => {
        console.error('终止终端会话失败:', error);
      });

      terminal.dispose();
    };
    }; // 闭合 initTerminal 函数

    // 调用异步初始化函数
    initTerminal();
  }, []); // 空依赖数组，只在挂载时执行一次

  return (
    <Card
      title={`终端 - 会话 ${sessionId.substring(0, 8)}`}
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
      <div
        ref={terminalRef}
        style={{
          width: '100%',
          height: '500px',
        }}
      />
    </Card>
  );
};

export default TerminalComponent;