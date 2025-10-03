import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  Tabs,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  StopOutlined,
  DesktopOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProviders } from '../../store/slices/providerSlice';
import {
  setSessions,
  addSession,
  updateSession,
  setLoading,
  setError,
  openTerminal,
} from '../../store/slices/sessionSlice';
import { sessionAPI } from '../../services/api';
import { Session, StartSessionRequest, UpdateSessionStatusRequest } from '../../types';
import type { RootState } from '../../store';

const { Option } = Select;

const SessionManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const { sessions, loading, openTerminalSessions } = useAppSelector((state: RootState) => state.session);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'terminated'>('all');
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchProviders());
    loadSessions();
  }, [dispatch]);

  const loadSessions = async () => {
    try {
      dispatch(setLoading(true));
      const response = await sessionAPI.getAllSessions();
      dispatch(setSessions(response.data || []));
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to load sessions'));
      message.error('加载会话失败');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleStartSession = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const request: StartSessionRequest = {
        providerId: values.providerId,
        workingDirectory: values.workingDirectory,
        command: values.command || 'claude',
      };

      const response = await sessionAPI.startSession(request);
      if (response.data) {
        dispatch(addSession(response.data));
        // 自动打开终端并切换到该标签
        dispatch(openTerminal(response.data.id));
      }
      message.success('会话启动成功');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(`启动会话失败: ${error}`);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleUpdateSessionStatus = async (sessionId: string, status: 'active' | 'inactive') => {
    try {
      const request: UpdateSessionStatusRequest = { status };
      const response = await sessionAPI.updateSessionStatus(sessionId, request);
      if (response.data) {
        dispatch(updateSession(response.data));
      }
      message.success(`会话状态更新为: ${status === 'active' ? '活跃' : '非活跃'}`);
    } catch (error) {
      message.error(`更新会话状态失败: ${error}`);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await sessionAPI.terminateSession(sessionId);
      // 重新加载会话列表以获取更新后的状态
      await loadSessions();
      message.success('会话终止成功');
    } catch (error) {
      message.error(`终止会话失败: ${error}`);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await sessionAPI.deleteSession(sessionId);
      // 重新加载会话列表
      await loadSessions();
      message.success('会话记录已清除');
    } catch (error) {
      message.error(`清除会话失败: ${error}`);
    }
  };

  const handleOpenTerminal = (sessionId: string) => {
    dispatch(openTerminal(sessionId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'terminated':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '非活跃';
      case 'terminated':
        return '已终止';
      default:
        return '未知';
    }
  };

  const columns = [
    {
      title: '会话ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <Space>
          <DesktopOutlined />
          <code>{text.substring(0, 8)}...</code>
        </Space>
      ),
    },
    {
      title: 'Provider',
      dataIndex: 'providerName',
      key: 'providerName',
      render: (text: string, record: Session) => text || record.providerId,
    },
    {
      title: '进程ID',
      dataIndex: 'pid',
      key: 'pid',
      render: (pid: number) => pid ? <code>{pid}</code> : '-',
    },
    {
      title: '工作目录',
      dataIndex: 'workingDirectory',
      key: 'workingDirectory',
      render: (text: string) => (
        <span title={text}>
          {text.length > 30 ? `${text.substring(0, 30)}...` : text}
        </span>
      ),
    },
    {
      title: '命令',
      dataIndex: 'command',
      key: 'command',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '最后活动',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Session) => (
        <Space size="middle">
          {(record.status === 'active' || record.status === 'inactive') && (
            <>
              <Button
                type="link"
                icon={<CodeOutlined />}
                onClick={() => handleOpenTerminal(record.id)}
                disabled={openTerminalSessions.includes(record.id)}
              >
                {openTerminalSessions.includes(record.id) ? '已打开' : '打开终端'}
              </Button>
              <Popconfirm
                title="确定要终止这个会话吗？"
                description="终止后将无法恢复，进程将被彻底结束"
                onConfirm={() => handleTerminateSession(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<StopOutlined />}>
                  终止
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'terminated' && (
            <Popconfirm
              title="确定要清除这个会话记录吗？"
              description="清除后将从数据库中永久删除，无法恢复"
              onConfirm={() => handleDeleteSession(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                清除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const activeSessions = sessions.filter(session => session.status === 'active');
  const terminatedSessions = sessions.filter(session => session.status === 'terminated');

  // 根据筛选条件获取显示的会话列表
  const getFilteredSessions = () => {
    switch (sessionFilter) {
      case 'active':
        return activeSessions;
      case 'terminated':
        return terminatedSessions;
      case 'all':
      default:
        return sessions;
    }
  };

  const filteredSessions = getFilteredSessions();

  return (
    <div>
      {/* 紧凑型统计信息 */}
      <div style={{
        marginBottom: 16,
        padding: '12px 16px',
        background: '#f5f5f5',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        <Space size={24}>
          <Space size={8}>
            <DesktopOutlined style={{ fontSize: 16, color: '#1890ff' }} />
            <span style={{ color: '#666' }}>总会话数:</span>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{sessions.length}</span>
          </Space>
          <Space size={8}>
            <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />
            <span style={{ color: '#666' }}>活跃:</span>
            <span style={{ fontWeight: 600, fontSize: 16, color: '#52c41a' }}>{activeSessions.length}</span>
          </Space>
          <Space size={8}>
            <CloseCircleOutlined style={{ fontSize: 16, color: '#f5222d' }} />
            <span style={{ color: '#666' }}>已终止:</span>
            <span style={{ fontWeight: 600, fontSize: 16, color: '#f5222d' }}>{terminatedSessions.length}</span>
          </Space>
        </Space>
      </div>

      <Collapse
        defaultActiveKey={['sessions']}
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'sessions',
            label: (
              <Space>
                <DesktopOutlined />
                <span>会话列表</span>
              </Space>
            ),
            extra: (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleStartSession();
                }}
              >
                启动新会话
              </Button>
            ),
            children: (
              <>
                <Tabs
                  activeKey={sessionFilter}
                  onChange={(key: string) => setSessionFilter(key as 'all' | 'active' | 'terminated')}
                  items={[
                    {
                      key: 'all',
                      label: (
                        <span>
                          总会话 <Tag color="blue">{sessions.length}</Tag>
                        </span>
                      ),
                    },
                    {
                      key: 'active',
                      label: (
                        <span>
                          活跃会话 <Tag color="green">{activeSessions.length}</Tag>
                        </span>
                      ),
                    },
                    {
                      key: 'terminated',
                      label: (
                        <span>
                          已终止 <Tag color="red">{terminatedSessions.length}</Tag>
                        </span>
                      ),
                    },
                  ]}
                />
                <Table
                  columns={columns}
                  dataSource={filteredSessions}
                  rowKey="id"
                  loading={loading}
                  scroll={{ x: 'max-content' }}
                  pagination={{
                    pageSize: 10,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    showTotal: (total: number) => `共 ${total} 条记录`,
                  }}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title="启动新会话"
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
            command: 'claude',
            workingDirectory: 'D:\\code\\program\\LLMctl',
          }}
        >
          <Form.Item
            label="Provider"
            name="providerId"
            rules={[{ required: true, message: '请选择Provider' }]}
          >
            <Select placeholder="请选择Provider">
              {providers
                .filter(provider => provider.isActive)
                .map((provider) => (
                  <Option key={provider.id} value={provider.id}>
                    {provider.name} ({provider.type})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="工作目录"
            name="workingDirectory"
            rules={[{ required: true, message: '请输入工作目录' }]}
          >
            <Input placeholder="请输入工作目录路径" />
          </Form.Item>

          <Form.Item
            label="命令"
            name="command"
            tooltip="命令将在内置终端中执行，环境变量和工作目录会自动配置"
            extra="命令将在内置终端中运行，支持交互式输入和实时输出"
          >
            <Input placeholder="请输入启动命令" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SessionManager;