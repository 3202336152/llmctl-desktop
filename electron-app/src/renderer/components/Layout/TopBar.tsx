import React from 'react';
import { Button, Space, Breadcrumb, Input, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

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

  const handleBreadcrumbClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

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
      </Space>
    </div>
  );
};

export default TopBar;
