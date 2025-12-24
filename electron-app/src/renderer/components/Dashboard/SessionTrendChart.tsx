import React, { useState, useEffect, useCallback } from 'react';
import { Card, Empty, Skeleton, Alert, Radio, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
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
 * 使用双Y轴同时展示平均时长和会话数量
 */
const SessionTrendChart: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<SessionDurationTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(7);

  const fetchData = useCallback(async () => {
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
  }, [timeRange, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    // 将 YYYY-MM-DD 格式转换为 MM-DD
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[1]}-${parts[2]}` : dateStr;
  };

  const handleTimeRangeChange = (e: any) => {
    setTimeRange(e.target.value);
  };

  // 检查是否有实际数据（非全零）
  const hasActualData = data.some(item => item.avgDuration > 0 || item.sessionCount > 0);

  return (
    <Card
      title="会话时长趋势"
      extra={
        <Space>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
            size="small"
          />
          <Radio.Group value={timeRange} onChange={handleTimeRangeChange} size="small">
            <Radio.Button value={7}>7天</Radio.Button>
            <Radio.Button value={30}>30天</Radio.Button>
            <Radio.Button value={90}>90天</Radio.Button>
          </Radio.Group>
        </Space>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : !hasActualData ? (
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
            {/* 左侧Y轴：平均时长 */}
            <YAxis
              yAxisId="left"
              stroke="#1890ff"
              style={{ fontSize: 12 }}
              label={{ value: t('dashboard.durationMinutes', '时长（分钟）'), angle: -90, position: 'insideLeft', fill: '#1890ff' }}
            />
            {/* 右侧Y轴：会话数量 */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#52c41a"
              style={{ fontSize: 12 }}
              label={{ value: t('dashboard.sessionCount', '会话数'), angle: 90, position: 'insideRight', fill: '#52c41a' }}
              allowDecimals={false}
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
              yAxisId="left"
            />
            <Line
              type="monotone"
              dataKey="sessionCount"
              stroke="#52c41a"
              strokeWidth={2}
              dot={{ fill: '#52c41a', r: 4 }}
              activeDot={{ r: 6 }}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default SessionTrendChart;
