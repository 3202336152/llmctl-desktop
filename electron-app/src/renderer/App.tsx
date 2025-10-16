import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, theme, Button, Tabs, Card, Space, Tag, message, Modal, ConfigProvider, App as AntApp } from 'antd';
import {
  DatabaseOutlined,
  KeyOutlined,
  DesktopOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './store';
import type { RootState } from './store';
import { closeTerminal, setActiveTab, addSession, removeSession, openTerminal, destroyTerminal, toggleTerminalFullscreen } from './store/slices/sessionSlice';
import { useNotifications } from './hooks/useNotifications';
import ProviderManager from './components/Provider/ProviderManager';
import TokenManager from './components/Token/TokenManager';
import SessionManager from './components/Session/SessionManager';
import Settings from './components/Settings/Settings';
import Help from './components/Help/Help';
import NotificationCenter from './components/Notifications/NotificationCenter';
import UserProfile from './components/User/UserProfile';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import ErrorBoundary from './components/Common/ErrorBoundary';
import NotificationManager from './components/Common/NotificationManager';
import CommandPalette from './components/Common/CommandPalette';
import TerminalManager from './components/Terminal/TerminalManager';
import { ResizableSider, StatusBar, TopBar } from './components/Layout';
import { configAPI, sessionAPI, tokenAPI } from './services/api';
import { ConfigImportRequest, StartSessionRequest } from './types';
import { authStorage } from './utils/authStorage';
import './i18n'; // 引入 i18n 配置
import './styles/global.css'; // 引入全局样式
import './styles/App.css'; // 引入应用样式
import { useTranslation } from 'react-i18next';
import { lightTheme } from './theme'; // 引入亮色主题配置

const { Content } = Layout;

/**
 * 受保护的路由组件 - 需要登录才能访问
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authStorage.isLoggedIn();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { modal } = AntApp.useApp(); // 使用 useApp hook
  const [collapsed, setCollapsed] = useState(true); // 默认收起侧边栏
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const { sessions, createdTerminalSessions, openTerminalSessions, activeTabKey, terminalSessionData, isTerminalFullscreen } = useAppSelector((state: RootState) => state.session);
  const { providers } = useAppSelector((state: RootState) => state.provider);

  // 初始化通知系统
  useNotifications();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 加载初始设置（语言和托盘） - 仅在登录后执行
  useEffect(() => {
    const loadInitialSettings = async () => {
      // 检查当前登录状态并通知主进程
      const isAuthenticated = authStorage.isLoggedIn();
      if (window.electronAPI) {
        window.electronAPI.send('set-auth-status', isAuthenticated);
      }

      // 检查是否已登录，未登录则跳过
      if (!isAuthenticated) {
        console.log('[App] 用户未登录，跳过加载初始设置');
        return;
      }

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

        // ✅ 1. 标记失效的Token为不健康状态
        if (failedSession.tokenId) {
          try {
            console.log('[App] 标记Token为不健康:', {
              providerId: failedSession.providerId,
              tokenId: failedSession.tokenId
            });
            await tokenAPI.updateTokenHealth(failedSession.providerId, failedSession.tokenId, false);
            console.log('[App] ✅ Token健康状态已更新为不健康');
          } catch (error) {
            console.error('[App] 更新Token健康状态失败:', error);
            // 不阻塞后续流程，继续重启会话
          }
        } else {
          console.warn('[App] 会话未关联tokenId，跳过健康状态更新');
        }

        // 2. 终止Electron端的终端进程
        try {
          await window.electronAPI.terminalKill(data.sessionId);
        } catch (error) {
          console.error('终止终端进程失败:', error);
        }

        // 3. 销毁前端终端实例
        dispatch(destroyTerminal(data.sessionId));

        // 4. 删除旧会话（直接从数据库清除，不保留记录）
        await sessionAPI.deleteSession(data.sessionId);
        dispatch(removeSession(data.sessionId));

        // 5. 创建新会话（使用相同的配置）
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

  // 是否在终端管理页面
  const isTerminalPage = location.pathname === '/terminals';

  // 是否在登录页面
  const isLoginPage = location.pathname === "/login" || location.pathname === "/register";;


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
      key: '/terminals',
      icon: <CodeOutlined />,
      label: t('nav.terminals', 'Terminals'),
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: t('nav.notifications'),
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
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
      {/* 登录页面和全屏时隐藏侧边栏 */}
      {!isTerminalFullscreen && !isLoginPage && (
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
              margin: collapsed ? '16px 8px' : '16px 16px', // 收起时减小左右边距
              fontSize: collapsed ? '14px' : '18px', // 收起时减小字体
            }}
          >
            {collapsed ? 'CTL' : 'LLMctl'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }: { key: string }) => handleMenuClick(key)}
            style={{ height: 'calc(100% - 96px)', borderRight: 0 }} // 调整高度以匹配新的Logo高度
          />
        </ResizableSider>
      )}

      <Layout>
        {/* 登录页面和全屏时隐藏顶部导航栏 */}
        {!isTerminalFullscreen && !isLoginPage && (
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
            padding: isTerminalFullscreen ? 0 : (isLoginPage ? 0 : 24),
            background: isLoginPage ? '#f5f5f5' : colorBgContainer,
            overflow: 'auto',
            height: isTerminalFullscreen ? '100vh' : (isLoginPage ? '100vh' : 'calc(100vh - 92px)'), // 登录页面全屏显示
            paddingBottom: isLoginPage ? 0 : 24,
          }}
        >
          {/* 全屏时隐藏路由内容（会话列表等） */}
          {!isTerminalFullscreen && (
            <ErrorBoundary>
              <Routes>
                {/* 公开路由 - 登录页面 */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* 受保护的路由 - 需要登录 */}
                <Route path="/providers" element={<ProtectedRoute><ProviderManager /></ProtectedRoute>} />
                <Route path="/tokens" element={<ProtectedRoute><TokenManager /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute><SessionManager /></ProtectedRoute>} />
                <Route path="/terminals" element={<ProtectedRoute><div /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/" element={<ProtectedRoute><ProviderManager /></ProtectedRoute>} />
              </Routes>
            </ErrorBoundary>
          )}

          {/* ✅ 终端组件永远挂载在顶层，使用 visibility 隐藏而不卸载 DOM */}
          {/* visibility: hidden 会保留 DOM 和状态，但不显示和不响应交互 */}
          <div style={{
            position: isTerminalPage && !isTerminalFullscreen ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (isTerminalPage || isTerminalFullscreen) ? 1 : -1,
            visibility: (isTerminalPage || isTerminalFullscreen) ? 'visible' : 'hidden',
            pointerEvents: (isTerminalPage || isTerminalFullscreen) ? 'auto' : 'none',
          }}>
            <TerminalManager />
          </div>
        </Content>

        {/* 底部状态栏 - 登录页面和全屏时隐藏 */}
        {!isTerminalFullscreen && !isLoginPage && (
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