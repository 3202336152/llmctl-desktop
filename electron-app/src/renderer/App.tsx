import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DatabaseOutlined,
  KeyOutlined,
  DesktopOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import ProviderManager from './components/Provider/ProviderManager';
import TokenManager from './components/Token/TokenManager';
import SessionManager from './components/Session/SessionManager';
import Settings from './components/Settings/Settings';
import Statistics from './components/Statistics/Statistics';
import ErrorBoundary from './components/Common/ErrorBoundary';
import NotificationManager from './components/Common/NotificationManager';
import './App.css';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

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
          style={{
            borderRight: '1px solid #f0f0f0',
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
            }}
          >
            LLMctl Desktop
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
            }}
          >
            <h2 style={{ margin: 0, color: '#333' }}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'LLM控制系统'}
            </h2>
          </Header>

          <Content
            style={{
              margin: 0,
              padding: 24,
              background: colorBgContainer,
              overflow: 'auto',
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
          </Content>
        </Layout>
      </Layout>
    </ErrorBoundary>
  );
};

export default App;