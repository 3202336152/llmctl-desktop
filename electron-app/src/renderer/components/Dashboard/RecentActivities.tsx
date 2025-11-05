import React, { useEffect, useState } from 'react';
import { Card, Timeline, Empty, Tag, Space, Typography, Button, Skeleton } from 'antd';
import {
  ReloadOutlined,
  RocketOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';
import type { RootState } from '../../store';

const { Text } = Typography;

interface Activity {
  id: string;
  type: 'session' | 'provider' | 'token' | 'mcp';
  action: 'created' | 'updated' | 'deleted' | 'started' | 'terminated' | 'enabled' | 'disabled' | 'healthy' | 'unhealthy';
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: {
    entityId?: string;
    entityName?: string;
    status?: string;
    [key: string]: any;
  };
}

/**
 * 最近活动日志组件
 * 显示系统最近的操作记录（基于Redux状态变化）
 */
const RecentActivities: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // 从Redux获取数据
  const { sessions } = useAppSelector((state: RootState) => state.session);
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const { tokens } = useAppSelector((state: RootState) => state.token);

  useEffect(() => {
    loadActivitiesFromStore();
  }, [sessions, providers, tokens]);

  // 从Redux store生成活动记录
  const loadActivitiesFromStore = () => {
    try {
      setLoading(true);
      const activityList: Activity[] = [];

      // 1. 从会话生成活动
      sessions.slice(0, 5).forEach(session => {
        const providerName = providers.find(p => p.id === session.providerId)?.name || 'Unknown';

        activityList.push({
          id: `session-${session.id}`,
          type: 'session',
          action: session.status === 'active' ? 'started' : 'terminated',
          title: `会话${session.status === 'active' ? '启动' : '终止'}`,
          description: `${providerName} - ${getSessionName(session.workingDirectory)}`,
          timestamp: new Date(session.startTime),
          metadata: {
            entityId: session.id,
            entityName: getSessionName(session.workingDirectory),
            status: session.status,
          },
        });
      });

      // 2. 从Provider生成活动
      providers.slice(0, 3).forEach(provider => {
        activityList.push({
          id: `provider-${provider.id}`,
          type: 'provider',
          action: provider.isActive ? 'enabled' : 'disabled',
          title: `Provider ${provider.isActive ? '启用' : '禁用'}`,
          description: `${provider.name} - ${provider.types?.join(', ')}`,
          timestamp: new Date(provider.updatedAt || provider.createdAt),
          metadata: {
            entityId: provider.id,
            entityName: provider.name,
            status: provider.isActive ? 'active' : 'inactive',
          },
        });
      });

      // 3. 从Token生成活动
      tokens.slice(0, 3).forEach(token => {
        activityList.push({
          id: `token-${token.id}`,
          type: 'token',
          action: token.healthy ? 'healthy' : 'unhealthy',
          title: `Token ${token.healthy ? '健康' : '异常'}`,
          description: `${token.alias || 'Token'} - 权重: ${token.weight}`,
          timestamp: new Date(token.lastUsed || token.createdAt),
          metadata: {
            entityId: token.id,
            entityName: token.alias,
            status: token.healthy ? 'healthy' : 'unhealthy',
          },
        });
      });

      // 按时间排序（最新的在前）
      activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // 只保留最近10条
      setActivities(activityList.slice(0, 10));
    } catch (error) {
      console.error('[RecentActivities] 生成活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 从工作目录提取项目名
  const getSessionName = (workingDir: string) => {
    if (!workingDir) return 'Unknown';
    const parts = workingDir.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || 'Unknown';
  };

  // 获取活动图标
  const getActivityIcon = (type: Activity['type'], action: Activity['action']) => {
    const iconStyle = { fontSize: 16 };

    if (action === 'created') return <PlusCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
    if (action === 'updated') return <EditOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
    if (action === 'deleted') return <DeleteOutlined style={{ ...iconStyle, color: '#f5222d' }} />;

    switch (type) {
      case 'session':
        return action === 'started'
          ? <RocketOutlined style={{ ...iconStyle, color: '#1890ff' }} />
          : <CloseCircleOutlined style={{ ...iconStyle, color: '#8c8c8c' }} />;
      case 'provider':
        return <DatabaseOutlined style={{ ...iconStyle, color: '#722ed1' }} />;
      case 'token':
        return action === 'healthy'
          ? <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />
          : <ExclamationCircleOutlined style={{ ...iconStyle, color: '#f5222d' }} />;
      case 'mcp':
        return <ApiOutlined style={{ ...iconStyle, color: '#fa8c16' }} />;
      default:
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#8c8c8c' }} />;
    }
  };

  // 获取操作标签颜色
  const getActionTagColor = (action: Activity['action']) => {
    const colorMap: Record<Activity['action'], string> = {
      created: 'blue',
      started: 'green',
      terminated: 'default',
      updated: 'orange',
      deleted: 'red',
      enabled: 'green',
      disabled: 'default',
      healthy: 'success',
      unhealthy: 'error',
    };
    return colorMap[action] || 'default';
  };

  // 获取操作文本
  const getActionText = (action: Activity['action']) => {
    const textMap: Record<Activity['action'], string> = {
      created: '创建',
      started: '启动',
      terminated: '终止',
      updated: '更新',
      deleted: '删除',
      enabled: '启用',
      disabled: '禁用',
      healthy: '健康',
      unhealthy: '异常',
    };
    return textMap[action] || '操作';
  };

  // 格式化时间
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return timestamp.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card
        title="最近活动"
        extra={
          <Button icon={<ReloadOutlined />} size="small" onClick={loadActivitiesFromStore}>
            刷新
          </Button>
        }
      >
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card
        title="最近活动"
        extra={
          <Button icon={<ReloadOutlined />} size="small" onClick={loadActivitiesFromStore}>
            刷新
          </Button>
        }
      >
        <Empty
          description="暂无活动记录，开始使用系统后这里会显示操作历史"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      title="最近活动"
      extra={
        <Button icon={<ReloadOutlined />} size="small" onClick={loadActivitiesFromStore}>
          刷新
        </Button>
      }
      style={{ height: '100%' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflowY: 'auto', maxHeight: '400px' }}
    >
      <Timeline
        mode="left"
        items={activities.map(activity => ({
          dot: getActivityIcon(activity.type, activity.action),
          children: (
            <div style={{ paddingBottom: 12 }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space size={8}>
                  <Text strong>{activity.title}</Text>
                  <Tag color={getActionTagColor(activity.action)} style={{ margin: 0 }}>
                    {getActionText(activity.action)}
                  </Tag>
                </Space>
                {activity.description && (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {activity.description}
                  </Text>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatTime(activity.timestamp)}
                </Text>
              </Space>
            </div>
          ),
        }))}
      />
    </Card>
  );
};

export default RecentActivities;
