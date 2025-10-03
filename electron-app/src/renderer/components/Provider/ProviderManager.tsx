import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  message,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Popconfirm,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProviders, createProvider, updateProvider, deleteProvider } from '../../store/slices/providerSlice';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from '../../types';
import type { RootState } from '../../store';

const { Option } = Select;
const { TextArea } = Input;

const ProviderManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { providers, loading, error } = useAppSelector((state: RootState) => state.provider);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  const handleCreateProvider = () => {
    setEditingProvider(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    form.setFieldsValue({
      name: provider.name,
      description: provider.description,
      type: provider.type,
      baseUrl: provider.baseUrl,
      modelName: provider.modelName,
      maxTokens: provider.maxTokens,
      temperature: provider.temperature,
      isActive: provider.isActive,
    });
    setModalVisible(true);
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      await dispatch(deleteProvider(id)).unwrap();
      message.success('Provider删除成功');
    } catch (error) {
      message.error(`删除失败: ${error}`);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingProvider) {
        // 更新Provider
        const updateRequest: UpdateProviderRequest = {
          name: values.name,
          description: values.description,
          baseUrl: values.baseUrl,
          modelName: values.modelName,
          maxTokens: values.maxTokens,
          temperature: values.temperature,
          isActive: values.isActive,
        };
        await dispatch(updateProvider({ id: editingProvider.id, request: updateRequest })).unwrap();
        message.success('Provider更新成功');
      } else {
        // 创建Provider
        const createRequest: CreateProviderRequest = {
          name: values.name,
          description: values.description,
          type: values.type,
          baseUrl: values.baseUrl,
          modelName: values.modelName,
          token: values.token,
          maxTokens: values.maxTokens,
          temperature: values.temperature,
        };
        await dispatch(createProvider(createRequest)).unwrap();
        message.success('Provider创建成功');
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

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Provider) => (
        <Space>
          <ApiOutlined />
          <span>{text}</span>
          {record.isActive && <Tag color="green">活跃</Tag>}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeColors: Record<string, string> = {
          anthropic: 'blue',
          openai: 'green',
          qwen: 'orange',
          gemini: 'purple',
        };
        return <Tag color={typeColors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: '模型',
      dataIndex: 'modelName',
      key: 'modelName',
    },
    {
      title: 'Base URL',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      render: (url: string) => (
        <Tooltip title={url}>
          <span>{url.length > 30 ? `${url.substring(0, 30)}...` : url}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Max Tokens',
      dataIndex: 'maxTokens',
      key: 'maxTokens',
    },
    {
      title: 'Temperature',
      dataIndex: 'temperature',
      key: 'temperature',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Provider) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditProvider(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个Provider吗？"
            description="删除后将无法恢复"
            onConfirm={() => handleDeleteProvider(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Provider管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProvider}>
            新建Provider
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={providers}
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

      <Modal
        title={editingProvider ? '编辑Provider' : '新建Provider'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'anthropic',
            baseUrl: 'https://api.anthropic.com',
            modelName: 'claude-sonnet-4-5-20250929',
            maxTokens: 4096,
            temperature: 0.7,
            isActive: true,
          }}
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入Provider名称' }]}
          >
            <Input placeholder="请输入Provider名称" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="请输入Provider描述" />
          </Form.Item>

          {!editingProvider && (
            <Form.Item
              label="类型"
              name="type"
              rules={[{ required: true, message: '请选择Provider类型' }]}
            >
              <Select placeholder="请选择Provider类型">
                <Option value="anthropic">Anthropic</Option>
                <Option value="openai">OpenAI</Option>
                <Option value="qwen">通义千问</Option>
                <Option value="gemini">Google Gemini</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Base URL" name="baseUrl">
            <Input placeholder="请输入API Base URL" />
          </Form.Item>

          <Form.Item label="模型名称" name="modelName">
            <Input placeholder="请输入模型名称" />
          </Form.Item>

          {!editingProvider && (
            <Form.Item
              label="Token"
              name="token"
              rules={[{ required: true, message: '请输入API Token' }]}
            >
              <Input.Password placeholder="请输入API Token" />
            </Form.Item>
          )}

          <Form.Item label="最大Token数" name="maxTokens">
            <InputNumber
              min={1}
              max={100000}
              placeholder="最大Token数"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Temperature" name="temperature">
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              placeholder="Temperature"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProviderManager;