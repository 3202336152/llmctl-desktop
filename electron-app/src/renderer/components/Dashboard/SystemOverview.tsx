import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Tooltip } from 'antd';
import {
  RocketOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  ApiOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mcpAPI } from '../../services/api';

interface SystemOverviewProps {
  activeSessions: number;
  tokenHealth: number;
  totalProviders: number;
  activeProviders: number;
}

/**
 * 系统状态概览组件
 * 显示活跃会话、Token健康度、Provider统计、MCP服务器统计
 */
const SystemOverview: React.FC<SystemOverviewProps> = ({
  activeSessions,
  tokenHealth,
  totalProviders,
  activeProviders,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mcpServers, setMcpServers] = useState({ enabled: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  // 加载MCP服务器统计
  useEffect(() => {
    const loadMcpServers = async () => {
      try {
        setLoading(true);
        const response = await mcpAPI.getAllServers();
        if (response.data) {
          const servers = response.data;
          const enabled = servers.filter(s => s.enabled).length;
          setMcpServers({ enabled, total: servers.length });
        }
      } catch (error) {
        console.error('[SystemOverview] 加载MCP服务器失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMcpServers();
  }, []);

  // Token健康度颜色
  const getHealthColor = (health: number) => {
    if (health >= 80) return '#52c41a'; // 绿色
    if (health >= 50) return '#faad14'; // 黄色
    return '#f5222d'; // 红色
  };

  // 获取卡片渐变背景
  const getCardStyle = (color: string) => ({
    background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
    border: `1px solid ${color}30`,
    height: 140,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  });

  const statistics = [
    {
      key: 'sessions',
      title: t('dashboard.activeSessions', '活跃会话'),
      value: activeSessions,
      icon: <RocketOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      color: '#1890ff',
      path: '/sessions',
      description: '当前运行中的会话数量',
    },
    {
      key: 'token-health',
      title: t('dashboard.tokenHealth', 'Token健康度'),
      value: tokenHealth,
      suffix: '%',
      icon: <SafetyOutlined style={{ fontSize: 28, color: getHealthColor(tokenHealth) }} />,
      color: getHealthColor(tokenHealth),
      path: '/tokens',
      description: '健康Token占比',
      extra: (
        <Tooltip title={`健康Token比例: ${tokenHealth}%`}>
          <Progress
            percent={tokenHealth}
            size="small"
            strokeColor={getHealthColor(tokenHealth)}
            showInfo={false}
            style={{ marginTop: 8, marginBottom: 0 }}
          />
        </Tooltip>
      ),
      warning: tokenHealth < 30,
    },
    {
      key: 'providers',
      title: t('dashboard.providers', 'Provider'),
      value: activeProviders,
      suffix: `/${totalProviders}`,
      icon: <DatabaseOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
      color: '#722ed1',
      path: '/providers',
      description: `${activeProviders}个启用，共${totalProviders}个`,
      valueStyle: { fontSize: 22 },
    },
    {
      key: 'mcp-servers',
      title: 'MCP服务器',
      value: mcpServers.enabled,
      suffix: `/${mcpServers.total}`,
      icon: <ApiOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
      color: '#fa8c16',
      path: '/mcp-servers',
      description: `${mcpServers.enabled}个启用，共${mcpServers.total}个`,
      valueStyle: { fontSize: 22 },
      loading,
    },
  ];

  return (
    <Row gutter={16}>
      {statistics.map(stat => (
        <Col xs={24} sm={12} md={6} key={stat.key}>
          <Card
            style={getCardStyle(stat.color)}
            styles={{
              body: {
                padding: '20px',
                height: '140px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              },
            }}
            hoverable
            onClick={() => navigate(stat.path)}
            loading={stat.loading}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 4 }}>
                  {stat.title}
                </div>
                <Tooltip title={stat.description}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: stat.valueStyle?.fontSize || 28, fontWeight: 600, color: stat.color }}>
                      {stat.value}
                    </span>
                    {stat.suffix && (
                      <span style={{ fontSize: 16, color: '#8c8c8c' }}>
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                </Tooltip>
              </div>
              <div style={{ opacity: 0.8 }}>
                {stat.icon}
              </div>
            </div>

            {stat.extra && (
              <div style={{ marginTop: 12 }}>
                {stat.extra}
              </div>
            )}

            {stat.warning && (
              <div style={{
                marginTop: 12,
                padding: '4px 8px',
                background: '#fff2e8',
                borderRadius: 4,
                fontSize: 12,
                color: '#fa8c16'
              }}>
                ⚠️ Token健康度过低，请检查
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default SystemOverview;
