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
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  StopOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DesktopOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProviders } from '../../store/slices/providerSlice';
import { setSessions, addSession, updateSession, removeSession, setLoading, setError } from '../../store/slices/sessionSlice';
import { sessionAPI } from '../../services/api';
import { Session, StartSessionRequest, UpdateSessionStatusRequest } from '../../types';
import type { RootState } from '../../store';
import TerminalComponent from '../Terminal/TerminalComponent';

const { Option } = Select;

const SessionManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { providers } = useAppSelector((state: RootState) => state.provider);
  const { sessions, loading } = useAppSelector((state: RootState) => state.session);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [openTerminalSessions, setOpenTerminalSessions] = useState<Set<string>>(new Set());

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
        // 自动打开终端
        setOpenTerminalSessions(prev => new Set(prev).add(response.data!.id));
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
      dispatch(removeSession(sessionId));
      // 如果关闭的是打开的终端，则关闭终端显示
      setOpenTerminalSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
      message.success('会话终止成功');
    } catch (error) {
      message.error(`终止会话失败: ${error}`);
    }
  };

  const handleOpenTerminal = (sessionId: string) => {
    setOpenTerminalSessions(prev => new Set(prev).add(sessionId));
  };

  const handleCloseTerminal = (sessionId: string) => {
    setOpenTerminalSessions(prev => {
      const newSet = new Set(prev);
      newSet.delete(sessionId);
      return newSet;
    });
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
            <Button
              type="link"
              icon={<CodeOutlined />}
              onClick={() => handleOpenTerminal(record.id)}
              disabled={openTerminalSessions.has(record.id)}
            >
              {openTerminalSessions.has(record.id) ? '已打开' : '打开终端'}
            </Button>
          )}
          {record.status === 'active' && (
            <Button
              type="link"
              icon={<PauseCircleOutlined />}
              onClick={() => handleUpdateSessionStatus(record.id, 'inactive')}
            >
              暂停
            </Button>
          )}
          {record.status === 'inactive' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateSessionStatus(record.id, 'active')}
            >
              恢复
            </Button>
          )}
          <Popconfirm
            title="确定要终止这个会话吗？"
            description="终止后将无法恢复"
            onConfirm={() => handleTerminateSession(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<StopOutlined />}>
              终止
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeSessions = sessions.filter(session => session.status === 'active');
  const inactiveSessions = sessions.filter(session => session.status === 'inactive');
  const terminatedSessions = sessions.filter(session => session.status === 'terminated');

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总会话数" value={sessions.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="活跃会话" value={activeSessions.length} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="非活跃会话" value={inactiveSessions.length} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已终止会话" value={terminatedSessions.length} />
          </Card>
        </Col>
      </Row>

      <Card
        title="会话管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleStartSession}>
            启动新会话
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={sessions}
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
        title="启动新会话"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={500}
        destroyOnClose
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

      {/* 内置终端 - 支持多个终端 */}
      {Array.from(openTerminalSessions).map(sessionId => {
        const session = sessions.find(s => s.id === sessionId);
        return session ? (
          <TerminalComponent
            key={sessionId}
            sessionId={sessionId}
            command={session.command}
            cwd={session.workingDirectory}
            onClose={() => handleCloseTerminal(sessionId)}
          />
        ) : null;
      })}
    </div>
  );
};

export default SessionManager;