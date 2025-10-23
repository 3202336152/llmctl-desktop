import React, { useEffect, useState, useMemo } from 'react';
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
  Tag,
  Tooltip,
  App as AntApp,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProviders, createProvider, updateProvider, deleteProvider } from '../../store/slices/providerSlice';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from '../../types';
import type { RootState } from '../../store';
import { useTranslation } from 'react-i18next';
import './ProviderManager.css';

const { Option } = Select;
const { TextArea } = Input;
const { Search } = Input;

const ProviderManager: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { modal } = AntApp.useApp();
  const { providers, loading, error } = useAppSelector((state: RootState) => state.provider);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [submitting, setSubmitting] = useState(false); // 防止重复提交
  const [form] = Form.useForm();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // 监听选中的类型

  // 筛选和搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  // 筛选后的数据
  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      // 搜索关键词筛选（名称、描述）
      const matchesSearch = !searchKeyword ||
        provider.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        provider.description?.toLowerCase().includes(searchKeyword.toLowerCase());

      // 类型筛选（检查 types 数组是否包含筛选类型）
      const matchesType = !typeFilter || provider.types.includes(typeFilter as any);

      // 状态筛选
      const matchesStatus = statusFilter === undefined || provider.isActive === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [providers, searchKeyword, typeFilter, statusFilter]);

  // 重置筛选条件
  const handleResetFilters = () => {
    setSearchKeyword('');
    setTypeFilter(undefined);
    setStatusFilter(undefined);
  };

  const handleCreateProvider = () => {
    setEditingProvider(null);
    form.resetFields();
    setSelectedTypes([]);
    setModalVisible(true);
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setSelectedTypes(provider.types || []);

    // 从 configs 中提取各个 CLI 类型的配置
    const formValues: any = {
      name: provider.name,
      description: provider.description,
      types: provider.types,
      isActive: provider.isActive,
    };

    // 提取各个 CLI 类型的配置数据
    if (provider.configs) {
      provider.configs.forEach(config => {
        const cliType = config.cliType;
        const configData = config.configData || {};

        if (cliType === 'claude code') {
          formValues.claudeBaseUrl = configData.baseUrl;
          formValues.claudeModelName = configData.modelName;
          formValues.claudeMaxTokens = configData.maxTokens;
          formValues.claudeTemperature = configData.temperature;
        } else if (cliType === 'codex') {
          // 只加载 config.toml，auth.json 由系统自动生成
          formValues.codexConfigToml = configData.configToml;
        } else if (cliType === 'gemini') {
          formValues.geminiBaseUrl = configData.baseUrl;
          formValues.geminiModelName = configData.modelName;
          formValues.geminiMaxTokens = configData.maxTokens;
          formValues.geminiTemperature = configData.temperature;
        } else if (cliType === 'qoder') {
          formValues.qoderBaseUrl = configData.baseUrl;
          formValues.qoderModelName = configData.modelName;
          formValues.qoderMaxTokens = configData.maxTokens;
          formValues.qoderTemperature = configData.temperature;
        }
      });
    }

    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  const handleDeleteProvider = (id: string) => {
    modal.confirm({
      title: t('providers.deleteConfirm'),
      content: t('providers.deleteDesc'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteProvider(id)).unwrap();
          message.success('Provider删除成功');
        } catch (error) {
          message.error(`删除失败: ${error}`);
        }
      },
    });
  };

  const handleModalOk = async () => {
    // 防止重复提交
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const values = await form.validateFields();

      // 构造请求对象
      const requestData: any = {
        name: values.name,
        description: values.description,
        types: values.types,
      };

      // 根据选中的类型添加对应的配置
      if (values.types.includes('claude code')) {
        requestData.claudeConfig = {
          baseUrl: values.claudeBaseUrl || '',
          modelName: values.claudeModelName || '',
          maxTokens: values.claudeMaxTokens,
          temperature: values.claudeTemperature,
        };
      }

      if (values.types.includes('codex')) {
        // 自动生成 auth.json 默认结构
        const authJson = JSON.stringify({
          "OPENAI_API_KEY": ""
        }, null, 2);

        requestData.codexConfig = {
          configToml: values.codexConfigToml || '',
          authJson: authJson,
        };
      }

      if (values.types.includes('gemini')) {
        requestData.geminiConfig = {
          baseUrl: values.geminiBaseUrl || '',
          modelName: values.geminiModelName || '',
          maxTokens: values.geminiMaxTokens,
          temperature: values.geminiTemperature,
        };
      }

      if (values.types.includes('qoder')) {
        requestData.qoderConfig = {
          baseUrl: values.qoderBaseUrl || '',
          modelName: values.qoderModelName || '',
          maxTokens: values.qoderMaxTokens,
          temperature: values.qoderTemperature,
        };
      }

      if (editingProvider) {
        // 更新Provider
        const updateRequest: UpdateProviderRequest = {
          ...requestData,
          isActive: values.isActive,
        };
        await dispatch(updateProvider({ id: editingProvider.id, request: updateRequest })).unwrap();
        message.success('Provider更新成功');
      } else {
        // 创建Provider（包含Token）
        const createRequest: CreateProviderRequest = {
          ...requestData,
          token: values.token,
          tokenAlias: values.tokenAlias,
        };
        await dispatch(createProvider(createRequest)).unwrap();
        message.success('Provider创建成功');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(`操作失败: ${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: t('providers.name'),
      dataIndex: 'name',
      key: 'name',
      align: 'center' as const,
      render: (text: string) => (
        <Space>
          <ApiOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: t('providers.type'),
      dataIndex: 'types',
      key: 'types',
      align: 'center' as const,
      render: (types: string[]) => {
        const typeColors: Record<string, string> = {
          'claude code': 'blue',
          'codex': 'green',
          'gemini': 'purple',
          'qoder': 'orange',
        };
        return (
          <Space wrap>
            {types.map((type) => (
              <Tag key={type} color={typeColors[type] || 'default'}>
                {type.toUpperCase()}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t('providers.description'),
      dataIndex: 'description',
      key: 'description',
      align: 'center' as const,
      render: (description: string) => (
        <Tooltip title={description}>
          <span>{description && description.length > 40 ? `${description.substring(0, 40)}...` : description || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: t('providers.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center' as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}>
          {isActive ? t('common.enabled') : t('common.disabled')}
        </Tag>
      ),
    },
    {
      title: t('providers.actions'),
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: Provider) => (
        <Space size="large">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditProvider(record)}
          >
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProvider(record.id)}
          >
            {t('common.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('providers.title')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProvider}>
            {t('providers.createProvider')}
          </Button>
        }
      >
        {/* 搜索和筛选栏 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={8}>
            <Search
              placeholder="搜索名称、描述或模型"
              allowClear
              enterButton={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
              onSearch={(value: string) => setSearchKeyword(value)}
            />
          </Col>
          <Col xs={12} sm={12} md={5}>
            <Select
              placeholder="选择类型"
              allowClear
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={(value: string) => setTypeFilter(value)}
            >
              <Option value="claude code">Claude Code</Option>
              <Option value="codex">Codex</Option>
              <Option value="gemini">Google Gemini</Option>
              <Option value="qoder">Qoder</Option>
            </Select>
          </Col>
          <Col xs={12} sm={12} md={5}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(value: boolean) => setStatusFilter(value)}
            >
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                重置
              </Button>
              <span style={{ color: '#8c8c8c' }}>
                共 {filteredProviders.length} 条记录
              </span>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredProviders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total: number) => t('providers.totalRecords', { total }),
          }}
        />
      </Card>

      <Modal
        title={editingProvider ? t('providers.editProvider') : t('providers.createProvider')}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={submitting}
        width={700}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
          }}
          preserve={false}
        >
          <Form.Item
            label={t('providers.name')}
            name="name"
            rules={[{ required: true, message: t('providers.nameRequired') }]}
          >
            <Input placeholder={t('providers.namePlaceholder')} />
          </Form.Item>

          <Form.Item label={t('providers.description')} name="description">
            <TextArea rows={3} placeholder={t('providers.descriptionPlaceholder')} />
          </Form.Item>

          {/* Token 输入框（创建时必填） */}
          {!editingProvider && (
            <>
              <Form.Item
                label="API Token"
                name="token"
                rules={[{ required: true, message: '请输入API Token' }]}
              >
                <Input.Password placeholder="请输入API Token" />
              </Form.Item>

              <Form.Item label="Token 别名" name="tokenAlias">
                <Input placeholder="可选，用于标识此Token" />
              </Form.Item>
            </>
          )}

          <Form.Item
            label={t('providers.type')}
            name="types"
            rules={[{ required: true, message: '请至少选择一个Provider类型' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择支持的CLI类型（可多选）"
              style={{ width: '100%' }}
              onChange={(values: string[]) => setSelectedTypes(values)}
              options={[
                {
                  label: 'Claude Code',
                  value: 'claude code',
                },
                {
                  label: 'Codex',
                  value: 'codex',
                },
                {
                  label: 'Google Gemini（暂未适配）',
                  value: 'gemini',
                  disabled: true,
                },
                {
                  label: 'Qoder（暂未适配）',
                  value: 'qoder',
                  disabled: true,
                },
              ]}
            />
          </Form.Item>

          {/* Claude Code 配置 */}
          {selectedTypes.includes('claude code') && (
            <>
              <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, color: '#1890ff' }}>
                Claude Code 配置
              </div>
              <Form.Item
                label="Base URL"
                name="claudeBaseUrl"
                rules={[{ required: true, message: '请输入Claude Code的Base URL' }]}
              >
                <Input placeholder="请输入API Base URL" />
              </Form.Item>
              <Form.Item label="Model Name" name="claudeModelName">
                <Input placeholder="请输入模型名称" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Max Tokens" name="claudeMaxTokens">
                    <InputNumber min={1} max={100000} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Temperature" name="claudeTemperature">
                    <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Codex 配置 */}
          {selectedTypes.includes('codex') && (
            <>
              <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, color: '#52c41a' }}>
                Codex 配置
              </div>
              <Form.Item
                label="config.toml 文件内容"
                name="codexConfigToml"
                rules={[{ required: true, message: '请输入 config.toml 文件内容' }]}
              >
                <TextArea
                  rows={10}
                  placeholder={`示例内容：
model = "gpt-5-codex"
model_provider = "joker"
preferred_auth_method = "apikey"

[model_providers.joker]
name = "Any Router"
base_url = "https://joker.top/v1"
wire_api = "responses"`}
                />
              </Form.Item>
              <div style={{ padding: '8px 12px', background: '#f0f9ff', border: '1px solid #91d5ff', borderRadius: '4px', color: '#0958d9', marginBottom: '16px' }}>
                💡 <strong>说明：</strong>系统将自动生成 auth.json 文件，并使用关联的 API Token。
              </div>
            </>
          )}

          {/* Gemini 配置 */}
          {selectedTypes.includes('gemini') && (
            <>
              <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, color: '#722ed1' }}>
                Google Gemini 配置
              </div>
              <div style={{ padding: '16px 12px', background: '#fafafa', border: '1px solid #d9d9d9', borderRadius: '4px', color: '#8c8c8c', textAlign: 'center', marginBottom: '16px' }}>
                🚧 <strong>暂未适配</strong>：该 CLI 类型正在开发中，敬请期待后续版本支持
              </div>
            </>
          )}

          {/* Qoder 配置 */}
          {selectedTypes.includes('qoder') && (
            <>
              <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, color: '#fa8c16' }}>
                Qoder 配置
              </div>
              <div style={{ padding: '16px 12px', background: '#fafafa', border: '1px solid #d9d9d9', borderRadius: '4px', color: '#8c8c8c', textAlign: 'center', marginBottom: '16px' }}>
                🚧 <strong>暂未适配</strong>：该 CLI 类型正在开发中，敬请期待后续版本支持
              </div>
            </>
          )}

          <Form.Item
            label={t('providers.status')}
            name="isActive"
            valuePropName="checked"
            style={{ marginTop: 16 }}
          >
            <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProviderManager;