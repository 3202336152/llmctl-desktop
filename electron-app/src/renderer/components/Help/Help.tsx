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

          <Title level={5}>第一步：用户登录</Title>
          <Paragraph>
            1. 应用启动后显示登录页面<br />
            2. 或点击"注册"创建新账户<br />
            3. 登录成功后进入主应用
          </Paragraph>

          <Title level={5}>第二步：添加 Provider</Title>
          <Paragraph>
            1. 点击左侧菜单的 <Text strong>Providers</Text><br />
            2. 点击 <Text strong>"Add Provider"</Text> 按钮<br />
            3. 选择您要使用的 LLM 服务商（如 Claude、OpenAI、Qwen 等）<br />
            4. 填写相应的 API 配置信息<br />
            5. 点击 <Text strong>"Test"</Text> 验证配置<br />
            6. 保存配置
          </Paragraph>

          <Title level={5}>第三步：添加 API Keys</Title>
          <Paragraph>
            1. 点击左侧菜单的 <Text strong>API Keys</Text><br />
            2. 点击 <Text strong>"Add Token"</Text> 按钮<br />
            3. 输入您的 API Key（会被加密存储）<br />
            4. 选择对应的 Provider 和轮询策略<br />
            5. 保存配置
          </Paragraph>

          <Title level={5}>第四步：创建会话</Title>
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
            2. 使用默认管理员账户登录：
            <ul>
              <li>用户名：<Text code>admin</Text></li>
              <li>密码：<Text code>admin123</Text></li>
            </ul>
            3. 或点击"注册"标签创建新账户（需要邮箱验证）<br />
            4. 登录成功后进入主应用
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
            当前版本：v2.1.5<br />
            更新日期：2025年10月<br />
            开发团队：LLMctl Team
          </Paragraph>

          <Title level={5}>功能特性</Title>
          <ul>
            <li>🔐 用户认证系统 - JWT认证、BCrypt加密、邮箱验证注册、多用户数据隔离</li>
            <li>👤 用户资料管理 - 个人信息编辑、头像上传、密码修改、邮箱绑定</li>
            <li>🔔 实时通知系统 - SSE推送、通知中心、优先级管理</li>
            <li>🎯 多 Provider 支持 - Claude Code、Codex、Gemini、Qoder 等</li>
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