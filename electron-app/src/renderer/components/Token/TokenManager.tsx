import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Tag,
  Row,
  Col,
  Statistic,
  App as AntApp,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  KeyOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProviders } from '../../store/slices/providerSlice';
import { setTokens, addToken, updateToken, removeToken, setLoading, setError } from '../../store/slices/tokenSlice';
import { tokenAPI } from '../../services/api';
import { Token, CreateTokenRequest, UpdateTokenRequest, TokenStrategy } from '../../types';
import type { RootState } from '../../store';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const TokenManager: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { modal } = AntApp.useApp();
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const { tokens, loading } = useAppSelector((state: RootState) => state.token);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingToken, setEditingToken] = useState<Token | null>(null);
  const [strategyModalVisible, setStrategyModalVisible] = useState(false);
  const [tokenStrategy, setTokenStrategy] = useState<TokenStrategy>({
    type: 'round-robin',
    fallbackOnError: true,
  });
  const [form] = Form.useForm();
  const [strategyForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  // 当 providers 加载完成后，恢复上次选择的 Provider 或选择第一个
  useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      // 从 localStorage 读取上次选择的 Provider ID
      const lastSelectedProviderId = localStorage.getItem('lastSelectedProviderId');

      // 检查上次选择的 Provider 是否仍然存在
      if (lastSelectedProviderId && providers.some(p => p.id === lastSelectedProviderId)) {
        setSelectedProviderId(lastSelectedProviderId);
      } else {
        // 否则选择第一个
        setSelectedProviderId(providers[0].id);
      }
    }
  }, [providers, selectedProviderId]);

  useEffect(() => {
    if (selectedProviderId) {
      loadTokens();
      // 保存当前选择的 Provider ID 到 localStorage
      localStorage.setItem('lastSelectedProviderId', selectedProviderId);
    }
  }, [selectedProviderId]);

  const loadTokens = async () => {
    if (!selectedProviderId) return;

    try {
      dispatch(setLoading(true));
      const response = await tokenAPI.getTokensByProviderId(selectedProviderId);
      dispatch(setTokens(response.data || []));
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to load tokens'));
      message.error('加载Token失败');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateToken = () => {
    setEditingToken(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditToken = (token: Token) => {
    setEditingToken(token);
    form.setFieldsValue({
      alias: token.alias,
      weight: token.weight,
      enabled: token.enabled,
      healthy: token.healthy, // 添加健康状态
    });
    setModalVisible(true);
  };

  const handleDeleteToken = (tokenId: string) => {
    if (!selectedProviderId) return;

    modal.confirm({
      title: '确定要删除这个Token吗？',
      content: '删除后将无法恢复',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tokenAPI.deleteToken(selectedProviderId, tokenId);
          dispatch(removeToken(tokenId));
          message.success('Token删除成功');
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const handleModalOk = async () => {
    if (!selectedProviderId) return;

    try {
      const values = await form.validateFields();

      if (editingToken) {
        // 更新Token
        const updateRequest: UpdateTokenRequest = {
          alias: values.alias,
          weight: values.weight,
          enabled: values.enabled,
          healthy: values.healthy,
        };
        const response = await tokenAPI.updateToken(selectedProviderId, editingToken.id, updateRequest);
        if (response.data) {
          dispatch(updateToken(response.data));
        }
        message.success('Token更新成功');
      } else {
        // 创建Token
        const createRequest: CreateTokenRequest = {
          value: values.value,
          alias: values.alias,
          weight: values.weight || 1,
          enabled: values.enabled !== false,
        };
        const response = await tokenAPI.createToken(selectedProviderId, createRequest);
        if (response.data) {
          dispatch(addToken(response.data));
        }
        message.success('Token创建成功');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(`操作失败: ${error}`);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleStrategyModalOk = async () => {
    if (!selectedProviderId) return;

    try {
      const values = await strategyForm.validateFields();
      const strategy: TokenStrategy = {
        type: values.type,
        fallbackOnError: values.fallbackOnError,
      };

      await tokenAPI.setTokenStrategy(selectedProviderId, strategy);
      setTokenStrategy(strategy);
      message.success('Token策略设置成功');
      setStrategyModalVisible(false);
    } catch (error) {
      message.error(`设置失败: ${error}`);
    }
  };

  const handleRecoverAllUnhealthyTokens = async () => {
    if (!selectedProviderId) return;

    // 统计不健康的Token数量
    const unhealthyCount = tokens.filter(token => !token.healthy).length;

    if (unhealthyCount === 0) {
      message.info('所有Token均为健康状态，无需恢复');
      return;
    }

    modal.confirm({
      title: '确定要恢复所有不健康Token的健康状态吗？',
      content: `当前有 ${unhealthyCount} 个不健康的Token，将全部恢复为健康状态`,
      okText: '确定恢复',
      cancelText: '取消',
      icon: <MedicineBoxOutlined style={{ color: '#52c41a' }} />,
      onOk: async () => {
        try {
          const response = await tokenAPI.recoverAllUnhealthyTokens(selectedProviderId);
          const recoveredCount = response.data || 0;

          if (recoveredCount > 0) {
            message.success(response.message || `成功恢复 ${recoveredCount} 个Token的健康状态`);
            // 重新加载Token列表
            await loadTokens();
          } else {
            message.info('所有Token均为健康状态，无需恢复');
          }
        } catch (error) {
          message.error(`恢复失败: ${error}`);
        }
      },
    });
  };

  const columns = [
    {
      title: '别名',
      dataIndex: 'alias',
      key: 'alias',
      align: 'center' as const,
      render: (text: string, record: Token) => (
        <Space>
          <KeyOutlined />
          <span>{text || '未命名Token'}</span>
        </Space>
      ),
    },
    {
      title: 'Token值',
      dataIndex: 'maskedValue',
      key: 'maskedValue',
      align: 'center' as const,
      render: (text: string) => <code style={{ background: 'transparent', color: '#1890ff', padding: 0 }}>{text}</code>,
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      align: 'center' as const,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'} icon={enabled ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '健康状态',
      dataIndex: 'healthy',
      key: 'healthy',
      align: 'center' as const,
      render: (healthy: boolean) => (
        <div className="status-indicator">
          <div className={`status-dot ${healthy ? 'healthy' : 'unhealthy'}`}></div>
          <span>{healthy ? '健康' : '异常'}</span>
        </div>
      ),
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      align: 'center' as const,
      render: (text: string) => text ? new Date(text).toLocaleString() : '未使用',
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: Token) => (
        <Space size="large">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditToken(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteToken(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const healthyTokensCount = tokens.filter(token => token.healthy && token.enabled).length;
  const totalTokensCount = tokens.length;
  const enabledTokensCount = tokens.filter(token => token.enabled).length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card styles={{ body: { padding: '24px', minHeight: '120px' } }}>
            <Statistic title="总Token数" value={totalTokensCount} />
          </Card>
        </Col>
        <Col span={8}>
          <Card styles={{ body: { padding: '24px', minHeight: '120px' } }}>
            <Statistic title="启用Token数" value={enabledTokensCount} />
          </Card>
        </Col>
        <Col span={8}>
          <Card styles={{ body: { padding: '24px', minHeight: '120px' } }}>
            <Statistic title="健康Token数" value={healthyTokensCount} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={t('tokens.title')}
        extra={
          <Space size="large">
            <Select
              placeholder="选择Provider"
              style={{ width: 200 }}
              value={selectedProviderId}
              onChange={setSelectedProviderId}
            >
              {providers.map((provider) => (
                <Option key={provider.id} value={provider.id}>
                  {provider.name}
                </Option>
              ))}
            </Select>
            <Button
              type="default"
              onClick={() => {
                strategyForm.setFieldsValue(tokenStrategy);
                setStrategyModalVisible(true);
              }}
              disabled={!selectedProviderId}
            >
              设置策略
            </Button>
            <Button
              type="default"
              icon={<MedicineBoxOutlined />}
              onClick={handleRecoverAllUnhealthyTokens}
              disabled={!selectedProviderId || tokens.filter(token => !token.healthy).length === 0}
            >
              恢复健康
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateToken}
              disabled={!selectedProviderId}
            >
              添加Token
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={tokens}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* Token编辑Modal */}
      <Modal
        title={editingToken ? '编辑Token' : '添加Token'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={500}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            weight: 1,
            enabled: true,
          }}
        >
          {!editingToken && (
            <Form.Item
              label="Token值"
              name="value"
              rules={[{ required: true, message: '请输入Token值' }]}
            >
              <Input.Password placeholder="请输入Token值" />
            </Form.Item>
          )}

          <Form.Item label="别名" name="alias">
            <Input placeholder="请输入Token别名" />
          </Form.Item>

          <Form.Item label="权重" name="weight">
            <InputNumber
              min={1}
              max={10}
              placeholder="权重"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="启用状态" name="enabled" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          {editingToken && (
            <Form.Item label="健康状态" name="healthy" valuePropName="checked">
              <Switch checkedChildren="健康" unCheckedChildren="异常" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Token策略Modal */}
      <Modal
        title="Token轮询策略"
        open={strategyModalVisible}
        onOk={handleStrategyModalOk}
        onCancel={() => setStrategyModalVisible(false)}
        width={400}
        destroyOnHidden
      >
        <Form
          form={strategyForm}
          layout="vertical"
          initialValues={tokenStrategy}
        >
          <Form.Item
            label="轮询策略"
            name="type"
            rules={[{ required: true, message: '请选择轮询策略' }]}
          >
            <Select placeholder="请选择轮询策略">
              <Option value="round-robin">轮询 (Round Robin)</Option>
              <Option value="weighted">权重 (Weighted)</Option>
              <Option value="random">随机 (Random)</Option>
              <Option value="least-used">最少使用 (Least Used)</Option>
            </Select>
          </Form.Item>

          <Form.Item label="错误时回退" name="fallbackOnError" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TokenManager;