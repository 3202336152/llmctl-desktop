import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Tag, message, App as AntApp } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
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
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchMcpServers,
  deleteMcpServer,
  toggleMcpServerEnabled,
  batchToggleMcpServersEnabled,
  batchDeleteMcpServers
} from '../../store/slices/mcpSlice';
import McpServerForm from './McpServerForm';
import McpTemplateLibrary from './McpTemplateLibrary';
import McpGuide from './McpGuide';
import { McpServer } from '../../types/mcp';
import './McpServerManager.css';

/**
 * MCP 服务器管理主页面
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
const McpServerManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { modal } = AntApp.useApp();
  const { servers, loading } = useAppSelector((state) => state.mcp);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [templateLibVisible, setTemplateLibVisible] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);

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
    hdd: <HddOutlined />,
    search: <SearchOutlined />
  };

  useEffect(() => {
    dispatch(fetchMcpServers());
  }, [dispatch]);

  const handleEdit = (server: McpServer) => {
    setEditingServer(server);
    setFormVisible(true);
  };

  const handleDelete = async (id: number, serverName: string) => {
    modal.confirm({
      title: '确认删除 MCP 服务器',
      content: (
        <div>
          <p>确定要删除 <strong>{serverName}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            ⚠️ 删除后：
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>该 MCP 服务器的所有配置将被移除</li>
            <li>关联的 Provider 将无法使用此 MCP</li>
            <li>已有会话需重启才能生效</li>
          </ul>
        </div>
      ),
      okText: '确定删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      // ✅ 异步 onOk，自动显示加载状态，防止重复点击
      onOk: async () => {
        await dispatch(deleteMcpServer(id)).unwrap();
        message.success('删除成功');
      },
      // ✅ 添加错误处理
      onCancel: () => {
        // 用户取消操作
      }
    });
  };

  const handleToggleEnabled = (id: number, enabled: boolean) => {
    dispatch(toggleMcpServerEnabled({ id, enabled }));
  };

  const handleBatchToggle = (enabled: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的服务器');
      return;
    }
    dispatch(
      batchToggleMcpServersEnabled({
        ids: selectedRowKeys as number[],
        enabled
      })
    );
    setSelectedRowKeys([]);
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的服务器');
      return;
    }

    modal.confirm({
      title: '确认批量删除 MCP 服务器',
      content: (
        <div>
          <p>确定要删除选中的 <strong>{selectedRowKeys.length}</strong> 个 MCP 服务器吗？</p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            ⚠️ 删除后：
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>这些 MCP 服务器的所有配置将被移除</li>
            <li>关联的 Provider 将无法使用这些 MCP</li>
            <li>已有会话需重启才能生效</li>
          </ul>
        </div>
      ),
      okText: '确定删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await dispatch(batchDeleteMcpServers(selectedRowKeys as number[])).unwrap();
        setSelectedRowKeys([]);
      }
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (text: string, record: McpServer) => (
        <Space size="small">
          {record.icon && (
            <span style={{ fontSize: 16, color: record.enabled ? '#1890ff' : '#d9d9d9' }}>
              {iconMap[record.icon] || record.icon}
            </span>
          )}
          <span style={{
            fontWeight: 500,
            color: record.enabled ? 'inherit' : '#8c8c8c'
          }}>
            {text}
          </span>
          {record.enabled ? (
            <Tag color="success" style={{ marginLeft: 4 }}>已启用</Tag>
          ) : (
            <Tag color="default" style={{ marginLeft: 4 }}>未启用</Tag>
          )}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color="geekblue">{type.toUpperCase()}</Tag>
    },
    {
      title: '命令',
      dataIndex: 'command',
      key: 'command',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: McpServer) => (
        <Space>
          {record.enabled ? (
            <Button
              type="link"
              size="small"
              onClick={() => handleToggleEnabled(record.id!, false)}
            >
              禁用
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => handleToggleEnabled(record.id!, true)}
            >
              启用
            </Button>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record.id!, record.name)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchText.toLowerCase()) ||
      server.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="mcp-server-manager">
      <div className="mcp-server-header">
        <h2>MCP 服务器管理</h2>
        <p className="mcp-server-description">
          管理 Model Context Protocol 服务器，为 AI 工具提供扩展能力。
        </p>
      </div>

      <div className="mcp-server-toolbar">
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索 MCP 服务器"
            value={searchText}
            onChange={(e: any) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button
            disabled={selectedRowKeys.length === 0}
            onClick={() => handleBatchToggle(true)}
          >
            批量启用
          </Button>
          <Button
            disabled={selectedRowKeys.length === 0}
            onClick={() => handleBatchToggle(false)}
          >
            批量禁用
          </Button>
          <Button
            danger
            disabled={selectedRowKeys.length === 0}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
        </Space>
        <Space>
          <Button icon={<QuestionCircleOutlined />} onClick={() => setGuideVisible(true)}>
            使用教程
          </Button>
          <Button icon={<AppstoreOutlined />} onClick={() => setTemplateLibVisible(true)}>
            模板库
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormVisible(true)}>
            新建服务器
          </Button>
        </Space>
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys
        }}
        columns={columns}
        dataSource={filteredServers}
        rowKey="id"
        loading={loading}
        pagination={{
          showTotal: (total: number) => `共 ${total} 个服务器`,
          showSizeChanger: true,
          showQuickJumper: true
        }}
      />

      <McpServerForm
        visible={formVisible}
        server={editingServer}
        onClose={() => {
          setFormVisible(false);
          setEditingServer(null);
        }}
      />

      <McpTemplateLibrary
        visible={templateLibVisible}
        onClose={() => setTemplateLibVisible(false)}
      />

      <McpGuide visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </div>
  );
};

export default McpServerManager;
