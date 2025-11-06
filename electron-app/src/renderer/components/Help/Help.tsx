import React, { useState, useMemo } from 'react';
import { Card, Input, List, Typography, Divider, Tag, Button, Space, Anchor, Alert, Steps } from 'antd';
import { SearchOutlined, BookOutlined, QuestionCircleOutlined, KeyOutlined, DesktopOutlined, SettingOutlined, GithubOutlined, MessageOutlined, UserOutlined, ApiOutlined, RocketOutlined, LoginOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
          <Alert
            message="开始您的 AI 助手管理之旅"
            description="LLMctl 是一个功能强大的 LLM Provider、Token 和会话管理桌面应用。按照以下步骤快速配置并启动您的第一个 AI 会话。"
            type="info"
            showIcon
            icon={<RocketOutlined />}
            style={{ marginBottom: 24 }}
          />

          <Steps
            direction="vertical"
            size="small"
            current={-1}
            items={[
              {
                title: <Text strong style={{ fontSize: 16 }}>第一步：用户登录</Text>,
                icon: <LoginOutlined style={{ fontSize: 20 }} />,
                description: (
                  <div style={{ marginTop: 12 }}>
                    <List
                      size="small"
                      dataSource={[
                        { icon: '🔐', text: '应用启动后显示登录页面' },
                        { icon: '📝', text: '首次使用？点击"注册"创建新账户（需邮箱验证）' },
                        { icon: '✅', text: '登录成功后进入主应用界面' }
                      ]}
                      renderItem={(item: { icon: string; text: string }) => (
                        <List.Item style={{ border: 'none', padding: '4px 0' }}>
                          <Space>
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            <Text>{item.text}</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                    <Alert
                      message="提示"
                      description="支持 QQ 邮箱和 163 邮箱注册，验证码 5 分钟有效"
                      type="success"
                      showIcon
                      style={{ marginTop: 12 }}
                    />
                  </div>
                )
              },
              {
                title: <Text strong style={{ fontSize: 16 }}>第二步：添加 Provider</Text>,
                icon: <ApiOutlined style={{ fontSize: 20 }} />,
                description: (
                  <div style={{ marginTop: 12 }}>
                    <List
                      size="small"
                      dataSource={[
                        { step: '1', text: '点击左侧菜单', highlight: 'Providers' },
                        { step: '2', text: '点击', highlight: 'Add Provider', color: 'blue' },
                        { step: '3', text: '选择 LLM 服务商', highlight: 'Claude Code / Codex / Gemini / Qoder' },
                        { step: '4', text: '填写 API 配置信息（API Key、端点等）' },
                        { step: '5', text: '点击', highlight: 'Test', color: 'green', extra: '验证配置' },
                        { step: '6', text: '保存配置', icon: '💾' }
                      ]}
                      renderItem={(item: any) => (
                        <List.Item style={{ border: 'none', padding: '4px 0' }}>
                          <Space>
                            <Tag color="cyan">{item.step}</Tag>
                            <Text>{item.text}</Text>
                            {item.highlight && (
                              <Tag color={item.color || 'default'}>
                                <strong>{item.highlight}</strong>
                              </Tag>
                            )}
                            {item.extra && <Text type="secondary">({item.extra})</Text>}
                            {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
                          </Space>
                        </List.Item>
                      )}
                    />
                  </div>
                )
              },
              {
                title: <Text strong style={{ fontSize: 16 }}>第三步：添加 API Keys</Text>,
                icon: <KeyOutlined style={{ fontSize: 20 }} />,
                description: (
                  <div style={{ marginTop: 12 }}>
                    <List
                      size="small"
                      dataSource={[
                        { step: '1', text: '点击左侧菜单', highlight: 'API Keys' },
                        { step: '2', text: '点击', highlight: 'Add Token', color: 'blue' },
                        { step: '3', text: '输入 API Key', icon: '🔑', extra: 'AES-256-GCM 加密存储' },
                        { step: '4', text: '选择对应的 Provider 和轮询策略', highlight: 'Round Robin / Weighted / Random / Least Used' },
                        { step: '5', text: '保存配置', icon: '💾' }
                      ]}
                      renderItem={(item: any) => (
                        <List.Item style={{ border: 'none', padding: '4px 0' }}>
                          <Space>
                            <Tag color="cyan">{item.step}</Tag>
                            <Text>{item.text}</Text>
                            {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
                            {item.highlight && (
                              <Tag color={item.color || 'default'}>
                                <strong>{item.highlight}</strong>
                              </Tag>
                            )}
                            {item.extra && <Text type="secondary">({item.extra})</Text>}
                          </Space>
                        </List.Item>
                      )}
                    />
                    <Alert
                      message="安全提示"
                      description="所有 Token 采用 NSA 级 AES-256-GCM 加密存储，前端只显示前 4 位和后 4 位"
                      type="warning"
                      showIcon
                      style={{ marginTop: 12 }}
                    />
                  </div>
                )
              },
              {
                title: <Text strong style={{ fontSize: 16 }}>第四步：创建会话</Text>,
                icon: <DesktopOutlined style={{ fontSize: 20 }} />,
                description: (
                  <div style={{ marginTop: 12 }}>
                    <List
                      size="small"
                      dataSource={[
                        { step: '1', text: '点击左侧菜单', highlight: 'Sessions' },
                        { step: '2', text: '点击', highlight: 'Start Session', color: 'green' },
                        { step: '3', text: '选择 Provider 和工作目录', icon: '📁' },
                        { step: '4', text: '选择 CLI 命令', highlight: 'claude / codex / gemini / qoder' },
                        { step: '5', text: '点击启动，开始使用！', icon: '🎉' }
                      ]}
                      renderItem={(item: any) => (
                        <List.Item style={{ border: 'none', padding: '4px 0' }}>
                          <Space>
                            <Tag color="cyan">{item.step}</Tag>
                            <Text>{item.text}</Text>
                            {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
                            {item.highlight && (
                              <Tag color={item.color || 'default'}>
                                <strong>{item.highlight}</strong>
                              </Tag>
                            )}
                          </Space>
                        </List.Item>
                      )}
                    />
                    <Alert
                      message="恭喜！"
                      description="会话启动后，您将看到一个功能强大的 AI 终端，支持全屏模式、多标签页、快捷键等特性。"
                      type="success"
                      showIcon
                      icon={<CheckCircleOutlined />}
                      style={{ marginTop: 12 }}
                    />
                  </div>
                )
              }
            ]}
          />

          <Divider />

          <Alert
            message="💡 快速提示"
            description={
              <div>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>支持配置多个 Provider 和多个 Token 实现负载均衡</li>
                  <li>Token 失效时系统会自动切换到下一个可用 Token</li>
                  <li>使用 <Tag>Ctrl+K</Tag> 快速打开命令面板</li>
                  <li>终端支持 <Tag>Ctrl+1/2/3</Tag> 切换标签页，<Tag>Ctrl+W</Tag> 关闭</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )
    },
    // Dashboard 仪表盘
    {
      id: 'dashboard',
      title: 'Dashboard 仪表盘',
      category: 'features',
      keywords: ['dashboard', '仪表盘', '主页', '数据可视化', '图表', '统计', '概览', 'overview'],
      content: (
        <div>
          <Title level={4}>Dashboard 数据可视化主页</Title>
          <Paragraph>
            Dashboard 是 LLMctl 的全新主页，提供系统运行状态的实时概览和数据可视化展示。通过直观的图表和统计信息，帮助您快速了解系统状态、会话趋势和资源使用情况。
          </Paragraph>

          <Title level={5}>快速操作卡片</Title>
          <Paragraph>
            Dashboard 顶部提供 4 个快速操作卡片，让您快速访问常用功能：
          </Paragraph>
          <List
            size="small"
            dataSource={[
              '创建会话 - 快速启动新的 AI 会话（需要先配置 Provider 和 Token）',
              '配置 Provider - 管理 AI 服务提供商配置',
              'MCP 服务器 - 管理 Model Context Protocol 服务器',
              '查看通知 - 查看系统通知和消息中心',
            ]}
            renderItem={(item: string) => <List.Item>{item}</List.Item>}
          />
          <Alert
            message="智能禁用状态"
            description="如果您还没有配置 Provider 和 Token，「创建会话」按钮会自动禁用。请先完成基础配置后再创建会话。"
            type="info"
            showIcon
            style={{ marginTop: 8, marginBottom: 16 }}
          />

          <Title level={5}>系统状态概览</Title>
          <Paragraph>
            实时显示系统关键指标，帮助您快速掌握系统运行状况：
          </Paragraph>
          <List
            size="small"
            dataSource={[
              '活跃会话 - 当前正在运行的会话数量',
              'Token 健康度 - 所有 Token 的健康状态百分比（带进度条可视化）',
              'Provider 统计 - 显示启用数/总数，快速了解配置情况',
              'MCP 服务器统计 - 显示启用数/总数，掌握扩展状态',
            ]}
            renderItem={(item: string) => <List.Item>{item}</List.Item>}
          />

          <Title level={5}>数据可视化图表</Title>

          <Title level={5} style={{ fontSize: 14, marginTop: 16 }}>会话时长趋势图</Title>
          <List
            size="small"
            dataSource={[
              '折线图展示最近会话的平均时长和数量趋势',
              '支持 7/30/90 天时间范围切换',
              '鼠标悬停查看详细数据（日期、平均时长、会话数）',
              '自适应图表高度，响应式设计',
            ]}
            renderItem={(item: string) => <List.Item>{item}</List.Item>}
          />

          <Title level={5} style={{ fontSize: 14, marginTop: 16 }}>Provider 使用统计图</Title>
          <List
            size="small"
            dataSource={[
              '柱状图展示每个 Provider 的会话数量统计',
              '支持 7/30/90 天时间范围切换',
              '柱体顶部显示具体数值（总会话数、活跃会话数）',
              'Tooltip 显示详细信息（Provider 名称、总会话数、活跃会话数、成功率）',
              '浅蓝色配色方案 (#4DA3FF)，视觉协调',
            ]}
            renderItem={(item: string) => <List.Item>{item}</List.Item>}
          />

          <Title level={5}>最近会话列表</Title>
          <Paragraph>
            显示所有会话（按创建时间降序），支持滚动查看，帮助您快速回顾和恢复工作：
          </Paragraph>
          <List
            size="small"
            dataSource={[
              '显示会话状态（活跃/未激活）、Provider 名称和工作目录',
              '支持快速打开终端，一键进入工作状态',
              '固定高度 400px，会话数量超出时自动显示滚动条',
              '操作按钮：「打开终端」 / 「查看全部」',
            ]}
            renderItem={(item: string) => <List.Item>{item}</List.Item>}
          />

          <Title level={5}>最近活动日志</Title>
          <Paragraph>
            基于 Redux 状态生成活动记录，实时显示系统操作历史：
          </Paragraph>
          <List
            size="small"
            dataSource={[
              '显示会话启动/终止、Provider 启用/禁用、Token 健康状态变化',
              '相对时间显示（刚刚、N分钟前、N小时前、N天前）',
              '彩色图标和标签，清晰的活动分类',
              'Timeline 时间线展示，操作历史清晰可追溯',
              '无需额外 API 请求，基于本地状态生成',
            ]}
            renderItem={(item: string) => <List.Item>{item}</List.Item>}
          />

          <Title level={5}>使用技巧</Title>
          <List
            size="small"
            dataSource={[
              '定期查看 Token 健康度，及时处理失效的 Token',
              '使用图表的时间范围切换功能，分析不同时间段的使用趋势',
              '通过最近活动日志追溯系统操作历史，排查问题',
              '点击「刷新数据」按钮可以强制重新加载所有数据',
              '最近会话列表可以快速访问常用项目，提升工作效率',
            ]}
            renderItem={(item: string) => <List.Item>{item}</List.Item>}
          />

          <Alert
            message="数据实时更新"
            description="Dashboard 数据基于 Redux 全局状态实时生成，会话、Token、Provider 的任何变化都会自动反映在 Dashboard 中，无需手动刷新。"
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )
    },
    {
      id: 'user-auth',
      title: '用户认证系统',
      category: 'features',
      keywords: ['认证', '登录', '注册', 'JWT', '安全', '邮箱验证'],
      content: (
        <div>
          <Title level={4}>用户认证与安全</Title>

          <Title level={5}>首次登录</Title>
          <Paragraph>
            1. 应用启动后显示登录页面<br />
            2. 或点击"注册"标签创建新账户（需要邮箱验证）<br />
            3. 登录成功后进入主应用
          </Paragraph>

          <Title level={5}>邮箱验证注册</Title>
          <Paragraph>
            系统支持通过邮箱验证码注册新账户：
          </Paragraph>
          <ul>
            <li>📧 <Text strong>支持邮箱</Text> - QQ邮箱（@qq.com）和163邮箱（@163.com）</li>
            <li>🔢 <Text strong>验证码</Text> - 6位数字验证码，5分钟有效期，一次性使用</li>
            <li>⏱️ <Text strong>防滥发</Text> - 60秒倒计时防止验证码滥发</li>
            <li>🔑 <Text strong>灵活登录</Text> - 支持用户名或邮箱地址登录</li>
            <li>🔓 <Text strong>忘记密码</Text> - 登录页面提供找回密码入口</li>
          </ul>

          <Title level={5}>安全特性</Title>
          <ul>
            <li>🔐 <Text strong>JWT认证</Text> - Access Token 24小时 + Refresh Token 7天</li>
            <li>🔑 <Text strong>BCrypt加密</Text> - 密码单向加密，永不明文存储</li>
            <li>🛡️ <Text strong>防暴力破解</Text> - 连续失败5次锁定30分钟</li>
            <li>👥 <Text strong>多用户隔离</Text> - 每个用户只能访问自己的数据</li>
            <li>📝 <Text strong>登录审计</Text> - 完整记录登录尝试日志</li>
            <li>🔄 <Text strong>自动刷新</Text> - Token即将过期时自动续期</li>
          </ul>

          <Title level={5}>常见问题</Title>
          <Paragraph>
            <Text strong>Q: 忘记密码怎么办？</Text><br />
            A: 登录页面点击"忘记密码？"链接，按提示联系管理员重置。
          </Paragraph>
          <Paragraph>
            <Text strong>Q: 为什么需要登录？</Text><br />
            A: 确保数据安全和用户隔离，防止未授权访问敏感配置。
          </Paragraph>
          <Paragraph>
            <Text strong>Q: 收不到验证码邮件？</Text><br />
            A: 检查邮箱地址是否正确、垃圾邮件箱、邮件服务器配置是否正常。
          </Paragraph>
        </div>
      )
    },
    {
      id: 'user-profile',
      title: '用户资料管理',
      category: 'features',
      keywords: ['资料', '头像', '密码', '邮箱', '个人信息'],
      content: (
        <div>
          <Title level={4}>个人信息管理</Title>

          <Title level={5}>访问个人资料</Title>
          <Paragraph>
            点击顶部导航栏右上角头像 → 选择"个人信息"菜单项进入资料管理页面。
          </Paragraph>

          <Title level={5}>功能特性</Title>
          <ul>
            <li>👤 <Text strong>个人信息编辑</Text> - 修改显示名称（昵称）、绑定/更新邮箱</li>
            <li>🖼️ <Text strong>头像上传</Text> - 支持JPG/PNG/GIF格式，2MB以内，实时预览</li>
            <li>🔑 <Text strong>密码修改</Text> - 邮箱验证码验证，三层安全检查</li>
            <li>📧 <Text strong>邮箱绑定</Text> - 绑定邮箱后可用于密码修改验证</li>
            <li>💾 <Text strong>实时更新</Text> - 修改后自动更新界面显示和本地存储</li>
          </ul>

          <Title level={5}>头像上传要求</Title>
          <ul>
            <li>支持格式：JPG、JPEG、PNG、GIF</li>
            <li>文件大小：最大2MB</li>
            <li>自动生成唯一文件名，防止覆盖</li>
            <li>上传后实时显示在导航栏</li>
          </ul>

          <Title level={5}>修改密码流程</Title>
          <Paragraph>
            1. <Text strong>绑定邮箱</Text> - 必须先在个人信息中绑定邮箱<br />
            2. <Text strong>发送验证码</Text> - 点击"修改密码"，输入已绑定的邮箱发送验证码<br />
            3. <Text strong>验证码验证</Text> - 输入6位验证码（5分钟有效期）<br />
            4. <Text strong>输入新密码</Text> - 设置新密码并确认<br />
            5. <Text strong>完成修改</Text> - 密码修改成功后自动跳转到登录页面
          </Paragraph>

          <Title level={5}>安全提示</Title>
          <Alert
            message="密码安全"
            description="密码采用BCrypt加密存储，修改密码需要邮箱验证码验证，确保账户安全。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )
    },
    {
      id: 'notifications',
      title: '通知系统',
      category: 'features',
      keywords: ['通知', '推送', 'SSE', '消息', '提醒'],
      content: (
        <div>
          <Title level={4}>实时通知系统</Title>

          <Title level={5}>通知功能</Title>
          <Paragraph>
            基于SSE (Server-Sent Events) 的实时通知推送系统：
          </Paragraph>
          <ul>
            <li>🔔 <Text strong>实时推送</Text> - 毫秒级消息推送，无需刷新</li>
            <li>📱 <Text strong>通知中心</Text> - 完整的通知列表管理界面</li>
            <li>🎯 <Text strong>智能分类</Text> - 系统、会话、统计、警告等类型</li>
            <li>⚡ <Text strong>优先级管理</Text> - 低、普通、高、紧急四个级别</li>
            <li>🔢 <Text strong>未读提示</Text> - 导航栏实时显示未读数量</li>
            <li>✅ <Text strong>批量操作</Text> - 批量标记已读、删除</li>
          </ul>

          <Title level={5}>通知类型</Title>
          <List
            size="small"
            dataSource={[
              { type: '系统通知', desc: '应用更新、系统维护等', icon: '💬' },
              { type: '会话提醒', desc: '会话启动、终止、状态变更', icon: '🖥️' },
              { type: '统计报告', desc: '使用统计、Token消耗报告', icon: '📊' },
              { type: '警告信息', desc: 'Token即将耗尽、配额预警', icon: '⚠️' },
              { type: '错误提醒', desc: 'API调用失败、连接异常', icon: '❌' }
            ]}
            renderItem={(item: { type: string; desc: string; icon: string }) => (
              <List.Item>
                <Space>
                  <Text>{item.icon}</Text>
                  <Text strong>{item.type}:</Text>
                  <Text>{item.desc}</Text>
                </Space>
              </List.Item>
            )}
          />

          <Title level={5}>使用技巧</Title>
          <Paragraph>
            • 点击导航栏通知图标快速查看未读消息<br />
            • 支持按类型和优先级过滤通知<br />
            • 重要通知可带跳转链接，直达相关页面<br />
            • 可在设置中配置桌面通知和声音提醒
          </Paragraph>
        </div>
      )
    },
    {
      id: 'providers',
      title: 'Provider 管理',
      category: 'features',
      keywords: ['provider', '服务商', '配置', 'claude code', 'codex', 'gemini', 'qoder'],
      content: (
        <div>
          <Title level={4}>Provider 配置指南</Title>

          <Title level={5}>支持的 Provider</Title>
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">Claude Code</Tag>
            <Tag color="green">Codex</Tag>
            <Tag color="purple">Gemini (Google)</Tag>
            <Tag color="orange">Qoder</Tag>
            <Tag color="red">自定义 Provider</Tag>
          </div>

          <Title level={5}>配置步骤</Title>
          <Paragraph>
            1. <Text strong>选择服务商：</Text>从下拉列表中选择您要使用的 LLM 服务商<br />
            2. <Text strong>填写配置：</Text>根据服务商要求填写 API 密钥、端点等信息<br />
            3. <Text strong>测试连接：</Text>点击 "Test" 按钮验证配置是否正确<br />
            4. <Text strong>启用/禁用：</Text>通过开关控制 Provider 的启用状态
          </Paragraph>

          <Alert
            message="✨ v2.2.0 新特性：Provider 配置分离架构"
            description={
              <div>
                <Paragraph>
                  全新的 Provider 配置架构，提升扩展性和维护性：
                </Paragraph>
                <ul>
                  <li>🏗️ <Text strong>一对多关系</Text> - 一个 Provider 可以支持多个 CLI 工具（Claude Code、Codex、Gemini、Qoder）</li>
                  <li>🎯 <Text strong>动态配置表单</Text> - 根据选中的 CLI 类型动态显示对应的配置项</li>
                  <li>📦 <Text strong>配置独立存储</Text> - CLI 专用配置与核心信息分离，灵活扩展</li>
                  <li>🔧 <Text strong>Codex 配置优化</Text> - 只需输入 config.toml，自动生成 auth.json 并注入 Token</li>
                  <li>🌍 <Text strong>项目专用配置</Text> - 通过 CODEX_HOME 环境变量支持项目独立配置，互不干扰</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

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

          <Title level={5}>安全特性</Title>
          <Paragraph>
            所有 Token 采用 <Text strong>AES-256-GCM</Text> 加密存储：
          </Paragraph>
          <ul>
            <li>🛡️ <Text strong>NSA级加密</Text> - NSA绝密信息级加密算法</li>
            <li>🔐 <Text strong>认证加密 (AEAD)</Text> - 同时保证机密性和完整性</li>
            <li>🎭 <Text strong>Token遮掩</Text> - 前端只显示前4位和后4位（如：sk-1****abcd）</li>
            <li>📝 <Text strong>日志脱敏</Text> - 日志中绝不记录明文Token</li>
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
      id: 'mcp-servers',
      title: 'MCP 服务器管理',
      category: 'features',
      keywords: ['mcp', 'model context protocol', '服务器', '扩展', '工具', '模板'],
      content: (
        <div>
          <Title level={4}>Model Context Protocol (MCP) 服务器管理 🚀</Title>

          <Alert
            message="✨ v2.2.4 MCP 服务器管理系统"
            description={
              <div>
                <Paragraph>
                  全新的 MCP 服务器管理系统，为 AI 工具提供强大的扩展能力：
                </Paragraph>
                <ul>
                  <li>📦 <Text strong>模板库</Text> - 内置 Filesystem、GitHub、Sequential Thinking 等多种 MCP 模板，一键创建</li>
                  <li>🎯 <Text strong>智能图标</Text> - 为每个 MCP 服务器选择专属图标，视觉化管理更直观</li>
                  <li>🔧 <Text strong>动态配置</Text> - 命令参数和环境变量可自由添加/删除，灵活配置</li>
                  <li>🎨 <Text strong>状态管理</Text> - 已启用服务器优先显示（绿色标签），未启用自动排到末尾（灰色标签）</li>
                  <li>⚡ <Text strong>实时排序</Text> - 启用/禁用操作后列表立即重排，无需刷新</li>
                  <li>🗑️ <Text strong>批量操作</Text> - 支持批量启用、批量禁用、批量删除</li>
                </ul>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Title level={5}>什么是 MCP？</Title>
          <Paragraph>
            Model Context Protocol (MCP) 是一个开放标准协议，允许 AI 助手（如 Claude Code、Codex 等）通过标准化的方式访问外部工具和数据源，极大扩展了 AI 的能力边界。
          </Paragraph>

          <Title level={5}>模板库</Title>
          <Paragraph>
            系统内置多种常用 MCP 模板，按类别分组：
          </Paragraph>
          <div style={{ marginBottom: 16 }}>
            <Tag color="orange">文件系统</Tag> - 访问本地文件和目录<br />
            <Tag color="blue">数据库</Tag> - 连接 MySQL、PostgreSQL 等数据库<br />
            <Tag color="green">API & 服务</Tag> - Reddit、GitHub 等第三方 API<br />
            <Tag color="purple">开发工具</Tag> - Sequential Thinking、API Tester 等
          </div>

          <Title level={5}>使用流程</Title>
          <Paragraph>
            <Text strong>方式一：从模板创建</Text><br />
            1. 点击 <Text strong>"模板库"</Text> 按钮<br />
            2. 浏览分类，选择合适的模板<br />
            3. 点击 <Text strong>"使用模板"</Text><br />
            4. 填写服务器名称、选择图标<br />
            5. 配置命令参数和环境变量（必填项已标红）<br />
            6. 点击 <Text strong>"创建 MCP 服务器"</Text>
          </Paragraph>

          <Paragraph>
            <Text strong>方式二：手动创建</Text><br />
            1. 点击 <Text strong>"新建服务器"</Text> 按钮<br />
            2. 填写名称、描述、选择图标<br />
            3. 选择类型（stdio / sse）<br />
            4. 配置启动命令（如 npx, node, python）<br />
            5. 添加命令参数和环境变量<br />
            6. 保存配置
          </Paragraph>

          <Title level={5}>状态管理</Title>
          <ul>
            <li><Tag color="success">已启用</Tag> - MCP 服务器已启用，会自动应用到所有会话</li>
            <li><Tag color="default">未启用</Tag> - MCP 服务器已禁用，不会被加载</li>
          </ul>
          <Paragraph>
            <Text type="secondary">
              ✨ 提示：已启用的 MCP 会自动排在列表顶部，点击"启用"或"禁用"按钮后列表会实时重排。
            </Text>
          </Paragraph>

          <Title level={5}>批量操作</Title>
          <Paragraph>
            选中多个 MCP 服务器后，可进行批量操作：
          </Paragraph>
          <ul>
            <li>✅ <Text strong>批量启用</Text> - 一键启用选中的所有 MCP 服务器</li>
            <li>⛔ <Text strong>批量禁用</Text> - 一键禁用选中的所有 MCP 服务器</li>
            <li>🗑️ <Text strong>批量删除</Text> - 一键删除选中的所有 MCP 服务器（需确认）</li>
          </ul>

          <Title level={5}>图标系统</Title>
          <Paragraph>
            为每个 MCP 服务器选择专属图标，提升管理效率：
          </Paragraph>
          <div style={{ marginBottom: 16 }}>
            文件夹 📁 | 数据库 💾 | GitHub 🔗 | 全局 🌍 | 云服务 ☁️ | 分支 🌿 |
            机器人 🤖 | 灯泡 💡 | 环境 🌏 | 文件 📄 | 硬盘 💿
          </div>

          <Title level={5}>配置提示</Title>
          <Alert
            message="环境变量安全"
            description="环境变量中包含 KEY、TOKEN、PASSWORD、SECRET 的字段会自动识别为敏感信息，使用密码输入框保护隐私。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />

          <Title level={5}>最佳实践</Title>
          <Paragraph>
            • 使用有意义的名称（如 my-filesystem）方便识别<br />
            • 为不同用途的 MCP 选择不同图标<br />
            • 定期检查并禁用不需要的 MCP 以提升性能<br />
            • 环境变量中的敏感信息会被自动加密存储<br />
            • 配置完成后需要在 Providers 页面关联到对应的 Provider
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
            • <Text keyboard>Ctrl+1/2/3</Text> - 快速切换终端标签页（最多支持9个标签）<br />
            • <Text keyboard>Ctrl+W</Text> - 快速关闭当前终端标签页<br />
            • <Text keyboard>Ctrl+C/V</Text> - 复制粘贴<br />
            • <Text keyboard>右键点击</Text> - 直接粘贴剪贴板内容<br />
            • <Text keyboard>Ctrl+滚轮</Text> - 调整字体大小（8px-30px）
          </Paragraph>

          <Title level={5}>高级功能</Title>
          <Paragraph>
            • <Text strong>手动切换Token：</Text>终端标签栏"切换 Token"按钮，支持手动触发Token切换<br />
            • <Text strong>外部终端：</Text>一键切换到系统原生终端（Windows CMD/macOS Terminal/Linux Terminal）<br />
            • <Text strong>自动执行命令：</Text>终端打开后自动执行会话配置的命令，无需手动输入
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
              { key: 'Ctrl+1/2/3', desc: '快速切换终端标签页（最多9个）' },
              { key: 'Ctrl+W', desc: '快速关闭当前终端' },
              { key: 'Ctrl+C', desc: '复制' },
              { key: 'Ctrl+V', desc: '粘贴' },
              { key: '右键点击', desc: '直接粘贴剪贴板内容' },
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

          <Title level={5}>认证问题</Title>
          <Paragraph>
            <Text strong>Q: 登录失败怎么办？</Text><br />
            A: 检查用户名密码是否正确，连续失败5次账户会被锁定30分钟。
          </Paragraph>
          <Paragraph>
            <Text strong>Q: Token过期怎么办？</Text><br />
            A: 系统会自动刷新Token，无需手动操作。如遇问题请重新登录。
          </Paragraph>

          <Title level={5}>通知问题</Title>
          <Paragraph>
            <Text strong>Q: 收不到通知？</Text><br />
            A: 检查网络连接，确认SSE连接状态，查看通知设置是否开启。
          </Paragraph>
          <Paragraph>
            <Text strong>Q: 通知不显示？</Text><br />
            A: 刷新页面或重启应用，检查浏览器是否支持SSE功能。
          </Paragraph>

          <Title level={5}>配置问题</Title>
          <Paragraph>
            <Text strong>Q: 配置丢失？</Text><br />
            A: 检查应用数据目录权限，定期导出配置备份。
          </Paragraph>
          <Paragraph>
            <Text strong>Q: 数据库连接失败？</Text><br />
            A: 确认MySQL服务运行正常，数据库用户权限配置正确。
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
            当前版本：v2.3.0<br />
            更新日期：2025年11月<br />
            开发团队：Liu Yifan
          </Paragraph>

          <Title level={5}>功能特性</Title>
          <ul>
            <li>🔐 用户认证系统 - JWT认证、BCrypt加密、邮箱验证注册、多用户数据隔离</li>
            <li>👤 用户资料管理 - 个人信息编辑、头像上传、密码修改、邮箱绑定</li>
            <li>🔔 实时通知系统 - SSE推送、通知中心、优先级管理</li>
            <li>🎯 多 Provider 支持 - Claude Code、Codex、Gemini、Qoder 等</li>
            <li>🏗️ <Text strong>Provider配置分离架构 (v2.2.0)</Text> - 一对多关系、动态配置表单、项目专用配置</li>
            <li>🚀 <Text strong>MCP 服务器管理 (v2.2.4)</Text> - 模板库、智能图标、动态配置、实时排序、批量操作</li>
            <li>🔑 智能 Token 管理 - 多种轮询策略，自动故障切换，手动切换Token</li>
            <li>🛡️ 企业级加密 - AES-256-GCM加密存储Token</li>
            <li>💻 强大终端功能 - 多标签页、全屏模式、字体缩放、快捷键、外部终端</li>
            <li>⌨️ 终端快捷键 - Ctrl+1/2/3切换标签、Ctrl+W关闭、右键粘贴</li>
            <li>🌐 国际化支持 - 中英文双语界面</li>
            <li>📊 会话管理 - 实时监控、状态管理、自动重启</li>
            <li>🔧 配置管理 - 导入导出、备份恢复</li>
            <li>📖 帮助中心 - 完整的应用内帮助文档</li>
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
              <Button
                type="link"
                icon={<GithubOutlined />}
                block
                onClick={() => window.open('https://github.com/3202336152/llmctl-desktop', '_blank')}
              >
                GitHub 项目
              </Button>
              <Button
                type="link"
                icon={<MessageOutlined />}
                block
                onClick={() => window.open('https://github.com/3202336152/llmctl-desktop/issues', '_blank')}
              >
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