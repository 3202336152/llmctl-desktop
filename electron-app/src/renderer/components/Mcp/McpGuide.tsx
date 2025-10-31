import React from 'react';
import { Modal, Steps, Typography, Card, Space, Tag, Alert } from 'antd';
import {
  DatabaseOutlined,
  LinkOutlined,
  RocketOutlined,
  FolderOutlined,
  GithubOutlined,
  GlobalOutlined,
  EditOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * MCP 使用教程对话框组件
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
const McpGuide: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal
      title={
        <Space>
          <RocketOutlined style={{ color: '#1890ff', fontSize: 20 }} />
          <span style={{ fontSize: 18, fontWeight: 600 }}>MCP 使用教程</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >
      <div style={{ padding: '16px 0' }}>
        <Card size="small" style={{ marginBottom: 24, background: '#e6f7ff', border: '1px solid #91d5ff' }}>
          <Paragraph style={{ margin: 0 }}>
            <strong>什么是 MCP？</strong>
            <br />
            MCP (Model Context Protocol) 是一个开放协议，为 AI 工具提供扩展能力。
            通过 MCP 服务器，Claude Code、Codex 等 AI 可以访问文件系统、数据库、API 等资源。
            <br />
            <br />
            <strong style={{ color: '#1890ff' }}>✨ 全局模式：</strong>所有启用的 MCP 服务器将自动应用到所有 Session，无需额外配置！
          </Paragraph>
        </Card>

        <Title level={4}>🚀 两步快速配置</Title>

        <Steps
          direction="vertical"
          current={-1}
          items={[
            {
              title: '第 1 步：创建 MCP 服务器',
              description: (
                <Card size="small" style={{ marginTop: 12, background: '#f6ffed' }}>
                  <Paragraph>
                    <strong>方式一：使用内置模板（推荐）</strong>
                  </Paragraph>
                  <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
                    <li>点击页面右上角 <Tag color="blue">模板库</Tag> 按钮</li>
                    <li>浏览不同分类的模板（文件系统、数据库、API、开发工具）</li>
                    <li>选择需要的模板，点击 <Tag color="blue">使用模板</Tag></li>
                    <li>在弹出的美观配置界面中填写信息：</li>
                  </ol>
                  <ul style={{ paddingLeft: 40, marginBottom: 12 }}>
                    <li>
                      <strong>服务器名称</strong>：保持模板名称或自定义（如 <Text code>mysql</Text>、<Text code>my-github</Text>）
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        注意：同一账户下名称不能重复，但不同用户可以使用相同名称
                      </Text>
                    </li>
                    <li>
                      <strong>环境变量</strong>：根据配置提示填写必填的环境变量
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        • 变量名已自动填充（如 API_KEY、PASSWORD）
                        <br />
                        • 敏感字段会自动使用密码输入框隐藏
                        <br />
                        • 支持添加额外的自定义环境变量
                      </Text>
                    </li>
                    <li>
                      <strong>命令参数</strong>：根据需要修改参数（例如 filesystem 需要设置允许访问的目录）
                    </li>
                  </ul>
                  <Paragraph>
                    <strong>方式二：手动创建</strong>
                  </Paragraph>
                  <ul style={{ paddingLeft: 20 }}>
                    <li>点击 <Tag color="green">新建服务器</Tag> 按钮</li>
                    <li>填写完整的配置信息（启动命令、参数、环境变量）</li>
                  </ul>
                  <Alert
                    type="success"
                    message="✅ 创建后，启用的 MCP 服务器将自动应用到所有 Session，无需额外关联！"
                    style={{ marginTop: 8 }}
                    showIcon
                  />
                </Card>
              ),
              icon: <DatabaseOutlined />
            },
            {
              title: '第 2 步：打开终端会话使用 MCP',
              description: (
                <Card size="small" style={{ marginTop: 12, background: '#f0f5ff' }}>
                  <Paragraph>
                    <strong>在 Sessions 页面创建会话：</strong>
                  </Paragraph>
                  <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
                    <li>访问 <Tag color="purple">Sessions</Tag> 页面</li>
                    <li>选择任意 Provider</li>
                    <li>选择对应的 CLI 命令（<Text code>claude</Text>、<Text code>codex</Text> 等）</li>
                    <li>点击文件夹图标，选择项目工作目录</li>
                    <li>点击 <Tag color="blue">打开终端</Tag></li>
                  </ol>
                  <Alert
                    type="success"
                    message={
                      <div>
                        <strong>🎉 大功告成！</strong>
                        <br />
                        系统会自动执行以下操作：
                        <ul style={{ marginBottom: 0, marginTop: 8, paddingLeft: 20 }}>
                          <li>在工作目录生成 <Text code>.mcp.json</Text> 配置文件</li>
                          <li>自动注入所有启用的 MCP 服务器配置</li>
                          <li>自动应用环境变量到配置文件</li>
                          <li>启动 Claude Code/Codex 时自动加载 MCP 能力</li>
                        </ul>
                      </div>
                    }
                    style={{ marginTop: 8 }}
                    showIcon
                  />
                </Card>
              ),
              icon: <RocketOutlined />
            }
          ]}
        />

        <Card style={{ marginTop: 24 }} size="small">
          <Title level={5}>📋 常见 MCP 服务器模板</Title>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Space>
                <FolderOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                <Text strong>filesystem</Text>
                <Tag color="cyan">文件系统</Tag>
              </Space>
              <Paragraph style={{ marginLeft: 24, marginTop: 4, marginBottom: 0, color: '#666' }}>
                访问本地文件和文件夹。需要配置允许访问的根目录（参数）。
              </Paragraph>
            </div>

            <div>
              <Space>
                <DatabaseOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                <Text strong>mysql / postgres / sqlite</Text>
                <Tag color="green">数据库</Tag>
              </Space>
              <Paragraph style={{ marginLeft: 24, marginTop: 4, marginBottom: 0, color: '#666' }}>
                连接和查询数据库。需要配置环境变量：HOST、PORT、USER、PASSWORD、DATABASE。
              </Paragraph>
            </div>

            <div>
              <Space>
                <GithubOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                <Text strong>github</Text>
                <Tag color="blue">API & 服务</Tag>
              </Space>
              <Paragraph style={{ marginLeft: 24, marginTop: 4, marginBottom: 0, color: '#666' }}>
                访问 GitHub 仓库、Issues、PR。需要配置 GitHub Personal Access Token。
              </Paragraph>
            </div>

            <div>
              <Space>
                <GlobalOutlined style={{ fontSize: 16, color: '#fa8c16' }} />
                <Text strong>brave-search</Text>
                <Tag color="orange">API & 服务</Tag>
              </Space>
              <Paragraph style={{ marginLeft: 24, marginTop: 4, marginBottom: 0, color: '#666' }}>
                网络搜索能力。需要配置 Brave Search API Key（免费 2000 次/月）。
              </Paragraph>
            </div>

            <div>
              <Space>
                <ThunderboltOutlined style={{ fontSize: 16, color: '#722ed1' }} />
                <Text strong>context7</Text>
                <Tag color="purple">API & 服务</Tag>
              </Space>
              <Paragraph style={{ marginLeft: 24, marginTop: 4, marginBottom: 0, color: '#666' }}>
                获取最新的库文档和代码示例。需要配置 Context7 API Key。
              </Paragraph>
            </div>
          </Space>
        </Card>

        <Card style={{ marginTop: 24 }} size="small">
          <Title level={5}>💡 使用技巧</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>✅ 环境变量管理</Text>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>所有环境变量在 <Tag color="blue">MCP Servers</Tag> 页面统一管理</li>
                <li>点击"编辑"按钮可随时修改环境变量值</li>
                <li>修改后需要重启会话才能生效</li>
                <li>敏感字段（KEY、TOKEN、PASSWORD）自动隐藏显示</li>
              </ul>
            </div>

            <div>
              <Text strong>✅ 全局自动应用</Text>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>所有启用的 MCP 服务器自动应用到所有 Session</li>
                <li>无需手动关联到 Provider，创建即可用</li>
                <li>同一账户下服务器名称必须唯一，不同用户可以同名</li>
              </ul>
            </div>

            <div>
              <Text strong>✅ 配置调试</Text>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>检查配置文件：工作目录下的 <Text code>.mcp.json</Text> 文件</li>
                <li>启用/禁用：可在 MCP Servers 页面快速切换服务器状态</li>
                <li>批量操作：支持批量启用/禁用多个 MCP 服务器</li>
              </ul>
            </div>
          </Space>
        </Card>

        <Card style={{ marginTop: 24 }} size="small">
          <Title level={5}>❓ 常见问题</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Q: 为什么 MCP 服务器没有生效？</Text>
              <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                <li>检查 MCP 服务器是否启用（MCP Servers 页面状态列）</li>
                <li>检查工作目录下的 <Text code>.mcp.json</Text> 文件是否生成</li>
                <li>检查环境变量是否正确填写（没有遗漏必填项）</li>
                <li>尝试重启会话（关闭终端后重新打开）</li>
              </ul>
            </div>

            <div>
              <Text strong>Q: 提示"您已创建过同名的 MCP 服务器"怎么办？</Text>
              <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                同一账户下不允许创建同名的 MCP 服务器。请：
                <ul style={{ paddingLeft: 20 }}>
                  <li>修改服务器名称（如 <Text code>mysql-project1</Text>、<Text code>mysql-project2</Text>）</li>
                  <li>或者编辑已有的同名服务器，修改其配置</li>
                </ul>
              </Paragraph>
            </div>

            <div>
              <Text strong>Q: 模板可以删除吗？</Text>
              <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                ❌ 内置模板（模板库中的）不可删除，但可以禁用
                <br />
                ✅ 从模板创建的用户服务器可以随时删除
              </Paragraph>
            </div>

            <div>
              <Text strong>Q: 如何修改 MCP 服务器的环境变量？</Text>
              <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                <ol style={{ paddingLeft: 20 }}>
                  <li>访问 <Tag color="blue">MCP Servers</Tag> 页面</li>
                  <li>找到对应的服务器，点击"编辑"</li>
                  <li>在弹出的美观配置界面中修改环境变量</li>
                  <li>点击"保存"</li>
                  <li>重启使用该 MCP 的会话使配置生效</li>
                </ol>
              </Paragraph>
            </div>

            <div>
              <Text strong>Q: 配置文件 .mcp.json 会被覆盖吗？</Text>
              <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                系统会自动生成包含所有启用 MCP 的配置文件：
                <ul style={{ paddingLeft: 20 }}>
                  <li>✅ 每次打开新会话时，配置文件会更新为最新配置</li>
                  <li>✅ 修改环境变量后，需要重启会话刷新配置</li>
                  <li>⚠️ 建议不要手动编辑 <Text code>.mcp.json</Text>，通过界面管理更安全</li>
                </ul>
              </Paragraph>
            </div>
          </Space>
        </Card>

        <Alert
          type="info"
          message="更多信息"
          description={
            <div>
              <Paragraph style={{ marginBottom: 8 }}>
                • MCP 官方文档：<a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">modelcontextprotocol.io</a>
                <br />
                • 更多 MCP 服务器：<a href="https://www.modelscope.cn/mcp" target="_blank" rel="noopener noreferrer">github.com/modelcontextprotocol/servers</a>
              </Paragraph>
            </div>
          }
          style={{ marginTop: 24 }}
          showIcon
        />
      </div>
    </Modal>
  );
};

export default McpGuide;
