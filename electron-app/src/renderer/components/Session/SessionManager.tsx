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
  Tabs,
  App as AntApp,
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
  removeSession,
  updateSession,
  setLoading,
  setError,
  openTerminal,
  destroyTerminal,
} from '../../store/slices/sessionSlice';
import { sessionAPI } from '../../services/api';
import { Session, StartSessionRequest, UpdateSessionStatusRequest } from '../../types';
import type { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const SessionManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { modal } = AntApp.useApp();
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const { sessions, loading, openTerminalSessions } = useAppSelector((state: RootState) => state.session);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [submitting, setSubmitting] = useState(false); // 防止重复提交
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
    // 从 localStorage 读取上次选择的 Provider ID 和工作目录
    const lastSelectedProviderId = localStorage.getItem('lastSelectedSessionProviderId');
    const lastWorkingDirectory = localStorage.getItem('lastSessionWorkingDirectory');

    // 重置表单
    form.resetFields();

    // 设置默认的 Provider
    if (lastSelectedProviderId && providers.some(p => p.id === lastSelectedProviderId && p.isActive)) {
      form.setFieldsValue({ providerId: lastSelectedProviderId });
    } else if (providers.length > 0) {
      // 否则选择第一个激活的Provider
      const firstActiveProvider = providers.find(p => p.isActive);
      if (firstActiveProvider) {
        form.setFieldsValue({ providerId: firstActiveProvider.id });
      }
    }

    // 设置默认的工作目录
    if (lastWorkingDirectory) {
      form.setFieldsValue({ workingDirectory: lastWorkingDirectory });
    }

    setModalVisible(true);
  };

  const handleSelectDirectory = async () => {
    try {
      const result = await window.electronAPI.selectDirectory();
      if (!result.canceled && result.path) {
        form.setFieldsValue({ workingDirectory: result.path });
      }
    } catch (error) {
      message.error(`选择文件夹失败: ${error}`);
    }
  };

  const handleModalOk = async () => {
    // 防止重复提交
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const request: StartSessionRequest = {
        providerId: values.providerId,
        workingDirectory: values.workingDirectory,
        command: values.command || 'claude',
      };

      // 保存当前选择的 Provider ID 和工作目录到 localStorage
      localStorage.setItem('lastSelectedSessionProviderId', values.providerId);
      localStorage.setItem('lastSessionWorkingDirectory', values.workingDirectory);

      const response = await sessionAPI.startSession(request);
      if (response.data) {
        dispatch(addSession(response.data));
        // 自动打开终端并切换到该标签
        dispatch(openTerminal(response.data.id));
        // 跳转到 Terminals 页面
        navigate('/terminals');
      }
      message.success('会话启动成功');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(`启动会话失败: ${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleTerminateSession = async (sessionId: string) => {
    modal.confirm({
      title: '确定要终止这个会话吗？',
      content: '终止后当前对话将被清除，下次打开将是全新会话',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // 1. 终止Electron端的终端进程
          try {
            await window.electronAPI.terminalKill(sessionId);
          } catch (error) {
            console.error('终止终端进程失败:', error);
          }

          // 2. 销毁前端终端实例
          dispatch(destroyTerminal(sessionId));

          // 3. 终止后端会话（设置为 inactive 状态）
          await sessionAPI.terminateSession(sessionId);

          // 4. 重新加载会话列表以获取更新后的状态
          await loadSessions();
          message.success('会话已终止，下次打开将是全新会话');
        } catch (error) {
          message.error(`终止会话失败: ${error}`);
        }
      },
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    modal.confirm({
      title: '确定要清除这个会话记录吗？',
      content: '清除后将永久删除，无法恢复',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // 1. 删除后端会话记录
          await sessionAPI.deleteSession(sessionId);

          // 2. 尝试终止终端进程（如果还在运行）
          try {
            await window.electronAPI.terminalKill(sessionId);
          } catch (error) {
            console.error('终止终端进程失败（可能已终止）:', error);
          }

          // 3. 销毁前端终端实例
          dispatch(destroyTerminal(sessionId));

          // 4. 重新加载会话列表
          await loadSessions();
          message.success('会话记录已清除');
        } catch (error) {
          message.error(`清除会话失败: ${error}`);
        }
      },
    });
  };

  const handleOpenTerminal = async (sessionId: string) => {
    // 检查会话状态，如果是 inactive，先重新激活
    const session = sessions.find(s => s.id === sessionId);
    if (session?.status === 'inactive') {
      try {
        // 1. 先销毁旧的终端实例（如果存在）
        dispatch(destroyTerminal(sessionId));

        // 2. 尝试终止终端进程（如果还在运行）
        try {
          await window.electronAPI.terminalKill(sessionId);
        } catch (error) {
          console.log('终端进程已终止或不存在:', error);
        }

        // 3. ✅ 删除旧会话记录（避免 terminalManager 误判为 resume）
        await sessionAPI.deleteSession(sessionId);
        dispatch(removeSession(sessionId));

        // 4. ✅ 创建全新的会话（使用相同的配置）
        const newSessionRequest: StartSessionRequest = {
          providerId: session.providerId,
          workingDirectory: session.workingDirectory,
          command: session.command,
        };

        const response = await sessionAPI.startSession(newSessionRequest);
        if (response.data) {
          dispatch(addSession(response.data));
          // 打开新会话的终端
          dispatch(openTerminal(response.data.id));
          // 跳转到 Terminals 页面
          navigate('/terminals');
          message.success('会话已重新启动');
        } else {
          message.error('创建新会话失败');
        }
      } catch (error) {
        message.error(`重新激活会话失败: ${error}`);
      }
      return;
    }

    // 如果会话是 active 状态，直接打开终端
    dispatch(openTerminal(sessionId));

    // 跳转到 Terminals 页面
    navigate('/terminals');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'terminated': // 废弃状态，保留仅为兼容历史数据
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
      case 'terminated': // 废弃状态，保留仅为兼容历史数据
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
      align: 'center' as const,
      render: (text: string) => (
        <Space>
          <DesktopOutlined />
          <code style={{ background: 'transparent', color: '#1890ff', padding: 0 }}>{text.substring(0, 8)}...</code>
        </Space>
      ),
    },
    {
      title: 'Provider',
      dataIndex: 'providerName',
      key: 'providerName',
      align: 'center' as const,
      render: (text: string, record: Session) => text || record.providerId,
    },
    {
      title: '工作目录',
      dataIndex: 'workingDirectory',
      key: 'workingDirectory',
      align: 'center' as const,
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
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
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
      align: 'center' as const,
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '最后活动',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      align: 'center' as const,
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: Session) => (
        <Space size="middle">
          {record.status === 'active' && (
            <>
              <Button
                type="link"
                icon={<CodeOutlined />}
                onClick={() => handleOpenTerminal(record.id)}
                disabled={openTerminalSessions.includes(record.id)}
              >
                {openTerminalSessions.includes(record.id) ? '已打开' : '打开终端'}
              </Button>
              <Button
                type="link"
                danger
                icon={<StopOutlined />}
                onClick={() => handleTerminateSession(record.id)}
              >
                终止
              </Button>
            </>
          )}
          {record.status === 'inactive' && (
            <>
              <Button
                type="link"
                icon={<CodeOutlined />}
                onClick={() => handleOpenTerminal(record.id)}
              >
                重新启动
              </Button>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteSession(record.id)}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const activeSessions = sessions.filter(session => session.status === 'active');
  const inactiveSessions = sessions.filter(session => session.status === 'inactive');

  // 根据筛选条件获取显示的会话列表
  const getFilteredSessions = () => {
    switch (sessionFilter) {
      case 'active':
        return activeSessions;
      case 'inactive':
        return inactiveSessions;
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
        padding: '20px 24px',
        background: '#f5f5f5',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        minHeight: '80px',
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
            <CloseCircleOutlined style={{ fontSize: 16, color: '#fa8c16' }} />
            <span style={{ color: '#666' }}>非活跃:</span>
            <span style={{ fontWeight: 600, fontSize: 16, color: '#fa8c16' }}>{inactiveSessions.length}</span>
          </Space>
        </Space>
      </div>

      <Card
        title={
          <Space>
            <DesktopOutlined />
            <span>Sessions</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleStartSession}
          >
            启动新会话
          </Button>
        }
      >
        <Tabs
          activeKey={sessionFilter}
          onChange={(key: string) => setSessionFilter(key as 'all' | 'active' | 'inactive')}
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
              key: 'inactive',
              label: (
                <span>
                  非活跃 <Tag color="orange">{inactiveSessions.length}</Tag>
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
      </Card>

      <Modal
        title="启动新会话"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={submitting}
        width={500}
        destroyOnHidden
        afterClose={() => form.resetFields()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            command: 'claude',
          }}
          preserve={false}
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
            rules={[{ required: true, message: '请输入或选择工作目录' }]}
          >
            <Input
              placeholder="请输入工作目录路径或点击浏览按钮选择"
              addonAfter={
                <Button
                  type="link"
                  onClick={handleSelectDirectory}
                  style={{ padding: 0, height: 'auto' }}
                >
                  浏览
                </Button>
              }
            />
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