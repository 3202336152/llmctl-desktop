import React, { useState, useEffect } from 'react';
import { Card, Empty, Skeleton, Alert, Radio } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import httpClient from '../../services/httpClient';

interface SessionDurationTrendData {
  date: string;
  avgDuration: number;
  sessionCount: number;
}

type TimeRange = 7 | 30 | 90;

/**
 * 会话时长趋势图组件
 * 显示最近N天的会话平均时长和数量趋势，支持7天/30天/90天切换
 */
const SessionTrendChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<SessionDurationTrendData[]>([]);
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

      const response = await httpClient.get('/statistics/session-duration-trend', {
        params: { days: timeRange },
      });

      if (response.data && response.data.code === 200) {
        setData(response.data.data || []);
      } else {
        setError(response.data?.message || t('dashboard.loadFailed', '加载失败'));
      }
    } catch (err: any) {
      console.error('[SessionTrendChart] 加载失败:', err);
      setError(err.response?.data?.message || err.message || t('dashboard.loadFailed', '加载失败'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    // 将 YYYY-MM-DD 格式转换为 MM-DD
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[1]}-${parts[2]}` : dateStr;
  };

  const handleTimeRangeChange = (e: any) => {
    setTimeRange(e.target.value);
  };

  return (
    <Card
      title="会话时长趋势"
      extra={
        <Radio.Group value={timeRange} onChange={handleTimeRangeChange} size="small">
          <Radio.Button value={7}>7天</Radio.Button>
          <Radio.Button value={30}>30天</Radio.Button>
          <Radio.Button value={90}>90天</Radio.Button>
        </Radio.Group>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : data.length === 0 ? (
        <Empty
          description={t('dashboard.noSessionData', '暂无会话数据，请先创建会话')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#8c8c8c"
              style={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#8c8c8c"
              style={{ fontSize: 12 }}
              label={{ value: t('dashboard.durationMinutes', '时长（分钟）'), angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #d9d9d9', borderRadius: 4 }}
              formatter={(value: number, name: string) => {
                if (name === 'avgDuration') {
                  return [
                    `${value.toFixed(1)} ${t('dashboard.minutes', '分钟')}`,
                    t('dashboard.avgDuration', '平均时长'),
                  ];
                }
                return [value, t('dashboard.sessionCount', '会话数')];
              }}
              labelFormatter={(label: string) => `${t('dashboard.date', '日期')}: ${formatDate(label)}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => {
                if (value === 'avgDuration') return t('dashboard.avgDuration', '平均时长');
                return t('dashboard.sessionCount', '会话数');
              }}
            />
            <Line
              type="monotone"
              dataKey="avgDuration"
              stroke="#1890ff"
              strokeWidth={2}
              dot={{ fill: '#1890ff', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="sessionCount"
              stroke="#52c41a"
              strokeWidth={2}
              dot={{ fill: '#52c41a', r: 4 }}
              activeDot={{ r: 6 }}
              yAxisId="right"
              hide
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default SessionTrendChart;
