import React, { useEffect, useState } from 'react';
import { Modal, Card, Row, Col, Tag, Button, Input, Form, Divider, Tabs, Space, Select } from 'antd';
import {
  FolderOutlined,
  DatabaseOutlined,
  CloudOutlined,
  ToolOutlined,
  GithubOutlined,
  GlobalOutlined,
  BranchesOutlined,
  RobotOutlined,
  BulbOutlined,
  EnvironmentOutlined,
  FileOutlined,
  HddOutlined,
  MinusCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMcpTemplates, createFromTemplate } from '../../store/slices/mcpSlice';
import { McpServer } from '../../types/mcp';
import './McpTemplateLibrary.css';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * MCP 模板库组件
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
const McpTemplateLibrary: React.FC<Props> = ({ visible, onClose }) => {
  const dispatch = useAppDispatch();
  const { templates, loading } = useAppSelector((state) => state.mcp);
  const [selectedTemplate, setSelectedTemplate] = useState<McpServer | null>(null);
  const [configFormVisible, setConfigFormVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false); // ✅ 添加提交状态
  const [form] = Form.useForm();

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
    if (visible) {
      dispatch(fetchMcpTemplates());
    }
  }, [visible, dispatch]);

  const categoryIcons: Record<string, React.ReactNode> = {
    filesystem: <FolderOutlined />,
    database: <DatabaseOutlined />,
    api: <CloudOutlined />,
    'dev-tools': <ToolOutlined />
  };

  const categoryNames: Record<string, string> = {
    filesystem: '文件系统',
    database: '数据库',
    api: 'API & 服务',
    'dev-tools': '开发工具'
  };

  // Icon 映射表：将字符串映射为 Ant Design 图标
  const iconMap: Record<string, React.ReactNode> = {
    folder: <FolderOutlined />,
    database: <DatabaseOutlined />,
    github: <GithubOutlined />,
    global: <GlobalOutlined />,
    cloud: <CloudOutlined />,
    branches: <BranchesOutlined />,
    robot: <RobotOutlined />,
    bulb: <BulbOutlined />,
    environment: <EnvironmentOutlined />,
    file: <FileOutlined />,
    hdd: <HddOutlined />
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.templateCategory || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, McpServer[]>);

  const handleUseTemplate = (template: McpServer) => {
    setSelectedTemplate(template);
    setConfigFormVisible(true);

    // 准备环境变量表单数据 - 只填充变量名，不填充变量值
    const envVars = template.env
      ? Object.keys(template.env).map((key) => ({
          key,
          value: '' // 不自动填充值，让用户手动输入
        }))
      : [];

    form.setFieldsValue({
      name: template.name,
      description: template.description,
      args: template.args,
      envVars,
      icon: template.icon // ✅ 从模板继承图标
    });
  };

  const handleSubmitConfig = async () => {
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

      // 构建自定义配置
      const customConfig = {
        name: values.name,
        description: values.description,
        args: values.args,
        env,
        icon: values.icon || selectedTemplate?.icon // ✅ 使用用户选择的图标，或者模板的图标
      };

      await dispatch(
        createFromTemplate({
          templateId: selectedTemplate!.id!,
          customConfig
        })
      ).unwrap();
      setConfigFormVisible(false);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('创建失败:', error);
    } finally {
      setSubmitting(false); // ✅ 提交结束
    }
  };

  const renderTemplateCard = (template: McpServer) => (
    <Card
      key={template.id}
      className="template-card"
      hoverable
    >
      <Card.Meta
        title={
          <div className="template-card-title">
            <span className="template-icon">
              {template.icon && iconMap[template.icon] ? iconMap[template.icon] : '📦'}
            </span>
            <span>{template.name}</span>
          </div>
        }
        description={
          <div>
            <p className="template-description">{template.description}</p>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{template.type}</Tag>
              <Tag>{template.command}</Tag>
            </div>
          </div>
        }
      />
      <Button
        type="primary"
        block
        style={{ marginTop: 16 }}
        onClick={() => handleUseTemplate(template)}
      >
        使用模板
      </Button>
    </Card>
  );

  const tabItems = Object.entries(groupedTemplates).map(([category, temps]) => ({
    key: category,
    label: (
      <span>
        {categoryIcons[category] || <ToolOutlined />}
        <span style={{ marginLeft: 8 }}>{categoryNames[category] || category}</span>
        <Tag style={{ marginLeft: 8 }}>{(temps as McpServer[]).length}</Tag>
      </span>
    ),
    children: (
      <Row gutter={[16, 16]}>
        {(temps as McpServer[]).map((template: McpServer) => (
          <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
            {renderTemplateCard(template)}
          </Col>
        ))}
      </Row>
    )
  }));

  return (
    <>
      <Modal
        title="MCP 模板库"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1200}
        className="mcp-template-library"
      >
        <p className="library-description">
          从内置模板快速创建 MCP 服务器，支持文件系统、数据库、API 等多种类型
        </p>

        <Tabs items={tabItems} />
      </Modal>

      <Modal
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 18,
            fontWeight: 600
          }}>
            <span style={{ fontSize: 24 }}>
              {selectedTemplate?.icon && iconMap[selectedTemplate.icon] ? iconMap[selectedTemplate.icon] : '📦'}
            </span>
            <span>使用模板: {selectedTemplate?.name}</span>
          </div>
        }
        open={configFormVisible}
        onOk={handleSubmitConfig}
        onCancel={() => {
          setConfigFormVisible(false);
          form.resetFields();
        }}
        confirmLoading={submitting}  // ✅ 添加加载状态
        okText="创建 MCP 服务器"
        cancelText="取消"
        width={800}
        styles={{
          body: { padding: '24px 24px 0' }
        }}
      >
        {/* 模板描述卡片 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          color: 'white'
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
            📝 模板描述
          </div>
          <div style={{ fontSize: 15, lineHeight: '1.6' }}>
            {selectedTemplate?.description || '该模板将帮助您快速配置 MCP 服务器'}
          </div>
        </div>

        <Form form={form} layout="vertical">
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
              tooltip="该名称将用于识别您的 MCP 服务器"
            >
              <Input
                placeholder="例如: my-mysql"
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
                placeholder="简要描述该 MCP 服务器的用途"
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
          </div>

          {/* 配置提示 */}
          {selectedTemplate?.configHints && Object.keys(selectedTemplate.configHints).length > 0 && (
            <div style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 20
            }}>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 12,
                color: '#fa8c16'
              }}>
                💡 配置提示
              </div>
              <div style={{ fontSize: 13, color: '#8c8c8c', lineHeight: '1.8' }}>
                {Object.entries(selectedTemplate.configHints).map(([key, hint]) => (
                  <div key={key} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: '#595959' }}>
                      {key.replace('env.', '')}:
                    </span>{' '}
                    {hint}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 命令参数 */}
          {selectedTemplate?.args && selectedTemplate.args.length > 0 && (
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
                {(fields: any[], { add, remove }: { add: () => void; remove: (index: number) => void }) => (
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
                                background: 'white',
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
          )}

          {/* 环境变量配置 */}
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
              <span>🔐 环境变量配置</span>
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
              {(fields: any[], { add, remove }: { add: () => void; remove: (index: number) => void }) => (
                <>
                  {fields.map(({ key, name, ...restField }: any) => {
                    const currentKey = form.getFieldValue(['envVars', name, 'key']);

                    // 判断是否为敏感信息（需要隐藏）
                    const isSensitive = currentKey && (
                      currentKey.toUpperCase().includes('KEY') ||
                      currentKey.toUpperCase().includes('TOKEN') ||
                      currentKey.toUpperCase().includes('PASSWORD') ||
                      currentKey.toUpperCase().includes('SECRET')
                    );

                    // 从模板的 env 中预填的变量不允许修改变量名
                    const isFromTemplate = selectedTemplate?.env && currentKey && Object.keys(selectedTemplate.env).includes(currentKey);

                    return (
                      <div
                        key={key}
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
                              {...restField}
                              name={[name, 'key']}
                              rules={[{ required: true, message: '请输入变量名' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input
                                placeholder="例如: API_KEY"
                                disabled={isFromTemplate}
                                style={{
                                  background: isFromTemplate ? '#f5f5f5' : 'white',
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
                              {...restField}
                              name={[name, 'value']}
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

                          {!isFromTemplate && (
                            <Button
                              type="text"
                              danger
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(name)}
                              style={{ marginTop: 24 }}
                            />
                          )}
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
        </Form>

        {/* 底部提示 */}
        <div style={{
          background: '#fafafa',
          borderRadius: 8,
          padding: '16px',
          marginTop: 20,
          marginBottom: 16,
          fontSize: 12,
          color: '#8c8c8c',
          lineHeight: '1.8'
        }}>
          <div style={{ fontWeight: 600, color: '#595959', marginBottom: 8 }}>
            📌 温馨提示
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>环境变量用于配置 API Key、数据库连接等敏感信息</li>
            <li>创建后可在 MCP Servers 页面随时编辑配置</li>
            <li>配置完成后需要在 Providers 页面关联到对应的 Provider</li>
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default McpTemplateLibrary;
