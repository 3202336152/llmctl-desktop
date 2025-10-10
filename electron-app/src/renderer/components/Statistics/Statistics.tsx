import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Table,
  Progress,
  Space,
  message,
} from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProviders } from '../../store/slices/providerSlice';
import { statisticsAPI } from '../../services/api';
import { UsageStatistics, DailyStatistics } from '../../types';
import type { RootState } from '../../store';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Statistics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [days, setDays] = useState<number>(7);
  const [statistics, setStatistics] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  useEffect(() => {
    loadStatistics();
  }, [selectedProviderId, days]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await statisticsAPI.getUsageStatistics(selectedProviderId || undefined, days);
      setStatistics(response.data || null);
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const chartData = statistics?.dailyStats?.map(stat => ({
    date: new Date(stat.date).toLocaleDateString(),
    请求数: stat.requests,
    成功数: stat.successes,
    错误数: stat.errors,
    成功率: stat.requests > 0 ? ((stat.successes / stat.requests) * 100).toFixed(1) : 0,
  })) || [];

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '总请求数',
      dataIndex: 'requests',
      key: 'requests',
    },
    {
      title: '成功请求',
      dataIndex: 'successes',
      key: 'successes',
    },
    {
      title: '失败请求',
      dataIndex: 'errors',
      key: 'errors',
    },
    {
      title: '成功率',
      key: 'successRate',
      render: (_: any, record: DailyStatistics) => {
        const rate = record.requests > 0 ? (record.successes / record.requests) * 100 : 0;
        return (
          <Space>
            <Progress
              percent={rate}
              size="small"
              strokeColor={rate >= 95 ? '#52c41a' : rate >= 80 ? '#faad14' : '#ff4d4f'}
              showInfo={false}
              style={{ width: 60 }}
            />
            <span>{rate.toFixed(1)}%</span>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <label>Provider：</label>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="选择Provider（留空表示全部）"
              value={selectedProviderId}
              onChange={setSelectedProviderId}
              allowClear
            >
              {providers.map((provider) => (
                <Option key={provider.id} value={provider.id}>
                  {provider.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <label>统计天数：</label>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={days}
              onChange={setDays}
            >
              <Option value={7}>最近7天</Option>
              <Option value={15}>最近15天</Option>
              <Option value={30}>最近30天</Option>
              <Option value={90}>最近90天</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card styles={{ body: { padding: '24px', minHeight: '120px' } }}>
            <Statistic
              title="总请求数"
              value={statistics?.totalRequests || 0}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card styles={{ body: { padding: '24px', minHeight: '120px' } }}>
            <Statistic
              title="成功率"
              value={statistics?.successRate || 0}
              precision={2}
              suffix="%"
              valueStyle={{
                color: (statistics?.successRate || 0) >= 95 ? '#3f8600' : '#cf1322',
              }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card styles={{ body: { padding: '24px', minHeight: '120px' } }}>
            <Statistic
              title="平均响应时间"
              value={statistics?.avgResponseTime || 0}
              suffix="ms"
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card styles={{ body: { padding: '24px', minHeight: '120px' } }}>
            <Statistic
              title="活跃Provider数"
              value={providers.filter(p => p.isActive).length}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 请求趋势图 */}
      <Card title="请求趋势" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="请求数" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="成功数" stroke="#82ca9d" strokeWidth={2} />
            <Line type="monotone" dataKey="错误数" stroke="#ff7c7c" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 成功率趋势图 */}
      <Card title="成功率趋势" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value: any) => [`${value}%`, '成功率']} />
            <Legend />
            <Bar dataKey="成功率" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 详细数据表格 */}
      <Card title="详细统计数据">
        <Table
          columns={columns}
          dataSource={statistics?.dailyStats || []}
          rowKey="date"
          loading={loading}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
};

export default Statistics;