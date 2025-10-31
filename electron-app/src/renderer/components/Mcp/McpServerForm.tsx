import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Space, Button } from 'antd';
import {
  MinusCircleOutlined,
  PlusOutlined,
  FolderOutlined,
  DatabaseOutlined,
  GithubOutlined,
  GlobalOutlined,
  CloudOutlined,
  BranchesOutlined,
  RobotOutlined,
  BulbOutlined,
  EnvironmentOutlined,
  FileOutlined,
  HddOutlined
} from '@ant-design/icons';
import { useAppDispatch } from '../../store';
import { createMcpServer, updateMcpServer } from '../../store/slices/mcpSlice';
import { McpServer } from '../../types/mcp';

interface Props {
  visible: boolean;
  server: McpServer | null;
  onClose: () => void;
}

/**
 * MCP 服务器表单组件
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
const McpServerForm: React.FC<Props> = ({ visible, server, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = React.useState(false); // ✅ 添加提交状态

  // Icon 映射表
  const iconOptions = [
    { value: 'folder', label: '文件夹', icon: <FolderOutlined /> },
    { value: 'database', label: '数据库', icon: <DatabaseOutlined /> },
    { value: 'git', label: 'Git', icon: <GithubOutlined /> },
    { value: 'global', label: '全局', icon: <GlobalOutlined /> },
    { value: 'cloud', label: '云服务', icon: <CloudOutlined /> },
    { value: 'branches', label: '分支', icon: <BranchesOutlined /> },
    { value: 'robot', label: '机器人', icon: <RobotOutlined /> },
    { value: 'bulb', label: '灯泡', icon: <BulbOutlined /> },
    { value: 'environment', label: '环境', icon: <EnvironmentOutlined /> },
    { value: 'file', label: '文件', icon: <FileOutlined /> },
    { value: 'hdd', label: '硬盘', icon: <HddOutlined /> }
  ];

  useEffect(() => {
    if (visible && server) {
      // 转换 env 对象为数组格式
      const envVars = server.env
        ? Object.entries(server.env).map(([key, value]) => ({
            key,
            value: value || ''
          }))
        : [];

      form.setFieldsValue({
        ...server,
        envVars
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, server, form]);

  const handleSubmit = async () => {
    // ✅ 防止重复提交
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true); // ✅ 开始提交
      const values = await form.validateFields();

      // 转换 envVars 数组为对象格式
      const env: Record<string, string> = {};
      if (values.envVars && Array.isArray(values.envVars)) {
        values.envVars.forEach((item: { key: string; value: string }) => {
          if (item.key) {
            env[item.key] = item.value || '';
          }
        });
      }

      // 构建提交数据
      const submitData = {
        ...values,
        env,
        envVars: undefined // 移除临时字段
      };

      if (server) {
        await dispatch(updateMcpServer({ id: server.id!, server: submitData })).unwrap();
      } else {
        await dispatch(createMcpServer(submitData)).unwrap();
      }
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('表单提交失败:', error);
    } finally {
      setSubmitting(false); // ✅ 提交结束
    }
  };

  return (
    <Modal
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 18,
          fontWeight: 600
        }}>
          <span style={{ fontSize: 24 }}>📦</span>
          <span>{server ? '编辑 MCP 服务器' : '新建 MCP 服务器'}</span>
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={submitting}  // ✅ 添加加载状态
      width={800}
      destroyOnClose
      okText="保存"
      cancelText="取消"
      styles={{
        body: { padding: '24px 24px 0' }
      }}
    >
      {/* 说明卡片 */}
      {!server && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          color: 'white'
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
            📝 提示
          </div>
          <div style={{ fontSize: 15, lineHeight: '1.6' }}>
            创建自定义 MCP 服务器，配置命令、参数和环境变量
          </div>
        </div>
      )}

      <Form form={form} layout="vertical" preserve={false}>
        {/* 基本信息 */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: 8,
          padding: '20px',
          marginBottom: 20
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 16,
            color: '#1890ff'
          }}>
            🔧 基本信息
          </div>

          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 500 }}>服务器名称</span>}
            rules={[
              { required: true, message: '请输入服务器名称' },
              { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符' }
            ]}
            tooltip="唯一标识，例如: my-filesystem"
          >
            <Input
              placeholder="例如: my-filesystem"
              disabled={server?.isTemplate}
              size="large"
              prefix={<span style={{ color: '#999' }}>🏷️</span>}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 500 }}>描述（可选）</span>}
          >
            <Input.TextArea
              rows={2}
              placeholder="描述该 MCP 服务器的功能"
              style={{ fontSize: 14 }}
            />
          </Form.Item>

          <Form.Item
            name="icon"
            label={<span style={{ fontWeight: 500 }}>图标（可选）</span>}
            tooltip="选择一个图标来标识此 MCP 服务器"
          >
            <Select
              size="large"
              placeholder="选择图标"
              allowClear
            >
              {iconOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  <Space>
                    <span style={{ fontSize: 16 }}>{option.icon}</span>
                    <span>{option.label}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label={<span style={{ fontWeight: 500 }}>类型</span>}
            initialValue="stdio"
          >
            <Select size="large">
              <Select.Option value="stdio">stdio (标准输入输出)</Select.Option>
              <Select.Option value="sse">sse (Server-Sent Events)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="command"
            label={<span style={{ fontWeight: 500 }}>启动命令</span>}
            rules={[{ required: true, message: '请输入启动命令' }]}
            tooltip="例如: npx, node, python, uvx"
          >
            <Input
              placeholder="例如: npx"
              size="large"
              style={{ fontFamily: 'Monaco, monospace' }}
            />
          </Form.Item>
        </div>

        {/* 命令参数 */}
        <div style={{
          background: '#f6ffed',
          borderRadius: 8,
          padding: '20px',
          marginBottom: 20
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 16,
            color: '#52c41a',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>⚙️ 命令参数</span>
            <span style={{
              fontSize: 12,
              fontWeight: 400,
              color: '#ff4d4f',
              background: '#fff1f0',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #ffccc7'
            }}>
              必填
            </span>
          </div>

          <Form.List name="args">
            {(fields: any[], { add, remove }: any) => (
              <>
                {fields.map((field: any, index: number) => (
                  <div key={field.key} style={{
                    background: 'white',
                    padding: '12px 16px',
                    borderRadius: 6,
                    marginBottom: 12,
                    border: '1px solid #e8e8e8'
                  }}>
                    <Space style={{ display: 'flex' }} align="baseline">
                      <div style={{ fontSize: 12, color: '#8c8c8c', width: 60 }}>
                        参数 {index + 1}
                      </div>
                      <Form.Item
                        {...field}
                        style={{ marginBottom: 0, flex: 1 }}
                      >
                        <Input
                          placeholder={`参数 ${index + 1}`}
                          style={{
                            fontFamily: 'Monaco, monospace',
                            fontSize: 13,
                            minWidth: '400px'
                          }}
                        />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </Space>
                  </div>
                ))}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    block
                    style={{
                      height: 40,
                      borderStyle: 'dashed',
                      borderWidth: 2
                    }}
                  >
                    添加参数
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </div>

        {/* 环境变量 */}
        <div style={{
          background: '#f0f5ff',
          borderRadius: 8,
          padding: '20px',
          marginBottom: 20
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 16,
            color: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>🔐 环境变量</span>
            <span style={{
              fontSize: 12,
              fontWeight: 400,
              color: '#ff4d4f',
              background: '#fff1f0',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #ffccc7'
            }}>
              必填
            </span>
          </div>

          <Form.List name="envVars">
            {(fields: any[], { add, remove }: any) => (
              <>
                {fields.map((field: any) => {
                  const currentKey = form.getFieldValue(['envVars', field.name, 'key']);

                  // 判断是否为敏感信息（需要隐藏）
                  const isSensitive = currentKey && (
                    currentKey.toUpperCase().includes('KEY') ||
                    currentKey.toUpperCase().includes('TOKEN') ||
                    currentKey.toUpperCase().includes('PASSWORD') ||
                    currentKey.toUpperCase().includes('SECRET')
                  );

                  return (
                    <div
                      key={field.key}
                      style={{
                        background: 'white',
                        padding: '12px 16px',
                        borderRadius: 6,
                        marginBottom: 12,
                        border: '1px solid #e8e8e8'
                      }}
                    >
                      <Space style={{ display: 'flex', alignItems: 'flex-start' }} size={12}>
                        <div style={{ flex: '0 0 180px' }}>
                          <div style={{
                            fontSize: 12,
                            color: '#8c8c8c',
                            marginBottom: 6,
                            fontWeight: 500
                          }}>
                            变量名
                          </div>
                          <Form.Item
                            {...field}
                            name={[field.name, 'key']}
                            rules={[{ required: true, message: '请输入变量名' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              placeholder="例如: API_KEY"
                              style={{
                                fontFamily: 'Monaco, monospace',
                                fontSize: 13
                              }}
                            />
                          </Form.Item>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: 12,
                            color: '#8c8c8c',
                            marginBottom: 6,
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}>
                            <span>变量值</span>
                            {isSensitive && (
                              <span style={{
                                fontSize: 11,
                                background: '#fff1f0',
                                color: '#ff4d4f',
                                padding: '2px 6px',
                                borderRadius: 3
                              }}>
                                敏感
                              </span>
                            )}
                          </div>
                          <Form.Item
                            {...field}
                            name={[field.name, 'value']}
                            rules={[{ required: true, message: '请输入变量值' }]}
                            style={{ marginBottom: 0 }}
                          >
                            {isSensitive ? (
                              <Input.Password
                                placeholder="请输入变量值"
                                style={{ fontFamily: 'Monaco, monospace', fontSize: 13 }}
                              />
                            ) : (
                              <Input
                                placeholder="请输入变量值"
                                style={{ fontFamily: 'Monaco, monospace', fontSize: 13 }}
                              />
                            )}
                          </Form.Item>
                        </div>

                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                          style={{ marginTop: 24 }}
                        />
                      </Space>
                    </div>
                  );
                })}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                    style={{
                      height: 40,
                      borderStyle: 'dashed',
                      borderWidth: 2
                    }}
                  >
                    添加环境变量
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </div>

        {/* 其他设置 */}
        <div style={{
          background: '#fafafa',
          borderRadius: 8,
          padding: '20px',
          marginBottom: 20
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 16,
            color: '#8c8c8c'
          }}>
            ⚡ 其他设置
          </div>

          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </div>

        {/* 底部提示 */}
        <div style={{
          background: '#fafafa',
          borderRadius: 8,
          padding: '16px',
          marginBottom: 16,
          fontSize: 12,
          color: '#8c8c8c',
          lineHeight: '1.8'
        }}>
          <div style={{ fontWeight: 600, color: '#595959', marginBottom: 8 }}>
            📌 温馨提示
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>服务器名称在您的账户下必须唯一</li>
            <li>环境变量用于配置 API Key、数据库连接等敏感信息</li>
            <li>创建后可在 Providers 页面关联到对应的 Provider</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};

export default McpServerForm;
