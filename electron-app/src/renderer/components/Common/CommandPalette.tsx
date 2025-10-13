import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, List, Tag, Space } from 'antd';
import {
  DatabaseOutlined,
  KeyOutlined,
  DesktopOutlined,
  SettingOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * 命令面板组件
 * 快捷键 Ctrl+K 打开
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({ visible, onClose }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<any>(null);

  // 定义所有可用命令
  const allCommands: Command[] = [
    {
      id: 'nav-providers',
      title: 'Providers',
      description: '管理LLM Providers',
      icon: <DatabaseOutlined />,
      category: '导航',
      action: () => {
        navigate('/providers');
        onClose();
      },
      keywords: ['provider', 'llm', '大模型'],
    },
    {
      id: 'nav-tokens',
      title: 'API Keys',
      description: '管理API Tokens',
      icon: <KeyOutlined />,
      category: '导航',
      action: () => {
        navigate('/tokens');
        onClose();
      },
      keywords: ['token', 'api', '密钥'],
    },
    {
      id: 'nav-sessions',
      title: 'Sessions',
      description: '查看和管理会话',
      icon: <DesktopOutlined />,
      category: '导航',
      action: () => {
        navigate('/sessions');
        onClose();
      },
      keywords: ['session', '会话', '终端'],
    },
    {
      id: 'nav-settings',
      title: '设置',
      description: '应用设置',
      icon: <SettingOutlined />,
      category: '导航',
      action: () => {
        navigate('/settings');
        onClose();
      },
      keywords: ['settings', '设置', '配置'],
    },
  ];

  // 过滤命令
  const filteredCommands = allCommands.filter(cmd => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
    );
  });

  // 焦点输入框
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // 重置状态
  useEffect(() => {
    if (visible) {
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [visible]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      closable={false}
      styles={{
        body: { padding: 0 },
      }}
      style={{
        top: 100,
      }}
    >
      <div style={{ padding: '16px 16px 0' }}>
        <Search
          ref={inputRef}
          placeholder="搜索命令..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchTerm(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          size="large"
          style={{ marginBottom: 8 }}
        />
      </div>

      <List
        dataSource={filteredCommands}
        style={{
          maxHeight: 400,
          overflow: 'auto',
        }}
        renderItem={(cmd: Command, index: number) => (
          <List.Item
            key={cmd.id}
            onClick={() => cmd.action()}
            style={{
              cursor: 'pointer',
              padding: '12px 16px',
              background: index === selectedIndex ? '#f5f5f5' : 'transparent',
              transition: 'background 0.2s',
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <List.Item.Meta
              avatar={
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: '#1890ff',
                  }}
                >
                  {cmd.icon}
                </div>
              }
              title={
                <Space>
                  <span>{cmd.title}</span>
                  <Tag color="blue" style={{ fontSize: 11 }}>
                    {cmd.category}
                  </Tag>
                </Space>
              }
              description={cmd.description}
            />
          </List.Item>
        )}
        locale={{
          emptyText: (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
              <SearchOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>未找到匹配的命令</div>
            </div>
          ),
        }}
      />

      <div
        style={{
          padding: '8px 16px',
          background: '#fafafa',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#999',
        }}
      >
        <Space size={16}>
          <span>↑↓ 导航</span>
          <span>Enter 选择</span>
          <span>ESC 关闭</span>
        </Space>
        <span>{filteredCommands.length} 个命令</span>
      </div>
    </Modal>
  );
};

export default CommandPalette;
