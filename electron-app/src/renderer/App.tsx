import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Button, Tabs, Card, Space, Tag, message, Modal, ConfigProvider, App as AntApp } from 'antd';
import {
  DatabaseOutlined,
  KeyOutlined,
  DesktopOutlined,
  SettingOutlined,
  BarChartOutlined,
  FolderOutlined,
  ExpandOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './store';
import type { RootState } from './store';
import { closeTerminal, setActiveTab, addSession, removeSession, openTerminal, destroyTerminal, toggleTerminalFullscreen } from './store/slices/sessionSlice';
import ProviderManager from './components/Provider/ProviderManager';
import TokenManager from './components/Token/TokenManager';
import SessionManager from './components/Session/SessionManager';
import Settings from './components/Settings/Settings';
import Statistics from './components/Statistics/Statistics';
import ErrorBoundary from './components/Common/ErrorBoundary';
import NotificationManager from './components/Common/NotificationManager';
import CommandPalette from './components/Common/CommandPalette';
import TerminalComponent from './components/Terminal/TerminalComponent';
import { ResizableSider, StatusBar, TopBar } from './components/Layout';
import { configAPI, sessionAPI } from './services/api';
import { ConfigImportRequest, StartSessionRequest } from './types';
import './i18n'; // 引入 i18n 配置
import './styles/global.css'; // 引入全局样式
import './styles/App.css'; // 引入应用样式
import { useTranslation } from 'react-i18next';
import { lightTheme } from './theme'; // 引入亮色主题配置

const { Content } = Layout;

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { modal } = AntApp.useApp(); // 使用 useApp hook
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const { sessions, createdTerminalSessions, openTerminalSessions, activeTabKey, terminalSessionData, isTerminalFullscreen } = useAppSelector((state: RootState) => state.session);
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 加载初始设置（语言和托盘）
  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        const response = await configAPI.getGlobalConfigs();
        const configs = response.data || [];

        configs.forEach(config => {
          switch (config.configKey) {
            case 'app.language':
              if (config.configValue && config.configValue !== i18n.language) {
                i18n.changeLanguage(config.configValue);
                window.electronAPI?.send('set-menu-language', config.configValue);
              }
              break;
            case 'app.minimize_to_tray':
              const minimizeToTray = config.configValue === 'true';
              window.electronAPI?.send('enable-tray', minimizeToTray);
              break;
          }
        });
      } catch (error) {
        console.error('[App] 加载初始设置失败:', error);
      }
    };

    loadInitialSettings();
  }, [i18n]);

  // 全局监听菜单栏的导入导出消息
  useEffect(() => {
    const handleImportFromMenu = async (filePath: string) => {
      console.log('[导入] 收到文件路径:', filePath);
      try {
        // 读取文件
        const content = await window.electronAPI.readFile(filePath);
        console.log('[导入] 文件内容长度:', content.length);

        // 解析 JSON
        let data;
        try {
          data = JSON.parse(content);
          console.log('[导入] JSON解析成功');
        } catch (e) {
          console.error('[导入] JSON解析失败:', e);
          message.error('文件格式错误，请选择有效的JSON配置文件');
          return;
        }

        // 调用后端 API 导入
        const request: ConfigImportRequest = {
          format: 'json',
          data: content,
          overwrite: true,
        };

        console.log('[导入] 调用后端API...');
        const response = await configAPI.importConfig(request);
        console.log('[导入] 后端响应:', response);

        message.success('配置导入成功！');
      } catch (error) {
        console.error('[导入] 失败:', error);
        message.error(`导入配置失败: ${error}`);
      }
    };

    const handleExportFromMenu = async (filePath: string) => {
      console.log('[导出] 收到文件路径:', filePath);
      try {
        // 从后端获取配置
        console.log('[导出] 调用后端API...');
        const response = await configAPI.exportConfig('json');
        console.log('[导出] 后端响应:', response);

        const content = response.data?.content || '';
        console.log('[导出] 配置内容长度:', content.length);

        // 写入文件
        const success = await window.electronAPI.writeFile(filePath, content);
        console.log('[导出] 文件写入结果:', success);

        if (success) {
          message.success('配置导出成功！');
        } else {
          message.error('配置导出失败');
        }
      } catch (error) {
        console.error('[导出] 失败:', error);
        message.error(`导出配置失败: ${error}`);
      }
    };

    console.log('[App] 注册导入导出监听器');
    // 注册监听器
    const unsubscribeImport = window.electronAPI.onImportConfig(handleImportFromMenu);
    const unsubscribeExport = window.electronAPI.onExportConfig(handleExportFromMenu);

    // 清理监听器
    return () => {
      console.log('[App] 清理导入导出监听器');
      unsubscribeImport();
      unsubscribeExport();
    };
  }, []);

  // 监听 Token 切换要求
  useEffect(() => {
    const handleTokenSwitchRequired = async (data: { sessionId: string; errorMessage: string }) => {
      try {
        // 获取当前会话信息
        const failedSession = sessions.find(s => s.id === data.sessionId);
        if (!failedSession) {
          message.error('无法找到失效的会话');
          return;
        }

        // 显示确认对话框
        const confirmed = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: 'Token 已失效',
            content: `当前 Token 已失效，是否自动重启会话以切换到新 Token？`,
            okText: '重启会话',
            cancelText: '稍后手动处理',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (!confirmed) {
          return;
        }

        // 1. 终止Electron端的终端进程
        try {
          await window.electronAPI.terminalKill(data.sessionId);
        } catch (error) {
          console.error('终止终端进程失败:', error);
        }

        // 2. 销毁前端终端实例
        dispatch(destroyTerminal(data.sessionId));

        // 3. 删除旧会话（直接从数据库清除，不保留记录）
        await sessionAPI.deleteSession(data.sessionId);
        dispatch(removeSession(data.sessionId));

        // 4. 创建新会话（使用相同的配置）
        const newSessionRequest: StartSessionRequest = {
          providerId: failedSession.providerId,
          workingDirectory: failedSession.workingDirectory,
          command: failedSession.command,
        };

        const response = await sessionAPI.startSession(newSessionRequest);
        if (response.data) {
          dispatch(addSession(response.data));
          dispatch(openTerminal(response.data.id));
          message.success('会话已重启，已切换到新 Token');
        }
      } catch (error) {
        console.error('[App] 重启会话失败:', error);
        message.error(`重启会话失败: ${error}`);
      }
    };

    const unsubscribe = window.electronAPI.onTokenSwitchRequired(handleTokenSwitchRequired);

    return () => {
      unsubscribe();
    };
  }, [sessions, dispatch]);

  // 全局快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K 打开命令面板
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteVisible(true);
      }
      // F11 切换全屏
      else if (e.key === 'F11') {
        e.preventDefault();
        dispatch(toggleTerminalFullscreen());
      }
      // ESC 退出全屏或关闭命令面板
      else if (e.key === 'Escape') {
        if (commandPaletteVisible) {
          e.preventDefault();
          setCommandPaletteVisible(false);
        } else if (isTerminalFullscreen) {
          e.preventDefault();
          dispatch(toggleTerminalFullscreen());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isTerminalFullscreen, commandPaletteVisible]);

  // 监听全屏状态变化，触发终端尺寸调整
  useEffect(() => {
    // 多次触发 resize 事件，确保终端正确适配
    const timers: NodeJS.Timeout[] = [];

    // 立即触发一次
    window.dispatchEvent(new Event('resize'));

    // 然后在不同时间点再触发，确保 DOM 完全渲染
    [50, 150, 300].forEach(delay => {
      timers.push(setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, delay));
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isTerminalFullscreen]);

  // 是否在会话管理页面
  const isSessionPage = location.pathname === '/sessions';

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'terminated':
        return 'red';
      default:
        return 'default';
    }
  };

  // 处理关闭终端
  const handleCloseTerminal = (sessionId: string) => {
    dispatch(closeTerminal(sessionId));

    // 检查关闭后是否还有其他打开的终端
    // openTerminalSessions还包含即将被关闭的这个，所以长度为1表示这是最后一个
    if (openTerminalSessions.length === 1 && isTerminalFullscreen) {
      // 如果关闭最后一个终端且当前处于全屏状态，自动退出全屏
      dispatch(toggleTerminalFullscreen());
    }
  };

  // 生成标签页数据 - Tabs只用于导航，不包含实际的终端组件
  const tabItems = openTerminalSessions.map(sessionId => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;

    const workingDirName = session.workingDirectory.split(/[\\/]/).filter(Boolean).pop() || 'Terminal';

    return {
      key: sessionId,
      label: (
        <Space size={4}>
          <FolderOutlined />
          <span>{workingDirName}</span>
          <Tag color={getStatusColor(session.status)} style={{ marginLeft: 4, marginRight: 0 }}>
            {session.providerName || session.id.substring(0, 8)}
          </Tag>
        </Space>
      ),
      // 空内容，实际的终端在外部渲染
      children: <div style={{ height: '100%' }} />,
      closable: true,
    };
  }).filter(item => item !== null);

  // 渲染所有已创建的终端实例，所有终端始终可见，通过z-index叠加
  const allTerminalComponents = createdTerminalSessions.map(sessionId => {
    const session = terminalSessionData[sessionId];

    // 判断该终端是否应该在最上层
    const isActive = openTerminalSessions.includes(sessionId) && activeTabKey === sessionId;

    // 如果session数据不存在，使用默认值确保组件不被卸载
    const sessionData = session || {
      id: sessionId,
      command: 'claude',
      workingDirectory: 'D:\\',
      providerName: '',
      providerId: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 无条件渲染TerminalComponent，确保组件永远不被卸载
    return (
      <div
        key={sessionId}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: isActive ? 10 : 1,
          visibility: openTerminalSessions.includes(sessionId) ? 'visible' : 'hidden',
        }}
      >
        <TerminalComponent
          sessionId={sessionId}
          command={sessionData.command}
          cwd={sessionData.workingDirectory}
          providerName={sessionData.providerName}
          showCard={false}
        />
      </div>
    );
  });

  const menuItems = [
    {
      key: '/providers',
      icon: <DatabaseOutlined />,
      label: t('nav.providers'),
    },
    {
      key: '/tokens',
      icon: <KeyOutlined />,
      label: t('nav.tokens'),
    },
    {
      key: '/sessions',
      icon: <DesktopOutlined />,
      label: t('nav.sessions'),
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: t('nav.statistics'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  return (
    <ErrorBoundary>
      <NotificationManager />
      <CommandPalette
        visible={commandPaletteVisible}
        onClose={() => setCommandPaletteVisible(false)}
      />
      <Layout style={{ height: '100vh' }}>
      {/* 全屏时隐藏侧边栏 */}
      {!isTerminalFullscreen && (
        <ResizableSider
          theme="light"
          collapsed={collapsed}
          onCollapse={setCollapsed}
          defaultWidth={240}
          minWidth={200}
          maxWidth={400}
        >
          <div
            className="app-logo"
            style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? 'LLM' : 'LLMctl Desktop'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }: { key: string }) => handleMenuClick(key)}
            style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
          />
        </ResizableSider>
      )}

      <Layout>
        {/* 全屏时隐藏顶部导航栏 */}
        {!isTerminalFullscreen && (
          <TopBar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            title={menuItems.find(item => item.key === location.pathname)?.label || t('nav.appTitle')}
            breadcrumbItems={[
              { title: '首页', path: '/' },
              { title: menuItems.find(item => item.key === location.pathname)?.label || '' },
            ]}
          />
        )}

        <Content
          style={{
            margin: 0,
            padding: isTerminalFullscreen ? 0 : 24,
            background: colorBgContainer,
            overflow: 'auto',
            height: isTerminalFullscreen ? '100vh' : 'calc(100vh - 92px)', // 64px TopBar + 28px StatusBar
            paddingBottom: isSessionPage && openTerminalSessions.length > 0 && !isTerminalFullscreen ? 0 : 24,
          }}
        >
          {/* 全屏时隐藏路由内容（会话列表等） */}
          {!isTerminalFullscreen && (
            <ErrorBoundary>
              <Routes>
                <Route path="/providers" element={<ProviderManager />} />
                <Route path="/tokens" element={<TokenManager />} />
                <Route path="/sessions" element={<SessionManager />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/" element={<ProviderManager />} />
              </Routes>
            </ErrorBoundary>
          )}

          {/* 全局终端容器 */}
          <div style={{
            display: (isSessionPage || isTerminalFullscreen) && openTerminalSessions.length > 0 ? 'block' : 'none',
            marginTop: isTerminalFullscreen ? 0 : (isSessionPage && openTerminalSessions.length > 0 ? 16 : 0),
            position: isTerminalFullscreen ? 'fixed' : 'relative',
            top: isTerminalFullscreen ? 0 : 'auto',
            left: isTerminalFullscreen ? 0 : 'auto',
            right: isTerminalFullscreen ? 0 : 'auto',
            bottom: isTerminalFullscreen ? 0 : 'auto',
            zIndex: isTerminalFullscreen ? 1000 : 'auto',
            width: isTerminalFullscreen ? '100vw' : 'auto',
            height: isTerminalFullscreen ? '100vh' : 'auto',
          }}>
            <Card
              className={isTerminalFullscreen ? 'fullscreen-terminal-card' : ''}
              style={{
                height: isTerminalFullscreen ? '100vh' : 'calc(100vh - 160px)',
                minHeight: isTerminalFullscreen ? '100vh' : '750px',
                border: isTerminalFullscreen ? 'none' : undefined,
                borderRadius: isTerminalFullscreen ? 0 : undefined,
                boxShadow: isTerminalFullscreen ? 'none' : undefined,
              }}
              styles={{ body: { padding: 0, height: '100%', position: 'relative' } }}
            >
              {/* Tabs导航栏 - 全屏时也显示 */}
              <Tabs
                type="editable-card"
                activeKey={activeTabKey}
                onChange={(key: string) => dispatch(setActiveTab(key))}
                onEdit={(targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
                  if (action === 'remove' && typeof targetKey === 'string') {
                    handleCloseTerminal(targetKey);
                  }
                }}
                items={tabItems as any}
                hideAdd
                size={isTerminalFullscreen ? 'small' : 'middle'}
                style={{
                  height: isTerminalFullscreen ? 'auto' : '100%',
                  marginBottom: 8, // 全屏和非全屏都增加底部间距，改善观感
                }}
                tabBarStyle={{
                  marginBottom: 8, // 标签栏底部增加间距
                  paddingLeft: 16,
                  paddingRight: 16,
                  background: '#f5f5f5',
                }}
                tabBarExtraContent={
                  <Button
                    type="text"
                    size={isTerminalFullscreen ? 'small' : 'middle'}
                    icon={isTerminalFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={() => dispatch(toggleTerminalFullscreen())}
                    title={isTerminalFullscreen ? '退出全屏 (F11)' : '全屏显示 (F11)'}
                    style={{
                      marginRight: 8,
                    }}
                  />
                }
              />

              {/* 所有终端实例容器 - 绝对定位覆盖在Tabs内容区 */}
              <div style={{
                position: 'absolute',
                top: isTerminalFullscreen ? '48px' : '56px', // 非全屏模式增加更多间距
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden', // 防止溢出
              }}>
                {allTerminalComponents}
              </div>
            </Card>
          </div>
        </Content>

        {/* 底部状态栏 */}
        {!isTerminalFullscreen && (
          <StatusBar
            activeSessions={sessions.filter(s => s.status === 'active').length}
            totalProviders={providers.length}
            activeProviders={providers.filter(p => p.isActive).length}
            systemStatus="healthy"
          />
        )}
      </Layout>
    </Layout>
  </ErrorBoundary>
  );
};

// 包装组件，提供 Ant Design App 上下文
const App: React.FC = () => {
  return (
    <ConfigProvider theme={lightTheme}>
      <AntApp>
        <AppContent />
      </AntApp>
    </ConfigProvider>
  );
};

export default App;