import React, { useMemo } from 'react';
import { Card, List, Button, Tag, Space, Empty, Typography, message } from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  FolderOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import type { RootState } from '../../store';
import { openTerminal } from '../../store/slices/sessionSlice';
import { useTranslation } from 'react-i18next';
import { sessionAPI } from '../../services/api';

const { Text } = Typography;

/**
 * 最近会话列表组件
 * 显示最近3个会话，提供快速操作入口
 */
const RecentSessionsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { sessions } = useAppSelector((state: RootState) => state.session);
  const { providers } = useAppSelector((state: RootState) => state.provider);

  // 获取最近3个会话（按创建时间降序）
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 3);
  }, [sessions]);

  // 获取Provider名称
  const getProviderName = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || t('dashboard.unknownProvider', '未知Provider');
  };

  // 打开终端
  const handleOpenTerminal = (sessionId: string) => {
    dispatch(openTerminal(sessionId));
    navigate('/terminals');
  };

  if (recentSessions.length === 0) {
    return (
      <Card title={t('dashboard.recentSessions', '最近会话')}>
        <Empty
          description={
            <Space direction="vertical" size={8}>
              <Text type="secondary">
                {t('dashboard.noSessions', '还没有会话记录')}
              </Text>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => navigate('/sessions')}
              >
                {t('dashboard.createFirstSession', '创建第一个会话')}
              </Button>
            </Space>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title={t('dashboard.recentSessions', '最近会话')}
      extra={
        <Button type="link" onClick={() => navigate('/sessions')}>
          {t('dashboard.viewAll', '查看全部')}
        </Button>
      }
      style={{ height: '100%' }}
      bodyStyle={{ height: 'calc(100% - 57px)', overflowY: 'auto', maxHeight: '400px' }}
    >
      <List
        dataSource={recentSessions}
        renderItem={(session: any) => (
          <List.Item
            actions={[
              session.status === 'active' ? (
                <Button
                  type="primary"
                  size="small"
                  icon={<CodeOutlined />}
                  onClick={() => handleOpenTerminal(session.id)}
                >
                  {t('dashboard.openTerminal', '打开终端')}
                </Button>
              ) : (
                <Button
                  size="small"
                  onClick={() => navigate('/sessions')}
                >
                  {t('dashboard.viewAll', '查看全部')}
                </Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={
                <Tag color={session.status === 'active' ? 'success' : 'default'}>
                  {session.status === 'active'
                    ? t('session.active', '活跃')
                    : t('session.inactive', '未激活')}
                </Tag>
              }
              title={
                <Space>
                  <Text strong>{getProviderName(session.providerId)}</Text>
                  <Text type="secondary">#{session.id.slice(0, 8)}</Text>
                </Space>
              }
              description={
                <Space size={4}>
                  <FolderOutlined />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {session.workingDirectory}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RecentSessionsList;
