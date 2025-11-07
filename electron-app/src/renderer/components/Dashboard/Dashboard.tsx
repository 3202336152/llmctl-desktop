import React, { useMemo, useEffect } from 'react';
import { Row, Col } from 'antd';
import { useAppSelector, useAppDispatch } from '../../store';
import type { RootState } from '../../store';
import QuickActionCards from './QuickActionCards';
import SystemOverview from './SystemOverview';
import SessionTrendChart from './SessionTrendChart';
import TokenUsageChart from './TokenUsageChart';
import RecentSessionsList from './RecentSessionsList';
import RecentActivities from './RecentActivities';
import { useTranslation } from 'react-i18next';
import { fetchProviders } from '../../store/slices/providerSlice';
import { setTokens } from '../../store/slices/tokenSlice';
import { setSessions } from '../../store/slices/sessionSlice';
import { tokenAPI, sessionAPI } from '../../services/api';
import './Dashboard.css';

/**
 * Dashboard 首页组件
 * 提供系统概览、快速操作、数据可视化和最近会话
 */
const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { sessions } = useAppSelector((state: RootState) => state.session);
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const { tokens } = useAppSelector((state: RootState) => state.token);

  // 加载Providers、Tokens和Sessions数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. 获取所有providers
        const providersResult = await dispatch(fetchProviders()).unwrap();

        // 2. 获取所有providers的tokens并合并
        if (providersResult && providersResult.length > 0) {
          const allTokens = [];
          for (const provider of providersResult) {
            try {
              const tokenResponse = await tokenAPI.getTokensByProviderId(provider.id);
              if (tokenResponse.data) {
                allTokens.push(...tokenResponse.data);
              }
            } catch (error) {
              console.error(`[Dashboard] 获取Provider ${provider.id} 的Token失败:`, error);
            }
          }
          dispatch(setTokens(allTokens));
        }

        // 3. 获取所有会话
        try {
          const sessionsResponse = await sessionAPI.getAllSessions();
          if (sessionsResponse.data) {
            dispatch(setSessions(sessionsResponse.data));
          }
        } catch (error) {
          console.error('[Dashboard] 获取会话列表失败:', error);
        }
      } catch (error) {
        console.error('[Dashboard] 加载数据失败:', error);
      }
    };

    loadData();
  }, [dispatch]);

  // 计算系统统计数据
  const stats = useMemo(() => {
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const totalProviders = providers.length;
    const activeProviders = providers.filter(p => p.isActive).length;

    // 计算Token健康度
    const healthyTokens = tokens.filter(t => t.healthy).length;
    const tokenHealth = tokens.length > 0
      ? Math.round((healthyTokens / tokens.length) * 100)
      : 0;

    return {
      activeSessions,
      totalProviders,
      activeProviders,
      tokenHealth,
    };
  }, [sessions, providers, tokens]);

  return (
    <div className="dashboard-container">
      <Row gutter={[16, 16]}>
        {/* 第一行：快速操作卡片 */}
        <Col span={24}>
          <QuickActionCards />
        </Col>

        {/* 第二行：系统状态概览 */}
        <Col span={24}>
          <SystemOverview
            activeSessions={stats.activeSessions}
            tokenHealth={stats.tokenHealth}
            totalProviders={stats.totalProviders}
            activeProviders={stats.activeProviders}
          />
        </Col>

        {/* 第三行：图表区域 */}
        <Col xs={24} lg={12}>
          <SessionTrendChart />
        </Col>
        <Col xs={24} lg={12}>
          <TokenUsageChart />
        </Col>

        {/* 第四行：最近会话和活动日志 */}
        <Col xs={24} lg={12}>
          <RecentSessionsList />
        </Col>
        <Col xs={24} lg={12}>
          <RecentActivities />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
