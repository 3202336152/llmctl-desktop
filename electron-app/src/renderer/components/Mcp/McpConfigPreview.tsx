import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, Collapse, Tag, message } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { McpConfig } from '../../types/mcp';
import './McpConfigPreview.css';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface Props {
  config: McpConfig;
  cliType: string;
}

/**
 * MCP 配置预览组件
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
const McpConfigPreview: React.FC<Props> = ({ config, cliType }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const configText = JSON.stringify({ mcpServers: config }, null, 2);
      await navigator.clipboard.writeText(configText);
      setCopied(true);
      message.success('配置已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleDownload = () => {
    const configText = JSON.stringify({ mcpServers: config }, null, 2);
    const blob = new Blob([configText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('配置已下载');
  };

  const getConfigType = () => {
    switch (cliType) {
      case 'claude code':
        return 'Claude Code (.mcp.json - 项目级配置)';
      case 'codex':
        return 'Codex CLI';
      case 'gemini':
        return 'Gemini CLI';
      case 'qoder':
        return 'Qoder CLI';
      default:
        return '通用配置';
    }
  };

  if (!config || Object.keys(config).length === 0) {
    return (
      <Card title="配置预览" size="small">
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          <p>暂无配置</p>
          <p style={{ fontSize: '12px' }}>请先为当前 Provider 配置 MCP 服务器</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <span>配置预览</span>
          <Tag color="blue">{getConfigType()}</Tag>
        </Space>
      }
      size="small"
      className="mcp-config-preview"
      extra={
        <Space>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            className={copied ? 'copied' : ''}
          >
            {copied ? '已复制' : '复制'}
          </Button>
          <Button type="text" icon={<DownloadOutlined />} onClick={handleDownload}>
            下载
          </Button>
        </Space>
      }
    >
      <div className="config-content">
        <Collapse ghost>
          <Panel
            header={
              <Space>
                <Text strong>生成的配置文件</Text>
                <Tag size="small">{Object.keys(config).length} 个服务器</Tag>
              </Space>
            }
            key="config"
          >
            <pre className="config-json">
              {JSON.stringify({ mcpServers: config }, null, 2)}
            </pre>
          </Panel>
        </Collapse>

        <Divider />

        <div className="config-summary">
          <Title level={5}>配置摘要</Title>
          <div className="summary-grid">
            {Object.entries(config).map(([serverName, serverConfig]) => (
              <div key={serverName} className="server-summary">
                <div className="server-name">
                  <Text strong>{serverName}</Text>
                  <Tag size="small">{serverConfig.command}</Tag>
                </div>
                {serverConfig.args && (
                  <div className="server-args">
                    <Text type="secondary" className="text-sm">
                      {serverConfig.args.join(' ')}
                    </Text>
                  </div>
                )}
                {serverConfig.env && (
                  <div className="server-env">
                    {Object.keys(serverConfig.env).map((key) => (
                      <Tag key={key} size="small" color="orange">
                        {key}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Divider />

        <div className="usage-info">
          <Title level={5}>使用说明</Title>
          <div className="usage-content">
            <div className="usage-step">
              <Text>1. 保存配置文件到项目目录</Text>
            </div>
            <div className="usage-step">
              <Text>2. 重启或启动新的 CLI 会话</Text>
            </div>
            <div className="usage-step">
              <Text>3. 在对话中使用 MCP 提供的功能</Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default McpConfigPreview;
