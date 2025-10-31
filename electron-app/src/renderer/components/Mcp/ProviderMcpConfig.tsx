import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Space, message, Modal, Checkbox, App as AntApp } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
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
  HddOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { mcpAPI } from '../../services/mcpAPI';
import { ProviderMcpMapping, McpServer, CliType, McpConfig } from '../../types/mcp';
import McpConfigPreview from './McpConfigPreview';
import { useAppSelector } from '../../store';

// 图标映射
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

interface Props {
  providerId: string;  // 修改为 string，与后端 Java 类型一致
  cliType: CliType;
}

/**
 * Provider MCP 配置组件
 * 在 Provider 编辑页面中使用，管理 Provider 关联的 MCP 服务器
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
const ProviderMcpConfig: React.FC<Props> = ({ providerId, cliType }) => {
  const { modal } = AntApp.useApp();
  const { servers } = useAppSelector((state) => state.mcp);
  const [mappings, setMappings] = useState<ProviderMcpMapping[]>([]);
  const [config, setConfig] = useState<McpConfig>({});
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false); // 防止重复提交

  useEffect(() => {
    loadMappings();
    loadConfig();
  }, [providerId, cliType]);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const res = await mcpAPI.getMappingsByProviderAndCli(providerId, cliType);
      if (res.code === 200) {
        setMappings(res.data);
      }
    } catch (error) {
      console.error('加载映射失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await mcpAPI.generateMcpConfig(providerId, cliType);
      if (res.code === 200) {
        setConfig(res.data);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const handleAdd = async () => {
    if (!selectedServerId) {
      message.warning('请选择要添加的 MCP 服务器');
      return;
    }

    if (submitting) {
      return; // 防止重复提交
    }

    setSubmitting(true);
    try {
      await mcpAPI.createMapping({
        providerId,
        mcpServerId: selectedServerId,
        cliType,
        enabled: true,
        priority: 0
      });

      message.success('添加成功');
      setAddModalVisible(false);
      setSelectedServerId(null);

      // 重新加载映射列表
      await loadMappings();
      await loadConfig();
    } catch (error: any) {
      message.error(error.response?.data?.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = async (id: number, priority: number) => {
    try {
      await mcpAPI.updatePriority(id, priority);
      loadMappings();
      loadConfig();
    } catch (error) {
      message.error('更新优先级失败');
    }
  };

  const handleToggleEnabled = async (id: number, enabled: boolean) => {
    try {
      const mapping = mappings.find((m) => m.id === id);
      if (mapping) {
        await mcpAPI.updateMapping(id, {
          ...mapping,
          enabled
        });
        message.success(`已${enabled ? '启用' : '禁用'}`);
        loadMappings();
        loadConfig();
      }
    } catch (error) {
      message.error('更新状态失败');
    }
  };

  const handleDelete = async (id: number, serverName: string) => {
    if (submitting) {
      return; // 防止重复提交
    }

    modal.confirm({
      title: '确认删除 MCP 服务器关联',
      content: (
        <div>
          <p>确定要从当前 Provider 中移除 <strong>{serverName}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f', marginTop: 12 }}>
            ⚠️ 删除后的影响：
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 20, color: '#666' }}>
            <li>该 MCP 服务器将不再关联此 Provider</li>
            <li><strong>已有会话的 .mcp.json 文件不会自动更新</strong></li>
            <li>需要在 Sessions 页面右键相关会话，选择"刷新 MCP 配置"</li>
            <li>或者重启会话以应用新的 MCP 配置</li>
            <li>如需修改 MCP 服务器的环境变量，请前往 MCP Servers 页面进行编辑</li>
          </ul>
        </div>
      ),
      okText: '确定删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSubmitting(true);
        try {
          await mcpAPI.deleteMapping(id);
          message.success({
            content: (
              <div>
                <div>删除成功！</div>
              </div>
            ),
            duration: 5,
          });
          loadMappings();
          loadConfig();
        } catch (error) {
          message.error('删除失败');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const columns = [
    {
      title: 'MCP 服务器',
      dataIndex: ['mcpServer', 'name'],
      key: 'name',
      render: (text: string, record: ProviderMcpMapping) => {
        const icon = record.mcpServer?.icon ? iconMap[record.mcpServer.icon] : null;
        return (
          <Space>
            {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
            <strong>{text}</strong>
          </Space>
        );
      }
    },
    {
      title: '描述',
      dataIndex: ['mcpServer', 'description'],
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record: ProviderMcpMapping) => (
        <Checkbox
          checked={enabled}
          onChange={(e: any) => handleToggleEnabled(record.id!, e.target.checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: ProviderMcpMapping) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id!, record.mcpServer?.name || 'MCP 服务器')}
        >
          删除
        </Button>
      )
    }
  ];

  // 过滤掉已关联的服务器
  const availableServers = servers.filter(
    (server) => !mappings.some((mapping) => mapping.mcpServerId === server.id) && server.enabled
  );

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            添加 MCP 服务器
          </Button>
          <span style={{ color: '#999', fontSize: 12 }}>
            为当前 Provider 的 {cliType} CLI 配置 MCP 服务器
          </span>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={mappings}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: '暂无关联的 MCP 服务器' }}
      />

      <div style={{ marginTop: 24 }}>
        <McpConfigPreview config={config} cliType={cliType} />
      </div>

      <Modal
        title="添加 MCP 服务器"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setAddModalVisible(false);
          setSelectedServerId(null);
        }}
        okText="添加"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#999', fontSize: 12 }}>
            从已创建的 MCP 服务器中选择一个进行关联
          </p>
        </div>
        <Select
          style={{ width: '100%' }}
          placeholder="选择 MCP 服务器"
          value={selectedServerId}
          onChange={setSelectedServerId}
          showSearch
          optionFilterProp="children"
        >
          {availableServers.map((server) => (
            <Select.Option key={server.id} value={server.id!}>
              <Space>
                <span>{server.name}</span>
                <span style={{ color: '#999', fontSize: 12 }}>{server.description}</span>
              </Space>
            </Select.Option>
          ))}
        </Select>
        {availableServers.length === 0 && (
          <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
            没有可用的 MCP 服务器，请先在 MCP Servers 页面创建
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProviderMcpConfig;
