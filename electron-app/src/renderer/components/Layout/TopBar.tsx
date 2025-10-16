import React, { useEffect, useState } from 'react';
import { Button, Space, Breadcrumb, Input, Tooltip, Dropdown, Avatar, message, Modal, Progress } from 'antd';
import type { MenuProps as AntMenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../utils/authStorage';
import { sessionAPI } from '../../services/sessionAPI';
import apiClient from '../../services/httpClient';
import NotificationIcon from '../Notifications/NotificationIcon';

const { Search } = Input;

interface TopBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  title: string;
  breadcrumbItems?: { title: string; path?: string }[];
  onSearch?: (value: string) => void;
  showSearch?: boolean;
}

/**
 * 增强的顶部工具栏组件
 * 包含折叠按钮、标题、面包屑、搜索、操作按钮
 */
const TopBar: React.FC<TopBarProps> = ({
  collapsed,
  onToggleCollapse,
  title,
  breadcrumbItems = [],
  onSearch,
  showSearch = false,
}) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authStorage.getCurrentUser());
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // ==================== 监听用户信息变化 ====================
  useEffect(() => {
    // 监听 localStorage 变化事件
    const handleStorageChange = (e: StorageEvent) => {
      // 如果是用户相关的字段变化，重新加载用户信息
      if (e.key === 'avatarUrl' || e.key === 'displayName' || e.key === 'email') {
        const latestUser = authStorage.getCurrentUser();
        setCurrentUser(latestUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 同时也使用定期检查作为补充（因为同一窗口的 localStorage 变化不会触发 storage 事件）
    const intervalId = setInterval(() => {
      const latestUser = authStorage.getCurrentUser();
      const currentUserStr = JSON.stringify(currentUser);
      const latestUserStr = JSON.stringify(latestUser);

      if (currentUserStr !== latestUserStr) {
        setCurrentUser(latestUser);
      }
    }, 500); // 每0.5秒检查一次

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [currentUser]);

  // ==================== 自动更新功能 ====================
  useEffect(() => {
    if (!window.electronAPI) return;

    // 监听菜单触发的检查更新事件
    const unsubscribeTrigger = window.electronAPI.onTriggerCheckUpdates(() => {
      handleCheckForUpdates();
    });

    // 监听更新状态消息
    const unsubscribeStatus = window.electronAPI.onUpdateStatus((msg: string) => {
      console.log('[TopBar] 更新状态:', msg);
      if (msg.includes('下载')) {
        setIsDownloading(true);
      }
    });

    // 监听下载进度
    const unsubscribeProgress = window.electronAPI.onDownloadProgress((percent: number) => {
      console.log('[TopBar] 下载进度:', percent);
      setDownloadProgress(percent);
      if (percent >= 100) {
        setIsDownloading(false);
      }
    });

    return () => {
      unsubscribeTrigger();
      unsubscribeStatus();
      unsubscribeProgress();
    };
  }, []);

  // 手动检查更新
  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) {
      message.error('Electron API 不可用');
      return;
    }

    try {
      const result = await window.electronAPI.checkForUpdates();
      if (!result.success && result.message) {
        message.info(result.message);
      }
    } catch (error) {
      console.error('[TopBar] 检查更新失败:', error);
      message.error('检查更新失败');
    }
  };

  const handleBreadcrumbClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  // 退出登录
  const handleLogout = async () => {
    try {
      // 1. 检查是否有活跃会话
      const activeSessionsResponse = await sessionAPI.getActiveSessions();
      const activeSessions = activeSessionsResponse.data || [];

      // 2. 如果有活跃会话，显示确认对话框
      if (activeSessions.length > 0) {
        Modal.confirm({
          title: '确认登出',
          icon: <ExclamationCircleOutlined />,
          content: `登出将终止所有活跃会话（当前有 ${activeSessions.length} 个活跃会话）。您的会话历史记录将被保留，可以随时重启。`,
          okText: '确认登出',
          cancelText: '取消',
          onOk: async () => {
            await performLogout();
          },
        });
      } else {
        await performLogout();
      }
    } catch (error) {
      console.error('检查活跃会话失败:', error);
      // 即使检查失败，也允许用户登出
      await performLogout();
    }
  };

  // 执行登出操作
  const performLogout = async () => {
    try {
      // 1. 调用API更新当前用户的会话状态
      await sessionAPI.deactivateCurrentUserSessions();

      // 2. 调用登出API
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      // 3. 无论后端是否成功，都清除本地认证信息
      authStorage.clearAuth();
      message.success('已退出登录');
      // 4. 跳转到登录页
      navigate('/login');
      window.location.reload();
    }
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <div
      style={{
        height: 64,
        padding: '0 24px',
        background: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* 左侧：折叠按钮、标题、面包屑 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          style={{
            fontSize: 16,
            width: 40,
            height: 40,
          }}
        />

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#333' }}>
            {title}
          </h2>
          {breadcrumbItems.length > 0 && (
            <Breadcrumb
              style={{ marginTop: 4, fontSize: 12 }}
              items={breadcrumbItems.map(item => ({
                title: item.path ? (
                  <a onClick={() => handleBreadcrumbClick(item.path)}>{item.title}</a>
                ) : (
                  item.title
                ),
              }))}
            />
          )}
        </div>
      </div>

      {/* 中间：搜索框 */}
      {showSearch && onSearch && (
        <div style={{ flex: 1, maxWidth: 400, margin: '0 24px' }}>
          <Search
            placeholder="搜索..."
            allowClear
            onSearch={onSearch}
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* 右侧：操作按钮 */}
      <Space size={8}>
        {/* 下载进度提示 */}
        {isDownloading && (
          <Tooltip title={`正在下载更新: ${downloadProgress}%`}>
            <div style={{ padding: '0 8px' }}>
              <Progress
                type="circle"
                percent={downloadProgress}
                width={32}
                strokeColor="#1890ff"
                format={(percent?: number) => `${percent}%`}
                style={{ fontSize: 10 }}
              />
            </div>
          </Tooltip>
        )}

        <NotificationIcon />

        <Tooltip title="帮助">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={() => navigate('/help')}
            style={{ fontSize: 16, width: 36, height: 36 }}
          />
        </Tooltip>

        <Tooltip title="设置">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => navigate('/settings')}
            style={{ fontSize: 16, width: 36, height: 36 }}
          />
        </Tooltip>

        {/* 用户下拉菜单 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
            <Avatar
              size={32}
              src={currentUser?.avatarUrl}
              icon={!currentUser?.avatarUrl ? <UserOutlined /> : undefined}
              style={{ backgroundColor: currentUser?.avatarUrl ? 'transparent' : '#1890ff' }}
            />
            <span style={{ marginLeft: 8, fontSize: 14, color: '#333' }}>
              {currentUser?.displayName || currentUser?.username || '用户'}
            </span>
          </div>
        </Dropdown>
      </Space>
    </div>
  );
};

export default TopBar;
