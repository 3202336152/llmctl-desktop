import React, { useState, useEffect } from 'react';
import { Card, Empty, Skeleton, Alert, Radio } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList } from 'recharts';
import { useTranslation } from 'react-i18next';
import httpClient from '../../services/httpClient';

interface ProviderUsageData {
  providerId: string;
  providerName: string;
  totalSessions: number;
  activeSessions: number;
  successRate: number;
}

type TimeRange = 7 | 30 | 90;

// 优化后的颜色方案（降低饱和度，视觉更协调）
const COLORS = ['#4DA3FF', '#52c41a', '#fa8c16', '#13c2c2', '#722ed1', '#eb2f96', '#faad14'];

/**
 * Provider使用统计图组件
 * 显示每个Provider的会话数量统计，支持时间范围选择
 */
const TokenUsageChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<ProviderUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(7);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.get('/statistics/provider-usage', {
        params: { days: timeRange },
      });

      if (response.data && response.data.code === 200) {
        setData(response.data.data || []);
      } else {
        setError(response.data?.message || t('dashboard.loadFailed', '加载失败'));
      }
    } catch (err: any) {
      console.error('[TokenUsageChart] 加载失败:', err);
      setError(err.response?.data?.message || err.message || t('dashboard.loadFailed', '加载失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (e: any) => {
    setTimeRange(e.target.value);
  };

  return (
    <Card
      title="Provider使用统计"
      extra={
        <Radio.Group value={timeRange} onChange={handleTimeRangeChange} size="small">
          <Radio.Button value={7}>7天</Radio.Button>
          <Radio.Button value={30}>30天</Radio.Button>
          <Radio.Button value={90}>90天</Radio.Button>
        </Radio.Group>
      }
      styles={{
        body: { paddingBottom: 16 }
      }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : data.length === 0 ? (
        <Empty
          description={t('dashboard.noProviderData', '暂无Provider数据，请先配置Provider并创建会话')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={8} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="providerName"
              stroke="#595959"
              style={{ fontSize: 13, fontWeight: 500 }}
              tickMargin={10}
            />
            <YAxis
              stroke="#595959"
              style={{ fontSize: 13 }}
              label={{
                value: t('dashboard.sessionCount', '会话数'),
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 14, fontWeight: 500 }
              }}
              tickMargin={8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              formatter={(value: number, name: string, props: any) => {
                const { payload } = props;
                if (name === 'totalSessions') {
                  return [
                    <div key="total">
                      <div style={{ fontWeight: 600, marginBottom: 4, color: '#4DA3FF' }}>{t('dashboard.totalSessions', '总会话数')}: {value}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>成功率: {payload.successRate}%</div>
                    </div>
                  ];
                }
                if (name === 'activeSessions') {
                  return [value, t('dashboard.activeSessions', '活跃会话数')];
                }
                return [value, name];
              }}
              labelFormatter={(label: string) => (
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  Provider: {label}
                </div>
              )}
            />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 10 }}
              formatter={(value: string) => {
                if (value === 'totalSessions') return t('dashboard.totalSessions', '总会话数');
                if (value === 'activeSessions') return t('dashboard.activeSessions', '活跃会话数');
                return value;
              }}
              iconType="circle"
            />
            <Bar dataKey="totalSessions" fill="#4DA3FF" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList
                dataKey="totalSessions"
                position="top"
                style={{ fontSize: 12, fontWeight: 600, fill: '#262626' }}
              />
            </Bar>
            <Bar dataKey="activeSessions" fill="#52c41a" radius={[6, 6, 0, 0]} maxBarSize={60}>
              <LabelList
                dataKey="activeSessions"
                position="top"
                style={{ fontSize: 12, fontWeight: 600, fill: '#262626' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default TokenUsageChart;
