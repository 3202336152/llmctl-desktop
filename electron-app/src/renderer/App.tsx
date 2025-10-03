import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Button, Tabs, Card, Space, Tag, message, Modal } from 'antd';
import {
  DatabaseOutlined,
  KeyOutlined,
  DesktopOutlined,
  SettingOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './store';
import type { RootState } from './store';
import { closeTerminal, setActiveTab, addSession, removeSession, openTerminal } from './store/slices/sessionSlice';
import ProviderManager from './components/Provider/ProviderManager';
import TokenManager from './components/Token/TokenManager';
import SessionManager from './components/Session/SessionManager';
import Settings from './components/Settings/Settings';
import Statistics from './components/Statistics/Statistics';
import ErrorBoundary from './components/Common/ErrorBoundary';
import NotificationManager from './components/Common/NotificationManager';
import TerminalComponent from './components/Terminal/TerminalComponent';
import { configAPI, sessionAPI } from './services/api';
import { ConfigImportRequest, StartSessionRequest } from './types';
import './App.css';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const { sessions, openTerminalSessions, activeTabKey } = useAppSelector((state: RootState) => state.session);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

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
          Modal.confirm({
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

        // 1. 关闭旧终端
        dispatch(closeTerminal(data.sessionId));

        // 2. 删除旧会话（直接从数据库清除，不保留记录）
        await sessionAPI.deleteSession(data.sessionId);
        dispatch(removeSession(data.sessionId));

        // 3. 创建新会话（使用相同的配置）
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
  };

  // 生成标签页数据
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
      children: (
        <TerminalComponent
          sessionId={sessionId}
          command={session.command}
          cwd={session.workingDirectory}
          providerName={session.providerName}
          showCard={false}
        />
      ),
      closable: true,
    };
  }).filter(item => item !== null);

  const menuItems = [
    {
      key: '/providers',
      icon: <DatabaseOutlined />,
      label: 'Provider管理',
    },
    {
      key: '/tokens',
      icon: <KeyOutlined />,
      label: 'Token管理',
    },
    {
      key: '/sessions',
      icon: <DesktopOutlined />,
      label: '会话管理',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '使用统计',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  return (
    <ErrorBoundary>
      <NotificationManager />
      <Layout style={{ height: '100vh' }}>
        <Sider
          theme="light"
          width={200}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          style={{
            borderRight: '1px solid #f0f0f0',
            overflow: 'hidden',
            transition: 'all 0.2s',
          }}
        >
          <div
            style={{
              height: 32,
              margin: 16,
              background: 'rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              lineHeight: '32px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1890ff',
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
        </Sider>

        <Layout>
          <Header
            style={{
              padding: '0 16px',
              background: colorBgContainer,
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 40,
                  height: 40,
                }}
              />
              <h2 style={{ margin: 0, color: '#333' }}>
                {menuItems.find(item => item.key === location.pathname)?.label || 'LLM控制系统'}
              </h2>
            </div>
          </Header>

          <Content
            style={{
              margin: 0,
              padding: 24,
              background: colorBgContainer,
              overflow: 'auto',
              height: 'calc(100vh - 64px)',
              paddingBottom: isSessionPage && openTerminalSessions.length > 0 ? 0 : 24,
            }}
          >
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

            {/* 全局终端容器 - 只在会话管理页面显示 */}
            {openTerminalSessions.length > 0 && (
              <div style={{
                display: isSessionPage ? 'block' : 'none',
                marginTop: isSessionPage ? 16 : 0,
              }}>
                <Card
                  style={{
                    height: 'calc(100vh - 160px)',
                    minHeight: '750px',
                  }}
                  styles={{ body: { padding: 0, height: '100%' } }}
                >
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
                    style={{ height: '100%' }}
                    tabBarStyle={{
                      marginBottom: 0,
                      paddingLeft: 16,
                      paddingRight: 16,
                      background: '#f5f5f5',
                    }}
                  />
                </Card>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </ErrorBoundary>
  );
};

export default App;