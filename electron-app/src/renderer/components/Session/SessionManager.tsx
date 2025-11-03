import React, { useEffect, useState, useMemo } from 'react';
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
  Row,
  Col,
  Tooltip,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  StopOutlined,
  DesktopOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ClearOutlined,
  CopyOutlined,
  FolderOpenOutlined,
  MoreOutlined,
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
import { writeMcpConfig } from '../../utils/mcpConfigHelper';

const { Option } = Select;
const { Search } = Input;

// Provider 类型到 CLI 命令的映射
const PROVIDER_COMMAND_MAP: Record<string, string> = {
  'Claude Code': 'claude',
  'Codex': 'codex',
  'Gemini': 'gemini',
  'Qoder': 'qoder',
};

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

  // 可用的命令选项（根据选中的Provider动态更新）
  const [availableCommands, setAvailableCommands] = useState<string[]>([]);

  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [providerFilter, setProviderFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('all');

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

  /**
   * 从工作目录路径中提取项目名（最后一个文件夹名）
   */
  const extractProjectName = (workingDirectory: string): string => {
    const path = workingDirectory.replace(/\\/g, '/'); // 统一使用正斜杠
    const segments = path.split('/').filter(seg => seg.length > 0);
    return segments[segments.length - 1] || 'Unknown';
  };

  /**
   * 计算同一项目的会话序号
   * 根据工作目录和开始时间排序，按时间顺序编号
   */
  const getSessionNumber = (session: Session): number => {
    const projectSessions = sessions
      .filter(s => s.workingDirectory === session.workingDirectory)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const index = projectSessions.findIndex(s => s.id === session.id);
    return index + 1;
  };

  /**
   * 生成会话显示名称：Provider名 - 项目名 (#序号)
   * 如果同项目只有一个会话，不显示序号
   */
  const getSessionDisplayName = (session: Session): string => {
    const projectName = extractProjectName(session.workingDirectory);
    const providerName = session.providerName || 'Unknown';

    // 统计同项目会话数量
    const projectSessionCount = sessions.filter(
      s => s.workingDirectory === session.workingDirectory
    ).length;

    // 如果同项目只有一个会话，不显示序号
    if (projectSessionCount === 1) {
      return `${providerName} - ${projectName}`;
    }

    // 多个会话时显示序号
    const sessionNumber = getSessionNumber(session);
    return `${providerName} - ${projectName} #${sessionNumber}`;
  };

  /**
   * 计算相对时间显示（如"2小时前"、"昨天"）
   */
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  };

  /**
   * 计算会话持续时间
   */
  const getSessionDuration = (session: Session): string => {
    const startTime = new Date(session.startTime);
    const endTime = session.endTime ? new Date(session.endTime) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}天${diffHours % 24}小时`;
    if (diffHours > 0) return `${diffHours}小时${diffMins % 60}分钟`;
    if (diffMins > 0) return `${diffMins}分钟`;
    return '不到1分钟';
  };

  /**
   * 格式化工作目录显示：项目名 (路径层级)
   */
  const formatWorkingDirectory = (path: string): { display: string; full: string } => {
    const projectName = extractProjectName(path);
    const normalizedPath = path.replace(/\\/g, '/');
    const segments = normalizedPath.split('/').filter(seg => seg.length > 0);

    // 显示最后3层路径
    let pathHint = '';
    if (segments.length > 3) {
      pathHint = `.../${segments.slice(-3, -1).join('/')}`;
    } else if (segments.length > 1) {
      pathHint = segments.slice(0, -1).join('/');
    }

    return {
      display: pathHint ? `${projectName} (${pathHint})` : projectName,
      full: path
    };
  };

  const handleStartSession = () => {
    // 从 localStorage 读取上次选择的 Provider ID 和工作目录
    const lastSelectedProviderId = localStorage.getItem('lastSelectedSessionProviderId');
    const lastWorkingDirectory = localStorage.getItem('lastSessionWorkingDirectory');

    // 重置表单
    form.resetFields();

    let selectedProviderId: string | null = null;

    // 设置默认的 Provider 和命令
    if (lastSelectedProviderId && providers.some(p => p.id === lastSelectedProviderId && p.isActive)) {
      selectedProviderId = lastSelectedProviderId;
      form.setFieldsValue({ providerId: lastSelectedProviderId });
    } else if (providers.length > 0) {
      // 否则选择第一个激活的Provider
      const firstActiveProvider = providers.find(p => p.isActive);
      if (firstActiveProvider) {
        selectedProviderId = firstActiveProvider.id;
        form.setFieldsValue({ providerId: firstActiveProvider.id });
      }
    }

    // 如果选择了Provider，主动触发handleProviderChange来初始化可用命令
    if (selectedProviderId) {
      handleProviderChange(selectedProviderId);
    }

    // 设置默认的工作目录
    if (lastWorkingDirectory) {
      form.setFieldsValue({ workingDirectory: lastWorkingDirectory });
    }

    setModalVisible(true);
  };

  /**
   * Provider 选择变化时，自动填充对应的 CLI 命令并更新可用命令列表
   */
  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      // 根据Provider的types筛选可用命令
      const commands = provider.types.map(type => {
        switch (type.toLowerCase()) {
          case 'claude code':
            return 'claude';
          case 'codex':
            return 'codex';
          case 'gemini':
            return 'gemini';
          case 'qoder':
            return 'qoder';
          default:
            return '';
        }
      }).filter(cmd => cmd !== '');

      setAvailableCommands(commands);

      // 自动选择第一个可用命令
      if (commands.length > 0) {
        form.setFieldsValue({ command: commands[0] });
      } else {
        form.setFieldsValue({ command: '' });
      }
    }
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

      // 根据命令推断类型
      const commandToTypeMap: Record<string, 'claude code' | 'codex' | 'gemini' | 'qoder'> = {
        'claude': 'claude code',
        'codex': 'codex',
        'gemini': 'gemini',
        'qoder': 'qoder',
      };

      const request: StartSessionRequest = {
        providerId: values.providerId,
        workingDirectory: values.workingDirectory,
        command: values.command || '',
        type: commandToTypeMap[values.command || ''],
      };

      // 保存当前选择的 Provider ID 和工作目录到 localStorage
      localStorage.setItem('lastSelectedSessionProviderId', values.providerId);
      localStorage.setItem('lastSessionWorkingDirectory', values.workingDirectory);

      const response = await sessionAPI.startSession(request);
      if (response.data) {
        dispatch(addSession(response.data));

        // ✅ 写入 MCP 配置文件到本地（跨平台兼容）
        await writeMcpConfig(
          response.data.id,
          values.workingDirectory
        );

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
      title: '确定要删除这个会话记录吗？',
      content: '删除后将永久删除，无法恢复',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // 0. ✅ 归档 Codex 配置（如果适用）
          const session = sessions.find(s => s.id === sessionId);
          if (session?.type === 'codex' && session.workingDirectory) {
            try {
              const codexDir = `${session.workingDirectory}/.codex-sessions/${sessionId}`;
              const archivedDir = `${session.workingDirectory}/.codex-sessions/archived/${sessionId}`;

              console.log('[SessionManager] 检查 Codex 配置目录:', codexDir);

              // 尝试移动到归档目录（如果目录存在）
              const moveResult = await window.electronAPI.moveDirectory(codexDir, archivedDir);
              if (moveResult.success) {
                console.log('[SessionManager] ✅ Codex 配置已归档:', archivedDir);
                message.info('Codex 对话历史已归档，可手动恢复');
              } else {
                console.log('[SessionManager] ℹ️ Codex 配置目录不存在或已删除');
              }
            } catch (error) {
              console.warn('[SessionManager] 归档 Codex 配置失败（忽略）:', error);
            }
          }

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

        // 2.5. ✅ 归档 Codex 配置（如果适用）
        if (session.type === 'codex' && session.workingDirectory) {
          try {
            const codexDir = `${session.workingDirectory}/.codex-sessions/${sessionId}`;
            const archivedDir = `${session.workingDirectory}/.codex-sessions/archived/${sessionId}`;

            console.log('[SessionManager] 检查 Codex 配置目录:', codexDir);

            // 尝试移动到归档目录（如果目录存在）
            const moveResult = await window.electronAPI.moveDirectory(codexDir, archivedDir);
            if (moveResult.success) {
              console.log('[SessionManager] ✅ Codex 配置已归档:', archivedDir);
            } else {
              console.log('[SessionManager] ℹ️ Codex 配置目录不存在或已删除');
            }
          } catch (error) {
            console.warn('[SessionManager] 归档 Codex 配置失败（忽略）:', error);
          }
        }

        // 3. ✅ 删除旧会话记录（避免 terminalManager 误判为 resume）
        await sessionAPI.deleteSession(sessionId);
        dispatch(removeSession(sessionId));

        // 4. ✅ 创建全新的会话（使用相同的配置）
        const newSessionRequest: StartSessionRequest = {
          providerId: session.providerId,
          workingDirectory: session.workingDirectory,
          command: session.command,
          type: session.type,
        };

        const response = await sessionAPI.startSession(newSessionRequest);
        if (response.data) {
          dispatch(addSession(response.data));

          // ✅ 写入 MCP 配置文件到本地（跨平台兼容）
          await writeMcpConfig(
            response.data.id,
            session.workingDirectory
          );

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

  /**
   * 复制文本到剪贴板
   */
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(successMessage);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  /**
   * 生成右键菜单项
   */
  const getContextMenu = (record: Session) => ({
    items: [
      {
        key: 'open',
        label: record.status === 'active' ? '打开终端' : '重新启动',
        icon: <CodeOutlined />,
        onClick: () => handleOpenTerminal(record.id),
      },
      { type: 'divider' },
      {
        key: 'copyId',
        label: '复制会话ID',
        icon: <CopyOutlined />,
        onClick: () => copyToClipboard(record.id, '已复制会话ID'),
      },
      {
        key: 'copyPath',
        label: '复制工作目录',
        icon: <CopyOutlined />,
        onClick: () => copyToClipboard(record.workingDirectory, '已复制工作目录'),
      },
      {
        key: 'openFolder',
        label: '在文件管理器中打开',
        icon: <FolderOpenOutlined />,
        onClick: () => {
          window.electronAPI.openPath(record.workingDirectory);
        },
      },
      { type: 'divider' },
      record.status === 'active' ? {
        key: 'terminate',
        label: '终止会话',
        icon: <StopOutlined />,
        danger: true,
        onClick: () => handleTerminateSession(record.id),
      } : {
        key: 'delete',
        label: '删除会话',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteSession(record.id),
      },
    ],
  });

  const columns = [
    {
      title: '会话名称',
      dataIndex: 'id',
      key: 'id',
      align: 'center' as const,
      width: 280,
      render: (text: string, record: Session) => {
        const displayName = getSessionDisplayName(record);
        return (
          <Tooltip title={`完整ID: ${text}\n命令: ${record.command || '-'}`} placement="topLeft">
            <div
              onDoubleClick={() => handleOpenTerminal(record.id)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <Space>
                <DesktopOutlined />
                <span style={{ color: '#1890ff', fontWeight: 500 }}>{displayName}</span>
              </Space>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '工作目录',
      dataIndex: 'workingDirectory',
      key: 'workingDirectory',
      align: 'center' as const,
      width: 250,
      render: (text: string) => {
        const formatted = formatWorkingDirectory(text);
        return (
          <Tooltip title={formatted.full} placement="topLeft">
            <span style={{ color: '#666' }}>{formatted.display}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      align: 'center' as const,
      width: 120,
      render: (type: string) => {
        if (!type) return <Tag color="default">未知</Tag>;

        const typeColorMap: Record<string, string> = {
          'claude code': 'blue',
          'codex': 'purple',
          'gemini': 'cyan',
          'qoder': 'orange',
        };

        return (
          <Tag color={typeColorMap[type] || 'default'}>
            {type.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      width: 90,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '时间信息',
      dataIndex: 'startTime',
      key: 'timeInfo',
      align: 'center' as const,
      width: 200,
      render: (text: string, record: Session) => {
        const relativeTime = getRelativeTime(record.lastActivity || text);
        const duration = getSessionDuration(record);
        const fullStartTime = new Date(text).toLocaleString();
        const fullLastActivity = record.lastActivity ? new Date(record.lastActivity).toLocaleString() : '-';

        return (
          <Tooltip title={
            <>
              <div>开始时间: {fullStartTime}</div>
              <div>最后活动: {fullLastActivity}</div>
              <div>持续时间: {duration}</div>
            </>
          } placement="topLeft">
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', fontSize: '13px' }}>{relativeTime}</div>
              <div style={{ color: '#999', fontSize: '12px' }}>(运行 {duration})</div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      width: 160,
      render: (_: any, record: Session) => (
        <Space size="small">
          {record.status === 'active' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CodeOutlined />}
                onClick={() => handleOpenTerminal(record.id)}
                disabled={openTerminalSessions.includes(record.id)}
              >
                {openTerminalSessions.includes(record.id) ? '已打开' : '打开'}
              </Button>
              <Button
                type="link"
                size="small"
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
                size="small"
                icon={<CodeOutlined />}
                onClick={() => handleOpenTerminal(record.id)}
              >
                重启
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteSession(record.id)}
              >
                删除
              </Button>
            </>
          )}
          <Dropdown menu={getContextMenu(record)} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
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

  // 综合筛选逻辑（状态 + 搜索 + Provider + 类型 + 时间范围）
  const filteredSessions = useMemo(() => {
    let filtered = getFilteredSessions(); // 先按状态筛选（Tabs）

    // 搜索关键词筛选
    if (searchKeyword) {
      filtered = filtered.filter(session =>
        session.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        session.providerName?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        session.workingDirectory.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        session.command?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    // Provider 筛选
    if (providerFilter) {
      filtered = filtered.filter(session => session.providerId === providerFilter);
    }

    // 类型筛选
    if (typeFilter) {
      filtered = filtered.filter(session => session.type === typeFilter);
    }

    // 时间范围筛选
    if (timeRangeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(session => {
        const startTime = new Date(session.startTime);
        switch (timeRangeFilter) {
          case 'today':
            return startTime.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return startTime >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return startTime >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [sessions, searchKeyword, providerFilter, typeFilter, timeRangeFilter, sessionFilter]);

  // 重置筛选条件
  const handleResetFilters = () => {
    setSearchKeyword('');
    setProviderFilter(undefined);
    setTypeFilter(undefined);
    setTimeRangeFilter('all');
  };

  // 一键清除所有非活跃会话
  const handleCleanupInactiveSessions = () => {
    const inactiveCount = inactiveSessions.length;

    if (inactiveCount === 0) {
      message.info('当前没有非活跃会话需要清除');
      return;
    }

    modal.confirm({
      title: '确定要清除所有非活跃会话吗？',
      content: `即将删除 ${inactiveCount} 个非活跃会话，此操作不可恢复`,
      okText: '确定清除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await sessionAPI.cleanupInactiveSessions();
          const deletedCount = response.data || 0;

          // 重新加载会话列表
          await loadSessions();

          message.success(`成功清除 ${deletedCount} 个非活跃会话`);
        } catch (error) {
          message.error(`清除失败: ${error}`);
        }
      },
    });
  };

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
        justifyContent: 'space-between',
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

        <div style={{
          padding: '8px 16px',
          background: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: 4,
          fontSize: 13,
          color: '#1890ff',
        }}>
          💡 提示：需要为 AI 工具配置扩展能力？访问侧边栏的 <strong>MCP Servers</strong> 页面创建和管理 MCP 服务器
        </div>
      </div>

      <Card
        title={
          <Space>
            <DesktopOutlined />
            <span>Sessions</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadSessions}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              danger
              icon={<ClearOutlined />}
              onClick={handleCleanupInactiveSessions}
              disabled={inactiveSessions.length === 0}
            >
              清除会话 ({inactiveSessions.length})
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleStartSession}
            >
              启动新会话
            </Button>
          </Space>
        }
      >
        {/* 搜索和筛选栏 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={24} md={8}>
            <Search
              placeholder="搜索会话ID、Provider、工作目录或命令"
              allowClear
              enterButton={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
              onSearch={(value: string) => setSearchKeyword(value)}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="选择 Provider"
              allowClear
              style={{ width: '100%' }}
              value={providerFilter}
              onChange={(value: string) => setProviderFilter(value)}
            >
              {providers.map(provider => (
                <Option key={provider.id} value={provider.id}>
                  {provider.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="选择类型"
              allowClear
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={(value: string) => setTypeFilter(value)}
            >
              <Option value="claude code">Claude Code</Option>
              <Option value="codex">Codex</Option>
              <Option value="gemini">Gemini</Option>
              <Option value="qoder">Qoder</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="时间范围"
              style={{ width: '100%' }}
              value={timeRangeFilter}
              onChange={(value: string) => setTimeRangeFilter(value)}
            >
              <Option value="all">全部时间</Option>
              <Option value="today">今天</Option>
              <Option value="week">最近一周</Option>
              <Option value="month">最近一月</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                重置
              </Button>
              <span style={{ color: '#8c8c8c' }}>
                {filteredSessions.length} 条
              </span>
            </Space>
          </Col>
        </Row>

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
            command: '',
          }}
          preserve={false}
        >
          <Form.Item
            label="Provider"
            name="providerId"
            rules={[{ required: true, message: '请选择Provider' }]}
          >
            <Select placeholder="请选择Provider" onChange={handleProviderChange}>
              {providers
                .filter(provider => provider.isActive)
                .map((provider) => (
                  <Option key={provider.id} value={provider.id}>
                    {provider.name} ({provider.types.join(', ')})
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
            tooltip="选择要运行的CLI工具命令"
            rules={[{ required: true, message: '请选择命令' }]}
          >
            <Select placeholder="请先选择Provider" disabled={availableCommands.length === 0}>
              {availableCommands.includes('claude') && (
                <Option value="claude">claude - Claude Code CLI</Option>
              )}
              {availableCommands.includes('codex') && (
                <Option value="codex">codex - Codex CLI</Option>
              )}
              {availableCommands.includes('gemini') && (
                <Option value="gemini">gemini - Gemini CLI</Option>
              )}
              {availableCommands.includes('qoder') && (
                <Option value="qoder">qoder - Qoder CLI</Option>
              )}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SessionManager;