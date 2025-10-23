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
  Checkbox,
  InputNumber,
  Tag,
  Divider,
  Alert,
  Typography,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProviders, createProvider, updateProvider, deleteProvider } from '../../store/slices/providerSlice';
import type { RootState } from '../../store';
import { useTranslation } from 'react-i18next';
import './ProviderManager.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

/**
 * Provider 管理组件（多选版）
 *
 * 功能：
 * 1. 基础信息：名称、描述
 * 2. 类型多选：Claude Code、Codex、Gemini、Qoder（Checkbox.Group）
 * 3. 条件渲染配置区域：
 *    - 选中 Claude Code → 显示 API 配置区
 *    - 选中 Codex → 显示 TOML 配置区
 * 4. Token 共享：所有类型使用同一组 Token
 */
const ProviderManager: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { providers, loading } = useAppSelector((state: RootState) => state.provider);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 监听表单中的 types 字段变化
  const selectedTypes = Form.useWatch('types', form) || [];

  useEffect(() => {
    dispatch(fetchProviders());
  }, [dispatch]);

  // 打开创建 Modal
  const handleCreate = () => {
    setEditingProvider(null);
    form.resetFields();
    // 默认选中 claude code，并设置默认值
    form.setFieldsValue({
      types: ['claude code'],
      maxTokens: 8192,
      temperature: 0.7,
    });
    setModalVisible(true);
  };

  // 打开编辑 Modal
  const handleEdit = (provider: any) => {
    setEditingProvider(provider);
    form.setFieldsValue({
      name: provider.name,
      description: provider.description,
      types: provider.types || [],
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

      // 验证：至少选择一个类型
      if (!values.types || values.types.length === 0) {
        message.error(t('provider.atLeastOneType'));
        return;
      }

      // 验证：如果选中 claude code，必须填写相关字段
      if (values.types.includes('claude code')) {
        if (!values.baseUrl || !values.modelName) {
          message.error(t('provider.claudeConfigRequired'));
          return;
        }
      }

      // 验证：如果选中 codex，必须填写相关字段
      if (values.types.includes('codex')) {
        if (!values.codexConfigToml || !values.codexAuthTemplate) {
          message.error(t('provider.codexConfigRequiredError'));
          return;
        }
      }

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
      title: t('provider.types'),
      dataIndex: 'types',
      key: 'types',
      width: 250,
      render: (types: string[]) => (
        <>
          {types.map((type) => {
            const colorMap: Record<string, string> = {
              'claude code': 'blue',
              'codex': 'green',
              'gemini': 'orange',
              'qoder': 'purple',
            };
            const labelMap: Record<string, string> = {
              'claude code': 'Claude Code',
              'codex': 'Codex',
              'gemini': 'Google Gemini',
              'qoder': 'Qoder',
            };
            return (
              <Tag key={type} color={colorMap[type]}>
                {labelMap[type] || type}
              </Tag>
            );
          })}
        </>
      ),
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
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          autoComplete="off"
        >
          {/* ========== 基础信息 ========== */}
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

          {/* ========== 类型多选 ========== */}
          <Form.Item
            label={
              <span>
                {t('provider.types')}{' '}
                <Tooltip title={t('provider.typesHint')}>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </span>
            }
            name="types"
            rules={[
              { required: true, message: t('provider.typesRequired') },
              {
                validator: async (_: any, value: any) => {
                  if (!value || value.length === 0) {
                    throw new Error(t('provider.atLeastOneType'));
                  }
                },
              },
            ]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox value="claude code">
                  <Text strong>Claude Code</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    (Anthropic)
                  </Text>
                </Checkbox>
                <Checkbox value="codex">
                  <Text strong>Codex</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    (OpenAI Compatible)
                  </Text>
                </Checkbox>
                <Checkbox value="gemini" disabled>
                  <Text strong>Google Gemini</Text>
                  <Tag color="orange" style={{ marginLeft: 8 }}>
                    {t('provider.comingSoon')}
                  </Tag>
                </Checkbox>
                <Checkbox value="qoder" disabled>
                  <Text strong>Qoder</Text>
                  <Tag color="purple" style={{ marginLeft: 8 }}>
                    {t('provider.comingSoon')}
                  </Tag>
                </Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>

          {/* ========== Claude Code 配置区 ========== */}
          {selectedTypes.includes('claude code') && (
            <>
              <Divider orientation="left">
                <Tag color="blue">Claude Code</Tag> {t('provider.configuration')}
              </Divider>

              <Alert
                message={t('provider.claudeConfigHint')}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item
                label="Base URL"
                name="baseUrl"
                rules={[
                  { required: selectedTypes.includes('claude code'), message: t('provider.baseUrlRequired') },
                  { type: 'url', message: t('provider.baseUrlInvalid') },
                ]}
              >
                <Input placeholder="https://api.anthropic.com/v1" />
              </Form.Item>

              <Form.Item
                label={t('provider.model')}
                name="modelName"
                rules={[
                  { required: selectedTypes.includes('claude code'), message: t('provider.modelRequired') },
                ]}
              >
                <Input placeholder="claude-3-5-sonnet-20241022" />
              </Form.Item>

              <Form.Item
                label="Max Tokens"
                name="maxTokens"
                rules={[
                  { required: selectedTypes.includes('claude code'), message: t('provider.maxTokensRequired') },
                ]}
              >
                <InputNumber min={1} max={1000000} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Temperature"
                name="temperature"
                rules={[
                  { required: selectedTypes.includes('claude code'), message: t('provider.temperatureRequired') },
                ]}
              >
                <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}

          {/* ========== Codex 配置区 ========== */}
          {selectedTypes.includes('codex') && (
            <>
              <Divider orientation="left">
                <Tag color="green">Codex</Tag> {t('provider.configuration')}
              </Divider>

              <Alert
                message={t('provider.codexConfigHint')}
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li>{t('provider.codexHint1')}</li>
                    <li>{t('provider.codexHint2')}</li>
                    <li>
                      auth.json 中的 <Text code>{'${API_KEY}'}</Text> 会被替换为实际的 Token（来自 API Keys 页面）
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
                rules={[
                  { required: selectedTypes.includes('codex'), message: t('provider.codexConfigRequired') },
                ]}
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
                  style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '12px' }}
                />
              </Form.Item>

              <Form.Item
                label="auth.json"
                name="codexAuthTemplate"
                rules={[
                  { required: selectedTypes.includes('codex'), message: t('provider.codexAuthRequired') },
                ]}
                tooltip={t('provider.codexAuthTooltip')}
              >
                <TextArea
                  rows={4}
                  placeholder={`{
  "OPENAI_API_KEY": "\${API_KEY}"
}`}
                  style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '12px' }}
                />
              </Form.Item>
            </>
          )}

          {/* ========== Token 共享说明 ========== */}
          {selectedTypes.length > 0 && (
            <Alert
              message={t('provider.tokenShared')}
              description={t('provider.tokenSharedDescription')}
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}
        </Form>
      </Modal>
    </Card>
  );
};

export default ProviderManager;
