import React from 'react';
import { Button, Space, Breadcrumb, Input, Tooltip, Dropdown, Avatar, message, Modal } from 'antd';
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
  const currentUser = authStorage.getCurrentUser();

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
        <Tooltip title="通知">
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{ fontSize: 16, width: 36, height: 36 }}
          />
        </Tooltip>

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
            <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
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
