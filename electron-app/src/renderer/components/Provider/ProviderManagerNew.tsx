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
  Radio,
  InputNumber,
  Tag,
  Divider,
  Alert,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProviders, createProvider, updateProvider, deleteProvider } from '../../store/slices/providerSlice';
import type { RootState } from '../../store';
import { useTranslation } from 'react-i18next';
import './ProviderManager.css';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

/**
 * Provider 管理组件（重构版）
 *
 * 功能：
 * 1. 基础信息：名称、描述、类型（单选）
 * 2. 动态表单：根据类型显示不同的配置字段
 *    - Claude Code → API 配置（Base URL、模型、Max Tokens、Temperature）
 *    - Codex → TOML 配置（config.toml、auth.json）
 *    - Gemini/Qoder → 即将推出提示
 */
const ProviderManager: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { providers, loading } = useAppSelector((state: RootState) => state.provider);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 监听表单中的 providerType 字段变化
  const providerType = Form.useWatch('providerType', form);

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  // 打开创建 Modal
  const handleCreate = () => {
    setEditingProvider(null);
    form.resetFields();
    // 默认选择 claude
    form.setFieldsValue({ providerType: 'claude', maxTokens: 8192, temperature: 0.7 });
    setModalVisible(true);
  };

  // 打开编辑 Modal
  const handleEdit = (provider: any) => {
    setEditingProvider(provider);
    form.setFieldsValue({
      name: provider.name,
      description: provider.description,
      providerType: provider.providerType,
      // Claude Code 字段
      baseUrl: provider.baseUrl,
      modelName: provider.modelName,
      maxTokens: provider.maxTokens,
      temperature: provider.temperature,
      // Codex 字段
      codexConfigToml: provider.codexConfigToml,
      codexAuthTemplate: provider.codexAuthTemplate,
    });
    setModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingProvider) {
        // 更新
        await dispatch(updateProvider({ id: editingProvider.id, request: values })).unwrap();
        message.success(t('provider.updateSuccess'));
      } else {
        // 创建
        await dispatch(createProvider(values)).unwrap();
        message.success(t('provider.createSuccess'));
      }

      setModalVisible(false);
      form.resetFields();
      dispatch(fetchProviders());
    } catch (error: any) {
      message.error(error.message || t('provider.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // 删除 Provider
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: t('provider.deleteConfirm'),
      content: t('provider.deleteHint'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deleteProvider(id)).unwrap();
          message.success(t('provider.deleteSuccess'));
          dispatch(fetchProviders());
        } catch (error: any) {
          message.error(error.message || t('provider.deleteFailed'));
        }
      },
    });
  };

  // 表格列定义
  const columns: any[] = [
    {
      title: t('provider.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
    },
    {
      title: t('provider.type'),
      dataIndex: 'providerType',
      key: 'providerType',
      width: 120,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          claude: 'blue',
          codex: 'green',
          gemini: 'orange',
          qoder: 'purple',
        };
        const labelMap: Record<string, string> = {
          claude: 'Claude Code',
          codex: 'Codex',
          gemini: 'Google Gemini',
          qoder: 'Qoder',
        };
        return <Tag color={colorMap[type]}>{labelMap[type] || type}</Tag>;
      },
    },
    {
      title: t('provider.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 300,
    },
    {
      title: t('provider.model'),
      dataIndex: 'modelName',
      key: 'modelName',
      width: 200,
      render: (text: string) => text || '-',
    },
    {
      title: t('provider.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            {t('provider.enabled')}
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            {t('provider.disabled')}
          </Tag>
        ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            {t('common.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  // 根据 Provider 类型渲染动态配置字段
  const renderDynamicFields = () => {
    if (!providerType) {
      return (
        <Alert
          message={t('provider.selectTypeFirst')}
          description={t('provider.selectTypeHint')}
          type="info"
          showIcon
        />
      );
    }

    if (providerType === 'claude') {
      return (
        <>
          <Divider>{t('provider.claudeConfig')}</Divider>

          <Form.Item
            label="Base URL"
            name="baseUrl"
            rules={[
              { required: true, message: t('provider.baseUrlRequired') },
              { type: 'url', message: t('provider.baseUrlInvalid') },
            ]}
          >
            <Input placeholder="https://api.anthropic.com/v1" />
          </Form.Item>

          <Form.Item
            label={t('provider.model')}
            name="modelName"
            rules={[{ required: true, message: t('provider.modelRequired') }]}
          >
            <Input placeholder="claude-3-5-sonnet-20241022" />
          </Form.Item>

          <Form.Item
            label="Max Tokens"
            name="maxTokens"
            rules={[{ required: true, message: t('provider.maxTokensRequired') }]}
          >
            <InputNumber min={1} max={1000000} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Temperature"
            name="temperature"
            rules={[{ required: true, message: t('provider.temperatureRequired') }]}
          >
            <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </>
      );
    }

    if (providerType === 'codex') {
      return (
        <>
          <Divider>{t('provider.codexConfig')}</Divider>

          <Alert
            message={t('provider.codexConfigHint')}
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>{t('provider.codexHint1')}</li>
                <li>{t('provider.codexHint2')}</li>
                <li>
                  {t('provider.codexHint3')} <Text code>{'${API_KEY}'}</Text>{' '}
                  {t('provider.codexHint4')}
                </li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label="config.toml"
            name="codexConfigToml"
            rules={[{ required: true, message: t('provider.codexConfigRequired') }]}
            tooltip={t('provider.codexConfigTooltip')}
          >
            <TextArea
              rows={10}
              placeholder={`model = "gpt-4-turbo"
model_provider = "anyrouter"
preferred_auth_method = "apikey"

[model_providers.anyrouter]
name = "Any Router"
base_url = "https://anyrouter.top/v1"
wire_api = "responses"`}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>

          <Form.Item
            label="auth.json"
            name="codexAuthTemplate"
            rules={[{ required: true, message: t('provider.codexAuthRequired') }]}
            tooltip={t('provider.codexAuthTooltip')}
          >
            <TextArea
              rows={4}
              placeholder={`{
  "OPENAI_API_KEY": "\${API_KEY}"
}`}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>
        </>
      );
    }

    if (providerType === 'gemini' || providerType === 'qoder') {
      return (
        <Alert
          message={t('provider.comingSoon')}
          description={t('provider.comingSoonDescription')}
          type="warning"
          showIcon
        />
      );
    }

    return null;
  };

  return (
    <Card
      title={t('provider.title')}
      extra={
        <Space>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchProviders())}
            loading={loading}
          >
            {t('common.refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('provider.createProvider')}
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={providers}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10 }}
      />

      {/* 创建/编辑 Modal */}
      <Modal
        title={editingProvider ? t('provider.editProvider') : t('provider.createProvider')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          autoComplete="off"
        >
          {/* 基础信息 */}
          <Form.Item
            label={t('provider.name')}
            name="name"
            rules={[
              { required: true, message: t('provider.nameRequired') },
              { max: 100, message: t('provider.nameTooLong') },
            ]}
          >
            <Input placeholder={t('provider.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('provider.description')}
            name="description"
            rules={[{ max: 1000, message: t('provider.descriptionTooLong') }]}
          >
            <TextArea
              rows={3}
              placeholder={t('provider.descriptionPlaceholder')}
            />
          </Form.Item>

          {/* Provider 类型（单选） */}
          <Form.Item
            label={t('provider.type')}
            name="providerType"
            rules={[{ required: true, message: t('provider.typeRequired') }]}
          >
            <Radio.Group>
              <Radio value="claude">Claude Code</Radio>
              <Radio value="codex">Codex</Radio>
              <Radio value="gemini" disabled>
                Google Gemini <Tag color="orange">{t('provider.comingSoon')}</Tag>
              </Radio>
              <Radio value="qoder" disabled>
                Qoder <Tag color="purple">{t('provider.comingSoon')}</Tag>
              </Radio>
            </Radio.Group>
          </Form.Item>

          {/* 动态配置字段 */}
          {renderDynamicFields()}
        </Form>
      </Modal>
    </Card>
  );
};

export default ProviderManager;
