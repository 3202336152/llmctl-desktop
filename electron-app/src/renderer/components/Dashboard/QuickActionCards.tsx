import React from 'react';
import { Card, Row, Col, Typography, Badge, Tooltip } from 'antd';
import {
  RocketOutlined,
  DatabaseOutlined,
  BellOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';
import type { RootState } from '../../store';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

/**
 * 快速操作卡片组件
 * 提供创建会话、配置Provider、MCP服务器管理、查看通知的快捷入口
 */
const QuickActionCards: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const { tokens } = useAppSelector((state: RootState) => state.token);
  const { unreadCount } = useAppSelector((state: RootState) => state.notification);

  // 检查是否可以创建会话（需要至少有一个Provider和Token）
  const canCreateSession = providers.length > 0 && tokens.length > 0;

  // 获取卡片渐变背景
  const getCardStyle = (color: string, disabled?: boolean) => ({
    background: disabled
      ? 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)'
      : `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
    border: `1px solid ${disabled ? '#d9d9d9' : color + '30'}`,
    minHeight: 160,
    transition: 'all 0.3s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  });

  const quickActions = [
    {
      key: 'create-session',
      title: t('dashboard.createSession', '创建会话'),
      icon: <RocketOutlined style={{ fontSize: 48, color: canCreateSession ? '#1890ff' : '#bfbfbf' }} />,
      color: '#1890ff',
      description: t('dashboard.createSessionDesc', '快速启动一个新的CLI会话'),
      onClick: () => navigate('/sessions'),
      disabled: !canCreateSession,
      tooltip: !canCreateSession
        ? t('dashboard.needProviderAndToken', '请先配置Provider和添加Token')
        : '点击创建新会话',
      dataTour: 'quick-create-session',
    },
    {
      key: 'configure-provider',
      title: t('dashboard.configureProvider', '配置Provider'),
      icon: <DatabaseOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      color: '#52c41a',
      description: t('dashboard.configureProviderDesc', '管理您的LLM服务提供商'),
      onClick: () => navigate('/providers'),
      tooltip: `已配置 ${providers.length} 个Provider`,
    },
    {
      key: 'mcp-servers',
      title: 'MCP服务器',
      icon: <ApiOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      color: '#722ed1',
      description: '管理和配置MCP服务器',
      onClick: () => navigate('/mcp-servers'),
      tooltip: '管理MCP服务器',
    },
    {
      key: 'view-notifications',
      title: t('dashboard.viewNotifications', '查看通知'),
      icon: <BellOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
      color: '#fa8c16',
      description: t('dashboard.viewNotificationsDesc', '查看系统通知和消息'),
      onClick: () => navigate('/notifications'),
      badge: unreadCount,
      tooltip: unreadCount > 0 ? `${unreadCount} 条未读通知` : '暂无未读通知',
    },
  ];

  return (
    <Row gutter={16}>
      {quickActions.map(action => (
        <Col xs={24} sm={12} md={6} key={action.key}>
          <Tooltip title={action.tooltip}>
            <Badge count={action.badge} offset={[-10, 10]}>
              <Card
                hoverable={!action.disabled}
                className={`quick-action-card ${action.disabled ? 'disabled' : ''}`}
                onClick={action.disabled ? undefined : action.onClick}
                data-tour={action.dataTour}
                style={getCardStyle(action.color, action.disabled)}
              >
                <div style={{ textAlign: 'center', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ marginBottom: 16 }}>
                    {action.icon}
                  </div>
                  <Typography.Title level={4} style={{ marginBottom: 8, fontSize: 18 }}>
                    {action.title}
                  </Typography.Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {action.description}
                  </Text>
                </div>
              </Card>
            </Badge>
          </Tooltip>
        </Col>
      ))}
    </Row>
  );
};

export default QuickActionCards;
