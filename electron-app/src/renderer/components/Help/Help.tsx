import React, { useState, useMemo } from 'react';
import { Card, Input, List, Typography, Divider, Tag, Button, Space, Anchor, Alert } from 'antd';
import { SearchOutlined, BookOutlined, QuestionCircleOutlined, KeyOutlined, DesktopOutlined, SettingOutlined, GithubOutlined, MessageOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './Help.css';

const { Title, Paragraph, Text, Link } = Typography;
const { Search } = Input;
const { Link: AnchorLink } = Anchor;

interface HelpItem {
  id: string;
  title: string;
  content: React.ReactNode;
  keywords: string[];
  category: string;
}

interface StrategyItem {
  strategy: string;
  desc: string;
}

interface ShortcutItem {
  key: string;
  desc: string;
}

interface CategoryItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const Help: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 帮助内容数据
  const helpItems: HelpItem[] = [
    {
      id: 'getting-started',
      title: '快速开始',
      category: 'getting-started',
      keywords: ['开始', '入门', '首次使用', '配置'],
      content: (
        <div>
          <Title level={4}>欢迎使用 LLMctl 🚀</Title>
          <Paragraph>
            LLMctl 是一个功能强大的 LLM Provider、Token 和会话管理桌面应用。本指南将帮助您快速上手。
          </Paragraph>

          <Title level={5}>第一步：添加 Provider</Title>
          <Paragraph>
            1. 点击左侧菜单的 <Text strong>Providers</Text><br />
            2. 点击 <Text strong>"Add Provider"</Text> 按钮<br />
            3. 选择您要使用的 LLM 服务商（如 Claude、OpenAI、Qwen 等）<br />
            4. 填写相应的 API 配置信息<br />
            5. 点击 <Text strong>"Test"</Text> 验证配置<br />
            6. 保存配置
          </Paragraph>

          <Title level={5}>第二步：添加 API Keys</Title>
          <Paragraph>
            1. 点击左侧菜单的 <Text strong>API Keys</Text><br />
            2. 点击 <Text strong>"Add Token"</Text> 按钮<br />
            3. 输入您的 API Key<br />
            4. 选择对应的 Provider 和轮询策略<br />
            5. 保存配置
          </Paragraph>

          <Title level={5}>第三步：创建会话</Title>
          <Paragraph>
            1. 点击左侧菜单的 <Text strong>Sessions</Text><br />
            2. 点击 <Text strong>"Start Session"</Text> 按钮<br />
            3. 选择 Provider 和工作目录<br />
            4. 点击启动即可开始使用
          </Paragraph>
        </div>
      )
    },
    {
      id: 'providers',
      title: 'Provider 管理',
      category: 'features',
      keywords: ['provider', '服务商', '配置', 'claude', 'openai'],
      content: (
        <div>
          <Title level={4}>Provider 配置指南</Title>

          <Title level={5}>支持的 Provider</Title>
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">Claude (Anthropic)</Tag>
            <Tag color="green">OpenAI</Tag>
            <Tag color="orange">Qwen (阿里云)</Tag>
            <Tag color="purple">Gemini (Google)</Tag>
            <Tag color="red">自定义 Provider</Tag>
          </div>

          <Title level={5}>配置步骤</Title>
          <Paragraph>
            1. <Text strong>选择服务商：</Text>从下拉列表中选择您要使用的 LLM 服务商<br />
            2. <Text strong>填写配置：</Text>根据服务商要求填写 API 密钥、端点等信息<br />
            3. <Text strong>测试连接：</Text>点击 "Test" 按钮验证配置是否正确<br />
            4. <Text strong>启用/禁用：</Text>通过开关控制 Provider 的启用状态
          </Paragraph>

          <Title level={5}>常见问题</Title>
          <Paragraph>
            <Text strong>Q: 测试连接失败怎么办？</Text><br />
            A: 请检查 API 密钥是否正确，网络是否正常，端点地址是否正确。
          </Paragraph>
          <Paragraph>
            <Text strong>Q: 如何添加自定义 Provider？</Text><br />
            A: 选择 "Custom" 选项，手动填写 API 端点和参数格式。
          </Paragraph>
        </div>
      )
    },
    {
      id: 'tokens',
      title: 'Token 管理',
      category: 'features',
      keywords: ['token', 'api key', '密钥', '轮询', '策略'],
      content: (
        <div>
          <Title level={4}>API Token 管理策略</Title>

          <Title level={5}>轮询策略说明</Title>
          <List
            size="small"
            dataSource={[
              { strategy: 'Round Robin', desc: '顺序轮询，依次使用每个 Token' },
              { strategy: 'Weighted', desc: '按权重随机选择，权重越高使用概率越大' },
              { strategy: 'Random', desc: '完全随机选择 Token' },
              { strategy: 'Least Used', desc: '选择使用次数最少的 Token' }
            ]}
            renderItem={(item: StrategyItem) => (
              <List.Item>
                <Text strong>{item.strategy}:</Text> {item.desc}
              </List.Item>
            )}
          />

          <Title level={5}>健康检查</Title>
          <Paragraph>
            系统会自动监控 Token 的健康状态：
          </Paragraph>
          <ul>
            <li><Tag color="green">健康</Tag> - Token 正常可用</li>
            <li><Tag color="orange">警告</Tag> - Token 可能存在问题</li>
            <li><Tag color="red">失效</Tag> - Token 已失效，需要更新</li>
          </ul>

          <Title level={5}>最佳实践</Title>
          <Paragraph>
            • 建议为每个 Provider 配置多个 Token<br />
            • 根据使用量选择合适的轮询策略<br />
            • 定期检查 Token 状态和余额<br />
            • 及时更新失效的 Token
          </Paragraph>
        </div>
      )
    },
    {
      id: 'sessions',
      title: '会话管理',
      category: 'features',
      keywords: ['会话', '终端', '工作目录', '进程'],
      content: (
        <div>
          <Title level={4}>会话和终端管理</Title>

          <Title level={5}>创建会话</Title>
          <Paragraph>
            1. 选择已配置的 Provider<br />
            2. 选择工作目录（文件夹选择对话框）<br />
            3. 配置启动命令（可选）<br />
            4. 点击 "Start Session" 启动会话
          </Paragraph>

          <Title level={5}>会话状态</Title>
          <ul>
            <li><Tag color="green">ACTIVE</Tag> - 会话正在运行</li>
            <li><Tag color="orange">INACTIVE</Tag> - 会话已暂停</li>
            <li><Tag color="red">TERMINATED</Tag> - 会话已终止</li>
          </ul>

          <Title level={5}>终端功能</Title>
          <Paragraph>
            • <Text strong>多终端并发：</Text>同时打开多个终端窗口<br />
            • <Text strong>标签页管理：</Text>便捷的终端标签页切换<br />
            • <Text strong>全屏模式：</Text>F11/ESC 快捷键切换全屏<br />
            • <Text strong>字体缩放：</Text>Ctrl+滚轮动态调整字体大小<br />
            • <Text strong>智能切换：</Text>Token 失效时自动切换到新 Token
          </Paragraph>

          <Title level={5}>快捷键</Title>
          <Paragraph>
            • <Text keyboard>Ctrl+K</Text> - 打开命令面板<br />
            • <Text keyboard>F11</Text> - 切换全屏模式<br />
            • <Text keyboard>Ctrl+C/V</Text> - 复制粘贴<br />
            • <Text keyboard>Ctrl+滚轮</Text> - 调整字体大小
          </Paragraph>
        </div>
      )
    },
    {
      id: 'shortcuts',
      title: '快捷键',
      category: 'reference',
      keywords: ['快捷键', 'shortcut', 'hotkey', '键盘'],
      content: (
        <div>
          <Title level={4}>快捷键参考</Title>

          <Title level={5}>全局快捷键</Title>
          <List
            dataSource={[
              { key: 'Ctrl+K', desc: '打开命令面板' },
              { key: 'F11', desc: '切换终端全屏模式' },
              { key: 'ESC', desc: '退出全屏/关闭命令面板' }
            ]}
            renderItem={(item: ShortcutItem) => (
              <List.Item>
                <Text keyboard>{item.key}</Text>
                <Text style={{ marginLeft: 12 }}>{item.desc}</Text>
              </List.Item>
            )}
          />

          <Title level={5}>终端快捷键</Title>
          <List
            dataSource={[
              { key: 'Ctrl+C', desc: '复制' },
              { key: 'Ctrl+V', desc: '粘贴' },
              { key: 'Ctrl+滚轮', desc: '调整字体大小 (8px-30px)' }
            ]}
            renderItem={(item: ShortcutItem) => (
              <List.Item>
                <Text keyboard>{item.key}</Text>
                <Text style={{ marginLeft: 12 }}>{item.desc}</Text>
              </List.Item>
            )}
          />

          <Title level={5}>界面快捷键</Title>
          <List
            dataSource={[
              { key: 'Ctrl+O', desc: '导入配置' },
              { key: 'Ctrl+S', desc: '导出配置' },
              { key: 'Ctrl+Q', desc: '退出应用' }
            ]}
            renderItem={(item: ShortcutItem) => (
              <List.Item>
                <Text keyboard>{item.key}</Text>
                <Text style={{ marginLeft: 12 }}>{item.desc}</Text>
              </List.Item>
            )}
          />
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: '故障排查',
      category: 'reference',
      keywords: ['问题', '故障', '排查', 'FAQ', '错误'],
      content: (
        <div>
          <Title level={4}>常见问题与解决方案</Title>

          <Title level={5}>连接问题</Title>
          <Alert
            message="API 连接失败"
            description="检查网络连接、API 密钥是否正确，服务商端点地址是否有效。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Title level={5}>Token 问题</Title>
          <Paragraph>
            <Text strong>Q: Token 频繁失效？</Text><br />
            A: 检查 Token 余额和有效期，设置多个 Token 实现负载均衡。
          </Paragraph>

          <Title level={5}>终端问题</Title>
          <Paragraph>
            <Text strong>Q: 终端无法启动？</Text><br />
            A: 检查工作目录是否存在，确保有相应的权限。在 Windows 上可能需要安装 Git Bash。
          </Paragraph>

          <Title level={5}>性能问题</Title>
          <Paragraph>
            <Text strong>Q: 应用卡顿？</Text><br />
            A: 关闭不必要的终端标签页，清理历史会话记录，重启应用。
          </Paragraph>

          <Title level={5}>配置问题</Title>
          <Paragraph>
            <Text strong>Q: 配置丢失？</Text><br />
            A: 检查应用数据目录权限，定期导出配置备份。
          </Paragraph>
        </div>
      )
    },
    {
      id: 'about',
      title: '关于',
      category: 'about',
      keywords: ['关于', '版本', '更新', '开源'],
      content: (
        <div>
          <Title level={4}>关于 LLMctl</Title>

          <Title level={5}>版本信息</Title>
          <Paragraph>
            当前版本：v2.0.4<br />
            更新日期：2024年10月<br />
            开发团队：LLMctl Team
          </Paragraph>

          <Title level={5}>功能特性</Title>
          <ul>
            <li>🎯 多 Provider 支持 - Claude、OpenAI、Qwen、Gemini 等</li>
            <li>🔑 智能 Token 管理 - 多种轮询策略，自动故障切换</li>
            <li>💻 强大终端功能 - 多标签页、全屏模式、字体缩放</li>
            <li>🌐 国际化支持 - 中英文双语界面</li>
            <li>📊 会话管理 - 实时监控、状态管理、自动重启</li>
            <li>🔧 配置管理 - 导入导出、备份恢复</li>
          </ul>

          <Title level={5}>技术栈</Title>
          <Paragraph>
            • <Text strong>前端：</Text>Electron + React + TypeScript + Ant Design<br />
            • <Text strong>后端：</Text>Spring Boot + MyBatis + MySQL<br />
            • <Text strong>构建：</Text>Webpack + Maven + electron-builder
          </Paragraph>
        </div>
      )
    }
  ];

  // 分类定义
  const categories = [
    { key: 'all', label: '全部', icon: <BookOutlined /> },
    { key: 'getting-started', label: '快速开始', icon: <QuestionCircleOutlined /> },
    { key: 'features', label: '功能介绍', icon: <DesktopOutlined /> },
    { key: 'reference', label: '参考资料', icon: <KeyOutlined /> },
    { key: 'about', label: '关于', icon: <SettingOutlined /> }
  ];

  // 过滤帮助内容
  const filteredItems = useMemo(() => {
    let items = helpItems;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // 按搜索词过滤
    if (searchTerm) {
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return items;
  }, [searchTerm, selectedCategory]);

  return (
    <div className="help-container">
      <div className="help-header">
        <Title level={2}>
          <BookOutlined /> 帮助中心
        </Title>
        <Paragraph>
          找到您需要的答案，快速了解和使用 LLMctl 的各项功能
        </Paragraph>

        <Search
          placeholder="搜索帮助内容..."
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 24 }}
        />
      </div>

      <div className="help-content">
        <div className="help-sidebar">
          <Card title="内容分类" size="small">
            <List
              size="small"
              dataSource={categories}
              renderItem={(category: CategoryItem) => (
                <List.Item
                  className={`category-item ${selectedCategory === category.key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.key)}
                >
                  <Space>
                    {category.icon}
                    {category.label}
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card title="快速链接" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="link" icon={<GithubOutlined />} block>
                GitHub 项目
              </Button>
              <Button type="link" icon={<MessageOutlined />} block>
                问题反馈
              </Button>
            </Space>
          </Card>
        </div>

        <div className="help-main">
          {filteredItems.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <SearchOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Title level={4} type="secondary">没有找到相关内容</Title>
                <Paragraph type="secondary">
                  请尝试其他关键词或浏览全部内容
                </Paragraph>
              </div>
            </Card>
          ) : (
            filteredItems.map(item => (
              <Card
                key={item.id}
                id={item.id}
                title={item.title}
                style={{ marginBottom: 16 }}
                className="help-card"
              >
                {item.content}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Help;