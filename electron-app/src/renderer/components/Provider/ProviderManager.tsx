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
  Tag,
  Tooltip,
  App as AntApp,
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
import { useTranslation } from 'react-i18next';

const { Option } = Select;
const { TextArea } = Input;

const ProviderManager: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { modal } = AntApp.useApp();
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
      dataIndex: 'type',
      key: 'type',
      align: 'center' as const,
      render: (type: string) => {
        const typeColors: Record<string, string> = {
          'claude code': 'blue',
          'codex': 'green',
          'gemini': 'purple',
          'qoder': 'orange',
        };
        return <Tag color={typeColors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: t('providers.model'),
      dataIndex: 'modelName',
      key: 'modelName',
      align: 'center' as const,
    },
    {
      title: t('providers.baseUrl'),
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      align: 'center' as const,
      render: (url: string) => (
        <Tooltip title={url}>
          <span>{url.length > 30 ? `${url.substring(0, 30)}...` : url}</span>
        </Tooltip>
      ),
    },
    {
      title: t('providers.maxTokens'),
      dataIndex: 'maxTokens',
      key: 'maxTokens',
      align: 'center' as const,
    },
    {
      title: t('providers.temperature'),
      dataIndex: 'temperature',
      key: 'temperature',
      align: 'center' as const,
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
        <Table
          columns={columns}
          dataSource={providers}
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
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
          }}
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

          {!editingProvider && (
            <Form.Item
              label={t('providers.type')}
              name="type"
              rules={[{ required: true, message: t('providers.typeRequired') }]}
            >
              <Select placeholder={t('providers.typePlaceholder')}>
                <Option value="claude code">Claude Code</Option>
                <Option value="codex">Codex</Option>
                <Option value="gemini">Google Gemini</Option>
                <Option value="qoder">Qoder</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label={t('providers.baseUrl')}
            name="baseUrl"
            rules={[{ required: true, message: t('providers.baseUrlRequired') }]}
          >
            <Input placeholder={t('providers.baseUrlPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('providers.model')} name="modelName">
            <Input placeholder={t('providers.modelPlaceholder')} />
          </Form.Item>

          {!editingProvider && (
            <Form.Item
              label="Token"
              name="token"
              rules={[{ required: true, message: t('providers.tokenPlaceholder') }]}
            >
              <Input.Password placeholder={t('providers.tokenPlaceholder')} />
            </Form.Item>
          )}

          <Form.Item label={t('providers.maxTokens')} name="maxTokens">
            <InputNumber
              min={1}
              max={100000}
              placeholder={t('providers.maxTokens')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label={t('providers.temperature')} name="temperature">
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              placeholder={t('providers.temperature')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label={t('providers.status')} name="isActive" valuePropName="checked">
            <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProviderManager;