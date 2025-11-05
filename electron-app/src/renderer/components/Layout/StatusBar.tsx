import React from 'react';
import { Space, Tag, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

interface StatusBarProps {
  activeSessions?: number;
  totalProviders?: number;
  activeProviders?: number;
  systemStatus?: 'healthy' | 'warning' | 'error';
}

/**
 * 底部状态栏组件
 * 显示系统关键信息
 */
const StatusBar: React.FC<StatusBarProps> = ({
  activeSessions = 0,
  totalProviders = 0,
  activeProviders = 0,
  systemStatus = 'healthy',
}) => {
  const statusColors = {
    healthy: 'success',
    warning: 'warning',
    error: 'error',
  };

  const statusTexts = {
    healthy: '系统正常',
    warning: '系统告警',
    error: '系统错误',
  };

  return (
    <div
      style={{
        height: 28,
        lineHeight: '28px',
        padding: '0 16px',
        background: '#fafafa',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 12,
        color: '#666',
      }}
    >
      {/* 左侧：会话信息 */}
      <Space size={16}>
        <Tooltip title="活跃会话数">
          <Space size={4}>
            <DesktopOutlined style={{ fontSize: 12 }} />
            <span>会话: {activeSessions}</span>
          </Space>
        </Tooltip>

        <Tooltip title="活跃Provider / 总Provider">
          <Space size={4}>
            <ApiOutlined style={{ fontSize: 12 }} />
            <span>
              Provider: {activeProviders} / {totalProviders}
            </span>
          </Space>
        </Tooltip>
      </Space>

      {/* 右侧：系统状态 */}
      <Space size={16}>
        <Tooltip title="系统状态">
          <Tag
            color={statusColors[systemStatus]}
            icon={
              systemStatus === 'healthy' ? (
                <CheckCircleOutlined />
              ) : systemStatus === 'warning' ? (
                <ClockCircleOutlined />
              ) : (
                <ThunderboltOutlined />
              )
            }
            style={{ margin: 0, fontSize: 11 }}
          >
            {statusTexts[systemStatus]}
          </Tag>
        </Tooltip>

        <span style={{ color: '#999' }}>
          LLMctl v2.3.0
        </span>
      </Space>
    </div>
  );
};

// 补充遗漏的导入
import { DesktopOutlined } from '@ant-design/icons';

export default StatusBar;
