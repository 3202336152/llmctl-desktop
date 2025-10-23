<div align="center">

# LLMctl
**强大的LLM Provider、Token和会话管理桌面应用**

[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](https://github.com/3202336152/llmctl-desktop/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/3202336152/llmctl-desktop)

</div>

---

## ✨ 特性

### 核心功能

- 🔐 **用户认证系统** - 用户名+密码登录，邮箱验证注册，JWT Token认证（v2.1.2）
- 👤 **用户资料管理** - 个人信息编辑，头像上传，密码修改，邮箱绑定（v2.1.4）
- 📧 **邮箱验证功能** - QQ/163邮箱验证码注册，支持用户名或邮箱登录（v2.1.2）
- 🔔 **实时通知系统** - 基于SSE的实时推送，通知中心管理，优先级分类（v2.1.0）
- 🌐 **多Provider支持** - 支持Claude Code、Codex、Gemini、Qoder等主流CLI工具
- 🏗️ **配置分离架构** - Provider核心信息与CLI专用配置分离存储，支持一对多关系（v2.2.0）
- 🔑 **智能Token管理** - 多Token轮询、健康检查、自动切换
- 🔒 **企业级加密** - AES-256-GCM加密存储Token，NSA绝密信息级安全（v2.0.4）
- 🔄 **自动故障恢复** - Token失效自动检测，一键切换到健康Token（v2.0.2）
- 🖥️ **会话管理** - CLI进程监控、工作目录记录、实时状态更新、会话重启（v2.0.3）
- 🌍 **国际化支持** - 支持中英文切换，语言配置持久化（v2.0.3）
- 📊 **统计分析** - 详细的使用统计和数据可视化
- ⚙️ **配置管理** - 支持导入导出配置，方便迁移和备份
- 📖 **帮助中心** - 完整的使用文档和常见问题解答（v2.1.0）

### 终端功能

- 🪟 **多终端并发** - 同时打开多个终端窗口，在不同目录和项目中并行工作
- ⌨️ **快捷键支持** - `Ctrl+1/2/3` 快速切换标签页，`Ctrl+W` 关闭终端（v2.1.3）
- 📋 **复制粘贴支持** - 完整的终端复制粘贴功能，支持右键粘贴（v2.1.3）
- 🏷️ **标签页管理** - 便捷的终端标签页切换和管理
- 🔄 **手动切换Token** - 终端标签栏一键手动切换Token，适用于自动检测未捕获的错误（v2.1.3）
- 🖥️ **外部终端支持** - 一键切换到系统原生终端（Windows CMD/macOS Terminal/Linux Terminal）（v2.1.3）
- 📺 **全屏显示** - 支持F11/ESC快捷键切换全屏，专注终端操作（v2.0.3）
- 🔤 **字体缩放** - Ctrl+滚轮动态调整字体大小（8-30px）（v2.0.3）
- 🚀 **自动执行命令** - 终端打开后自动执行会话配置的命令，无需手动输入（v2.1.1）
- 💾 **状态保持** - 切换菜单后终端内容完整保留，不会重新加载（v2.1.1）
- ⚡ **高性能** - Electron本地执行，响应时间<10ms

### 安全特性

#### 用户认证（v2.1.0, 增强 v2.1.2）
- 🔐 **JWT认证** - 基于JWT Token的无状态认证机制
- 👤 **强制登录** - 应用启动必须登录，未登录无法访问任何功能
- 🔑 **BCrypt加密** - 密码采用BCrypt单向加密存储，永不明文
- 📧 **邮箱验证注册** - 支持QQ/163邮箱验证码注册，提升账户安全性（v2.1.2）
- 🔓 **多种登录方式** - 支持用户名或邮箱地址登录（v2.1.2）
- 🛡️ **防暴力破解** - 连续失败5次锁定账户30分钟
- 🔄 **自动刷新** - Token即将过期时自动刷新，无感知续期
- 📝 **登录审计** - 记录所有登录尝试（成功/失败/锁定），追溯攻击
- 👥 **多用户隔离** - 每个用户只能访问自己的Provider、Token和会话

#### Token加密（v2.0.4）
- 🔐 **AES-256-GCM加密** - Token采用NSA绝密信息级加密算法存储
- 🛡️ **认证加密 (AEAD)** - 同时保证数据机密性和完整性，防篡改
- 🔑 **密钥管理** - 支持环境变量、配置文件、自动生成三种密钥管理方式
- 🔄 **自动数据迁移** - 应用启动时自动检测并加密明文Token
- 🎭 **Token遮掩显示** - 前端只显示前4位和后4位（如：`sk-1****abcd`）
- 📝 **日志脱敏** - 日志中绝不记录明文Token，保护敏感信息

### 智能容错（v2.0.2）

- 🔍 **实时错误检测** - 自动监控终端输出，识别Token错误
- ⚠️ **自动状态标记** - Token失效时自动标记为不健康状态
- 🔄 **无缝重启** - 一键重启会话，自动切换到健康Token
- 🗑️ **智能清理** - 自动删除失效会话，保持数据库整洁

---

## 📦 快速开始

### 系统要求

- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 20.04+
- **内存**: 4GB RAM（推荐8GB）
- **磁盘空间**: 500MB可用空间
- **数据库**: MySQL 8.x

### 安装步骤

1. **下载安装包**
   - [Windows (exe)](https://github.com/3202336152/llmctl-desktop/releases)
   - [macOS (dmg)](https://github.com/3202336152/llmctl-desktop/releases)
   - [Linux (AppImage)](https://github.com/3202336152/llmctl-desktop/releases)

2. **启动应用**
   - 运行安装的LLMctl应用
   - 首次启动会自动初始化数据库表结构

### 基础配置

1. **创建Provider**
   - 点击"Providers" → "创建Provider"
   - 填写Provider信息（名称、类型、API URL等）
   - 添加至少一个Token

2. **启动会话**
   - 点击"Sessions" → "启动会话"
   - 选择Provider和工作目录
   - 系统自动选择Token并启动终端

3. **查看通知**
   - 点击顶部导航栏的通知图标（🔔）查看未读通知
   - 进入"Notifications"页面管理所有通知
   - 支持按类型、优先级过滤，支持搜索
   - 可批量标记已读或删除

4. **获取帮助**
   - 点击顶部导航栏的"Help"按钮
   - 查看完整的使用指南和常见问题
   - 支持中英文切换

详细使用说明请参考 [用户手册](docs/USER_GUIDE.md)

---

## 🎯 核心功能

### 用户认证系统

完善的用户登录认证系统，确保数据安全和用户隔离：

```
应用启动 → 登录页面（强制）
   ↓
用户名 + 密码登录 / 注册新账户
   ↓
JWT Token生成（Access Token 24h + Refresh Token 7天）
   ↓
进入主应用（所有数据与当前用户关联）
   ↓
所有请求自动携带Token → 后端验证 → 返回用户数据
```

**核心特性**：
- ✅ **强制登录** - 未登录无法访问任何功能
- ✅ **用户隔离** - 每个用户只能看到自己的Provider、Token和会话
- ✅ **安全存储** - 密码BCrypt加密，Token本地加密存储
- ✅ **自动刷新** - Token即将过期时自动续期
- ✅ **防暴力破解** - 连续失败5次锁定30分钟
- ✅ **登录审计** - 完整的登录日志记录

详细设计请参考 [用户认证系统设计文档](docs/user-authentication-system.md)

### 用户资料管理

完整的个人信息管理功能，让用户自主管理账户信息：

```
个人信息菜单 → 查看/编辑资料
   ↓
修改显示名称 → 实时更新界面
   ↓
绑定/更新邮箱 → 用于密码找回
   ↓
上传头像 → 2MB以内图片，实时预览
   ↓
修改密码 → 邮箱验证码验证 → BCrypt加密存储
```

**核心特性**：
- ✅ **个人信息编辑** - 修改显示名称、绑定邮箱
- ✅ **头像上传** - 支持JPG/PNG/GIF格式，2MB限制，实时预览
- ✅ **密码修改** - 邮箱验证码验证，三层安全检查
- ✅ **跨平台存储** - Windows开发/Linux生产环境自动适配
- ✅ **安全验证** - 文件类型白名单，大小限制，路径安全
- ✅ **实时更新** - 修改后自动更新本地存储和界面显示

**头像上传配置**：
- 开发环境：`uploads/avatars/`（项目相对路径）
- 生产环境：通过环境变量 `AVATAR_UPLOAD_PATH` 和 `AVATAR_BASE_URL` 配置
- 支持的格式：JPG、JPEG、PNG、GIF
- 文件大小限制：2MB

**密码修改流程**：
1. 用户必须先绑定邮箱
2. 输入邮箱并发送验证码（5分钟有效期）
3. 输入验证码和新密码
4. 系统验证：邮箱一致性 → 验证码有效性 → 密码强度
5. BCrypt加密存储新密码

### 实时通知系统

企业级实时通知系统，让您不错过任何重要信息：

```
系统事件 → 后端生成通知 → SSE实时推送 → 前端实时显示
   ↓
通知中心管理 → 已读/未读 → 优先级分类 → 批量操作
```

**核心特性**：
- 🔔 **实时推送** - 基于SSE (Server-Sent Events) 的长连接推送
- 📱 **通知中心** - 完整的通知列表界面，支持分页、过滤、搜索
- 🎯 **智能分类** - 系统通知、会话提醒、统计报告、警告、错误等类型
- ⚡ **优先级管理** - 低、普通、高、紧急四个优先级，差异化显示
- 🔢 **未读提示** - 导航栏实时显示未读数量，一目了然
- ✅ **批量操作** - 支持批量标记已读、批量删除、全选/取消
- 🔗 **快捷跳转** - 通知可带跳转链接，直达相关页面
- 🌐 **多语言** - 完整的中英文翻译支持

**通知类型支持**：
- 💬 **系统通知** - 应用更新、系统维护等
- 🖥️ **会话提醒** - 会话启动、终止、状态变更
- 📊 **统计报告** - 定期使用统计、Token消耗报告
- ⚠️ **警告信息** - Token即将耗尽、配额预警
- ❌ **错误提醒** - API调用失败、连接异常

**技术亮点**：
- JWT Token认证的SSE连接，安全可靠
- 自动断线重连，连接状态实时显示
- 通知持久化存储，不会丢失
- 优雅的进入/删除动画效果

### 帮助中心

完整的应用内帮助文档，随时随地获取帮助：

**功能特性**：
- 📖 **使用指南** - 详细的功能介绍和操作步骤
- ❓ **常见问题** - 涵盖使用中的常见疑问
- 🔧 **故障排查** - 快速定位和解决问题
- 🎯 **快速入门** - 新手友好的上手教程
- 🔍 **搜索功能** - 快速查找所需内容
- 🌐 **多语言** - 中英文文档同步更新

**主要内容**：
- Provider配置教程
- Token轮询策略说明
- 会话管理最佳实践
- 终端使用技巧
- 快捷键一览表
- 安全配置建议
- 错误代码对照表

通过顶部导航栏的"Help"按钮即可访问帮助中心。

### 智能Token切换

当Token失效时，LLMctl会自动检测并引导您切换到健康的Token：

```
1. Token失效（余额不足、认证失败等）
   ↓
2. 系统自动检测错误并标记Token为不健康
   ↓
3. 弹窗提示：Token已失效，是否重启会话？
   ↓
4. 一键重启：
   - 删除旧会话
   - 创建新会话（使用健康Token）
   - 自动打开终端
   ↓
5. 无缝继续工作 ✅
```

**支持的错误检测**：
- Credit balance too low
- Rate limit exceeded
- 401/403 Authentication errors
- Invalid API key
- 更多...

### Token安全管理

#### 加密存储

所有Token采用**AES-256-GCM**加密算法存储，确保即使数据库泄露，攻击者也无法获取明文Token：

```
明文Token:  sk-ant-api03-abc123def456...
  ↓ 加密
加密Token:  AES-256-GCM$v1$rZ3k9mN2pQ4t$8aF5hW2dC9eB7mN1oU6pV3s...
  ↓ 存储到数据库
数据库:     只存储加密后的值
  ↓ 使用时
应用:       自动解密为明文使用
```

**密钥管理**（优先级从高到低）：
1. 环境变量 `LLMCTL_MASTER_KEY`
2. 配置文件 `~/.llmctl/master.key`
3. 首次启动自动生成

详细配置请参考 [加密配置指南](docs/encryption-guide.md)

#### Token轮询策略

支持4种智能轮询策略：

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **Round Robin** | 按顺序轮询 | Token性能相近 |
| **Weighted** | 按权重随机选择 | Token有配额等级差异 |
| **Random** | 完全随机选择 | 简单负载分散 |
| **Least Used** | 选择最少使用的 | 最大化Token利用率 |

### 多终端并发

同时管理多个会话和终端：

```
会话1: /project/frontend  →  终端1 (Claude Opus)
会话2: /project/backend   →  终端2 (Claude Sonnet)
会话3: /project/docs      →  终端3 (Claude Haiku)
```

每个终端：
- ✅ 独立的工作目录和环境变量
- ✅ 支持完整的终端交互
- ✅ 支持复制粘贴（Ctrl+C / Ctrl+V）
- ✅ 全屏模式（F11切换，ESC退出）（v2.0.3）
- ✅ 动态字体调整（Ctrl+滚轮缩放）（v2.0.3）
- ✅ 自动执行命令（打开即用）（v2.1.1）
- ✅ 状态完整保留（切换菜单不重置）（v2.1.1）
- ✅ 可以独立打开和关闭

### 终端全屏模式

专注的终端操作体验：

```
快捷键：
- F11         → 切换全屏/正常模式
- ESC         → 退出全屏
- 点击按钮     → 手动切换

全屏效果：
- 隐藏侧边栏和导航栏
- 终端占据整个窗口
- 类似本地终端的沉浸式体验
```

### 字体动态调整

根据需要灵活调整终端字体：

```
操作方式：
- Ctrl + 向上滚动  → 字体放大（最大30px）
- Ctrl + 向下滚动  → 字体缩小（最小8px）

默认字体：16px
范围：8px - 30px
自动同步：字体变化自动调整终端尺寸
```

---

## 🏗️ 技术架构

### 技术栈

**前端**
- Electron 26.x
- React 18
- TypeScript
- Ant Design 5.x
- Redux Toolkit
- xterm.js + node-pty

**后端**
- Spring Boot 3.1.5
- MyBatis 3.0.2
- MySQL 8.x
- Lombok

### 项目结构

```
LLMctl/
├── electron-app/           # Electron前端应用
│   ├── src/
│   │   ├── main/          # Electron主进程
│   │   ├── renderer/      # React渲染进程
│   │   │   ├── components/
│   │   │   │   ├── Notifications/  # 通知系统组件
│   │   │   │   ├── Provider/
│   │   │   │   ├── Token/
│   │   │   │   ├── Session/
│   │   │   │   └── ...
│   │   │   ├── store/
│   │   │   │   └── slices/
│   │   │   │       └── notificationSlice.ts  # 通知状态管理
│   │   │   ├── hooks/
│   │   │   │   └── useNotifications.ts       # 通知Hook
│   │   │   └── utils/
│   │   │       └── notificationHelper.ts     # 通知辅助工具
│   │   └── preload/       # 预加载脚本
│   └── package.json
├── src/                   # Spring Boot后端
│   ├── main/
│   │   ├── java/
│   │   │   └── com/llmctl/
│   │   │       ├── controller/
│   │   │       │   ├── NotificationController.java  # 通知API
│   │   │       │   └── SseController.java           # SSE推送
│   │   │       ├── service/
│   │   │       │   ├── NotificationService.java
│   │   │       │   ├── NotificationPublisher.java
│   │   │       │   └── SseConnectionManager.java
│   │   │       ├── mapper/
│   │   │       │   └── NotificationMapper.java
│   │   │       ├── entity/
│   │   │       │   └── Notification.java
│   │   │       └── dto/
│   │   │           ├── NotificationRequest.java
│   │   │           └── NotificationResponse.java
│   │   └── resources/
│   │       └── mapper/    # MyBatis XML
│   │           └── NotificationMapper.xml
│   └── test/
├── docs/                  # 文档
│   ├── USER_GUIDE.md
│   ├── DEVELOPMENT.md
│   ├── API_DOCUMENTATION.md
│   └── user-authentication-system.md  # 认证系统设计
└── README.md
```

---

## 📚 文档

- [用户手册](docs/USER_GUIDE.md) - 完整的使用指南
- [开发文档](docs/DEVELOPMENT.md) - 开发者指南
- [用户认证系统设计](docs/user-authentication-system.md) - 完整的认证系统设计文档
- [加密配置指南](docs/encryption-guide.md) - Jasypt与AES-256-GCM加密详解
- [API文档](docs/api-documentation.md) - 后端API说明
- [架构设计](docs/refactor-architecture.md) - 系统架构设计
- [数据库设计](docs/database-schema.md) - 数据库表结构
- [更新日志](CHANGELOG.md) - 版本更新记录

---

## 🔄 最新更新

### v2.2.0 (2025-10-23) 🎉

#### 🏗️ 重大架构升级
- ✅ **Provider 配置分离架构** - 提升扩展性和维护性
  - **数据库表结构变更**：
    - `providers` 表简化：只保留核心字段（id、name、description、types、策略配置等）
    - 新增 `provider_configs` 表：存储 CLI 专用配置，支持一对多关系
    - 使用 JSON 字段存储配置数据，灵活支持不同 CLI 的配置结构
  - **后端实现**：
    - 新增 `ProviderConfig.java` 实体类，支持 CliType 枚举（claude code、codex、gemini、qoder）
    - 新增自定义 MyBatis TypeHandler 处理带空格的枚举值
    - Service 层使用 `@Transactional` 处理 Provider 和配置的级联创建/更新
  - **前端实现**：
    - 更新 TypeScript 类型定义，添加 `ProviderConfig` 接口
    - 重写 `ProviderManager.tsx` 表单提交逻辑，动态构建配置数据
    - 表格显示优化，展示所有配置的 CLI 类型

#### 🎯 Codex 配置优化
- ✅ **简化配置输入**：
  - 前端只需输入 config.toml 内容
  - 后端自动生成 auth.json 模板并注入 API Token
  - 添加 `CODEX_HOME` 环境变量支持，指向项目 `.codex` 目录
  - 修复 Codex CLI 读取系统配置而不是项目配置的问题

#### 🐛 Bug修复
- ✅ **修复 Redux sessionId 不匹配导致的 404 错误**
  - 问题：后端创建新会话但前端尝试访问旧的 sessionId
  - 解决：`setSessions` action 添加自动清理逻辑，过滤无效的 sessionId
  - 涉及：`sessionSlice.ts`、`TerminalComponent.tsx`、`SessionServiceImpl.java`
- ✅ **修复 Codex CLI 读取配置路径问题**
  - 添加 `CODEX_HOME` 环境变量，指向项目 `.codex` 目录
  - 每个项目使用独立的 Codex 配置，互不干扰
- ✅ **修复 Provider 编辑时 Claude Code 配置不显示**
  - 修正 TypeScript `CliType` 类型定义错误（`'claude'` → `'claude code'`）

#### 🎨 UI/UX 优化
- ✅ **Provider 表单优化**：
  - 类型选择改为 Select 下拉多选框，提升用户体验
  - 根据选中类型动态显示对应的配置表单
  - Gemini 和 Qoder 配置显示"暂未适配"提示

#### 🏗️ 技术亮点
- **数据库设计**：单一职责原则，providers 表只管理核心信息，配置独立存储
- **开闭原则**：新增 CLI 类型无需修改表结构，只需插入新配置
- **依赖倒置**：Service 层依赖抽象的配置接口，而不是具体字段
- **优势对比**：
  | 特性 | 旧方案 | 新方案 |
  |------|--------|--------|
  | 扩展性 | ❌ 每增加 CLI 需要 ALTER TABLE | ✅ 只需插入新记录 |
  | 表结构 | ❌ 字段冗余（10+ 个 CLI 专用字段） | ✅ 核心表只有 8 个字段 |
  | 维护性 | ❌ 字段语义混乱 | ✅ 职责清晰 |
  | 配置灵活性 | ❌ 字段固定 | ✅ JSON 灵活配置 |

#### ⚠️ 破坏性变更
- **数据库结构变更**：必须执行迁移脚本 `migration_v2.3.0_split_configs.sql`
- **API 接口变更**：Provider 创建/更新接口的请求体结构变化
- **前端类型定义变更**：Provider 接口新增 `configs` 字段，移除 CLI 专用字段

#### 📖 文档更新
- ✅ 新增完整的架构文档：`docs/provider-config-separation-guide.md`
  - 架构设计说明
  - 数据库表结构设计
  - 后端实现指南
  - 前端实现指南
  - 数据迁移步骤
  - FAQ 和最佳实践

### v2.1.7 (2025-10-17)

#### 🎉 新功能
- ✅ **暗色主题功能** - 完整的深色模式支持
  - 完整的暗色配色方案（背景色、文字、边框、阴影）
  - 所有组件的暗色样式覆盖（Layout、Card、Table、Input、Modal等）
  - 在设置页面自由选择亮色/暗色主题
  - 实时切换无需重启应用
  - 主题偏好自动保存并跨设备同步

#### 🎨 用户体验优化
- ✅ **视觉舒适性提升**
  - 夜间模式保护眼睛，减少蓝光刺激
  - 暗色背景降低屏幕亮度
  - 文字对比度适中，易于阅读
- ✅ **个性化定制**
  - 用户自由选择喜欢的主题
  - 满足不同场景使用需求

#### 🔧 技术实现
- 完整的darkTheme配置（80+配置项）
- 动态主题切换机制
- settings-changed事件实时更新
- ConfigProvider动态传递主题

#### 🔄 向后兼容
- 未设置主题的用户默认使用亮色主题
- 不影响现有用户配置
- 平滑升级无需手动调整

### v2.1.6 (2025-10-17)

#### 🎉 新功能
- ✅ **会话表格优化** - 全面提升 Sessions 页面用户体验
  - **会话名称优化**：显示格式改为 `Provider名 - 项目名 #序号`，自动从工作目录提取项目名
  - **时间信息增强**：相对时间显示（刚刚、N分钟前、N小时前等）+ 持续时间计算
  - **工作目录优化**：显示格式 `项目名 (路径层级)`，智能路径提示
  - **表格列优化**：删除冗余列（Provider、命令），合并时间列，更紧凑的布局
- ✅ **快捷操作功能** - 便捷的会话管理
  - **右键菜单**：打开终端/重新启动、复制会话ID、复制工作目录、在文件管理器中打开、终止/删除会话
  - **双击打开终端**：双击任意会话行即可打开终端
- ✅ **命令选择优化** - 更安全的命令输入
  - 将命令输入框改为下拉选择框，提供 4 个 CLI 命令选项（claude、codex、gemini、qoder）
  - 添加必填验证，确保用户必须选择命令
- ✅ **刷新按钮** - 手动刷新会话列表

#### 🐛 Bug修复
- ✅ **修复右键菜单"在文件管理器中打开"报错**
  - 问题：使用 `openExternal` 打开文件夹在 Windows 上失败
  - 原因：`openExternal` 不支持 `file://` 协议打开本地文件夹
  - 修复：使用 Electron 的 `shell.openPath()` API（跨平台支持）

#### 🎨 用户体验优化
- ✅ **信息浏览效率提升**：会话名称更有意义，快速识别项目和序号
- ✅ **操作便捷性提升**：右键菜单集成常用操作，双击打开终端，下拉选择命令
- ✅ **视觉体验优化**：表格布局更紧凑，Tooltip 提供详细信息，保持界面简洁

### v2.1.5 (2025-10-16)

#### 🎉 新功能
- ✅ **外部终端环境变量传递功能** - 完整的配置同步体验
  - **环境变量自动获取**：外部终端打开时自动获取当前会话的环境变量
  - **跨平台环境变量注入**：Windows/macOS/Linux 平台适配，自动转义特殊字符
  - **错误容错机制**：获取环境变量失败时仍能正常打开外部终端

#### 🎨 优化改进
- ✅ **终端重启逻辑优化** - 彻底解决黑屏和卡死问题
  - **根本原因修复**：重新激活会话时删除旧会话记录，创建全新会话
  - **用户体验提升**：重启后终端界面正常显示，无黑屏，响应正常

### v2.1.4 (2025-10-16)

#### 🎉 新功能
- ✅ **用户资料管理功能** - 完整的个人信息编辑和头像上传
  - **个人信息编辑**：修改显示名称、绑定/更新邮箱
  - **头像上传**：支持 JPG/PNG/GIF 格式，2MB 限制，实时预览
  - **密码修改**：邮箱验证码验证，三层安全检查
  - **跨平台支持**：Windows 开发环境和 Linux 生产环境自动适配

#### 🎨 优化改进
- ✅ **登录响应优化** - 返回完整用户信息
  - `LoginResponse` 新增 `email` 和 `avatarUrl` 字段
  - 登录和刷新Token接口同步返回用户资料
  - 前端自动保存到本地存储
- ✅ **静态资源配置** - 支持头像文件HTTP访问
  - 开发环境：`/uploads/**` 映射到项目目录
  - 生产环境：通过环境变量配置绝对路径
  - 公开访问，无需JWT认证

#### 🐛 Bug修复
- ✅ 修复 Authorization Header 缺失问题（精确控制公开接口白名单）
- ✅ 修复邮箱不显示问题（后端返回完整用户信息）
- ✅ 修复验证码用途验证失败（添加 `CHANGE_PASSWORD` 枚举）
- ✅ 修复文件上传路径问题（跨平台路径处理）

#### 🔐 安全增强
- ✅ 文件类型白名单验证，文件大小限制
- ✅ 密码修改邮箱验证码验证（5分钟有效期）
- ✅ JWT Token验证覆盖所有需要认证的接口

#### 🚀 部署配置
- ✅ 新增环境变量：`AVATAR_UPLOAD_PATH` 和 `AVATAR_BASE_URL`
  - 开发环境默认：`uploads/avatars/` 和 `http://localhost:8080/llmctl/uploads/`
  - 生产环境：`/var/www/llmctl/downloads/llmctl/images/avatar/` 和 `http://117.72.200.2/downloads/llmctl/images/avatar/`
- ✅ 数据库迁移：新增 `CHANGE_PASSWORD` 验证码用途

### v2.1.3 (2025-10-15)

#### 🎯 终端功能增强
- ✅ **快捷键支持** - 提升终端操作效率
  - `Ctrl+1/2/3` 快速切换终端标签页（最多支持9个标签）
  - `Ctrl+W` 快速关闭当前终端
  - 仅在 Terminals 页面生效，不干扰其他页面
- ✅ **右键粘贴功能** - 增强粘贴体验
  - 在终端区域右键直接粘贴剪贴板内容
  - 支持多行文本粘贴
  - 自动读取系统剪贴板
- ✅ **手动切换Token按钮** - 灵活的Token管理
  - 终端标签栏新增"切换 Token"按钮
  - 支持手动触发Token切换（不依赖自动错误检测）
  - 切换时自动标记当前Token为不健康
  - 重启会话并使用新Token
  - 适用于自动检测未捕获的错误场景
- ✅ **切换到外部终端功能** - 支持系统原生终端
  - 终端标签栏新增"外部终端"按钮
  - 一键切换到系统外部终端（Windows CMD/macOS Terminal/Linux Terminal）
  - 自动切换到会话工作目录
  - 自动执行会话命令（如 `claude`）
  - 关闭内置终端，会话状态更新为非活跃
  - **跨平台支持**：Windows、macOS、Linux
  - **详细用户提示**：明确告知外部终端限制和状态管理

#### 🎨 优化改进
- ✅ **优化粘贴逻辑** - 更好的 Windows CMD 兼容性
  - 使用 xterm.js 原生 `paste()` 方法
  - 保留 CMD 的 `[Pasted text #N +X lines]` 提示
  - 确保粘贴内容完整，无截断
  - 移除分块发送逻辑，避免内容碎片化
- ✅ **外部终端确认对话框优化**
  - 添加详细的警告提示
  - 说明会话状态变化和限制
  - 引导用户正确使用外部终端功能

#### 🐛 Bug修复
- ✅ 修复粘贴内容截断问题（移除调试日志，保持控制台简洁）
- ✅ 解决大文本粘贴时内容不完整的问题
- ✅ 修复粘贴时出现碎片（如 `rit`, `IOUt。`）的问题
- ✅ 修复 MyBatis 参数映射错误

#### ⚠️ 已知限制
- **外部终端状态检测限制**：
  - 系统无法自动检测外部终端是否关闭
  - 用户需手动管理外部终端的生命周期
  - 外部终端关闭后，需手动重新创建会话
  - 技术原因：外部终端是独立进程，受操作系统安全限制

### v2.1.2 (2025-10-14)

#### 🎉 新功能
- ✅ **邮箱验证码注册** - 完整的邮箱验证功能
  - 支持 QQ 邮箱（@qq.com）和 163 邮箱（@163.com）
  - 6位数字验证码，5分钟有效期，一次性使用
  - 60秒倒计时防止验证码滥发
  - 注册时自动验证邮箱验证码
  - 配置文档请参考 [EMAIL_SETUP.md](EMAIL_SETUP.md)
- ✅ **用户名或邮箱登录** - 灵活的登录方式
  - 支持使用用户名登录（原有功能）
  - 支持使用邮箱地址登录（新增功能）
  - 自动识别输入类型（包含@即为邮箱）
  - 保持原有的安全机制（密码验证、账户锁定）
- ✅ **忘记密码功能** - 密码重置入口
  - 登录页面添加"忘记密码？"链接
  - 点击显示提示模态框
  - 引导用户联系管理员（密码重置功能即将推出）

#### 🎨 UI优化
- ✅ **登录注册界面优化**
  - 使用实际的 icon.png 作为 Logo 图标
  - 移除空的分割线和"或"内容
  - 统一登录和注册页面的视觉风格
  - 优化忘记密码链接的交互体验

#### 🔧 技术实现
- ✅ **后端邮件服务**
  - Spring Boot Mail 集成
  - 完整的邮件发送和验证逻辑
  - 验证码生成、存储、验证、过期管理
  - 数据库新增 email_verification_codes 表
- ✅ **前端表单验证**
  - 邮箱格式验证（仅QQ/163）
  - 验证码倒计时功能
  - 密码确认匹配验证
  - 完善的错误提示

### v2.1.1 (2025-10-14)

#### 🎉 新功能
- ✅ **终端自动执行命令** - 打开终端后自动执行会话配置的命令
  - 无需手动输入 `claude` 等命令，打开即用
  - 延迟100ms确保pty完全初始化
  - 自动添加回车符，直接进入交互界面

#### 🐛 Bug修复
- ✅ **终端路由切换保持内容** - 彻底解决切换菜单时终端重新加载的问题
  - 采用 CSS `visibility` 替代条件渲染
  - 终端组件始终挂载，只控制显示/隐藏
  - 完美保持 xterm.js 的 DOM 状态和 pty 连接
  - 在 Terminals、Sessions、Providers 等页面之间自由切换，终端内容完整保留
- ✅ **终端关闭后页面刷新** - 修复关闭所有终端后页面不更新的问题
  - Redux 状态变化自动触发组件重新渲染
  - 正确显示"没有打开的终端"空状态

#### ⚡ 用户体验优化
- ✅ **终端空状态简化** - 优化"没有打开的终端"界面
  - 移除冗余的会话数量显示和多余按钮
  - 简化为清晰的单一操作"前往 Sessions 页面"
  - 更直观的用户引导流程

#### 🔧 技术细节
- `App.tsx` (437-450行)：使用 `visibility` 和 `pointerEvents` 控制终端显示
- `TerminalComponent.tsx` (118-127行)：添加自动执行命令逻辑
- `TerminalManager.tsx` (140-158行)：简化空状态显示组件

### v2.1.0 (2025-10-10)

#### 🎉 新功能
- ✅ **用户认证系统** - 完整的登录认证系统
  - 用户名+密码登录/注册
  - JWT Token认证（Access Token 24h + Refresh Token 7天）
  - BCrypt密码加密存储
  - 防暴力破解（连续失败5次锁定30分钟）
  - Token自动刷新机制
  - 登录审计日志
- ✅ **实时通知系统** - 企业级实时通知功能
  - **实时推送机制**：基于 SSE (Server-Sent Events) 的实时通知推送
  - **通知管理中心**：完整的通知列表界面，支持分页、过滤、搜索
  - **智能通知图标**：顶部导航栏实时显示未读数量和连接状态
  - **通知类型支持**：系统通知、会话提醒、统计报告、警告、成功、错误消息
  - **优先级管理**：4个优先级（低、普通、高、紧急）和相应的视觉样式
  - **批量操作**：支持批量标记已读、批量删除、全选/取消选择
  - **通知设置**：桌面通知、声音提醒、实时推送、自动刷新等配置选项
  - **业务场景集成**：自动触发会话、Token、Provider等状态变更通知
- ✅ **帮助中心** - 完整的应用内帮助文档
  - 详细的功能介绍和操作步骤
  - 常见问题解答（FAQ）
  - 故障排查指南
  - 快速入门教程
  - 快捷键一览表
  - 中英文双语支持
- ✅ **多用户数据隔离** - 每个用户只能访问自己的数据
  - Provider、Token、Session按用户隔离
  - 数据库级别的用户关联
  - 自动用户上下文管理
- ✅ **强制登录机制** - 应用启动必须登录才能使用
  - 登录页面优先显示
  - 路由守卫保护所有页面
  - 未登录自动跳转

#### 🏗️ 技术架构升级
- ✅ **通知系统后端组件**
  - NotificationController - RESTful API 控制器
  - NotificationService & NotificationServiceImpl - 业务逻辑层
  - SseConnectionManager - SSE 连接管理器
  - NotificationPublisher - 通知发布器
  - NotificationMapper (XML) - MyBatis 数据访问层
- ✅ **通知系统前端组件**
  - NotificationCenter - 通知中心页面
  - NotificationIcon - 导航栏通知图标
  - NotificationItem - 通知列表项组件
  - useNotifications Hook - 通知状态管理钩子
  - notificationSlice - Redux 状态管理
  - NotificationHelper - 通知辅助工具类
- ✅ **数据库设计**
  - notifications 表 - 完整的通知数据存储
  - 支持用户隔离、类型分类、优先级管理
  - JSON 数据字段支持扩展属性

#### 📖 文档更新
- ✅ 创建完整的认证系统设计文档（`docs/user-authentication-system.md`）
- ✅ 更新 README.md 添加通知系统和帮助中心说明
- ✅ 更新 CHANGELOG.md 记录版本更新
- ✅ 更新 CLAUDE.md 项目文档

#### 🔐 安全增强
- ✅ 数据库密码BCrypt加密（不可逆）
- ✅ JWT签名防篡改（HS256算法）
- ✅ 本地Token加密存储（Electron Store）
- ✅ 登录IP记录和追踪
- ✅ SSE连接JWT Token认证
- ✅ 通知数据用户隔离

#### 🌐 用户体验优化
- ✅ 国际化支持 - 通知和帮助中心的完整中英文翻译
- ✅ 响应式设计 - 支持不同屏幕尺寸的设备
- ✅ 实时状态显示 - SSE 连接状态、未读数量实时更新
- ✅ 优雅的动画效果 - 通知进入、删除、状态变更动画
- ✅ 无障碍访问 - 符合 WCAG 标准的可访问性设计

### v2.0.4 (2025-10-09)

#### 🎨 UI改进
- ✅ **菜单项重命名** - 导航菜单从中文"管理"风格改为英文开发者友好命名
  - Provider管理 → **Providers**
  - Token管理 → **API Keys**
  - 会话管理 → **Sessions**
- ✅ 更新所有相关界面文本（导航栏、页面标题、命令面板）
- ✅ 更符合开发者工具的命名习惯和国际化标准

#### 🐛 Bug修复
- ✅ 修复全屏终端关闭后界面空白问题（自动退出全屏）
- ✅ 修复全屏模式下终端底部空白（多次触发resize事件）
- ✅ 修复全屏模式下标签页与终端间距过小

### v2.0.3 (2025-10-04)

#### 🎉 新功能
- ✅ **终端全屏显示** - F11/ESC快捷键切换，专注终端操作
- ✅ **字体动态调整** - Ctrl+滚轮缩放字体（8-30px）
- ✅ **会话状态优化** - 支持会话重启、文件夹选择器、INACTIVE状态
- ✅ **国际化支持** - 中英文双语切换
- ✅ **系统托盘** - 最小化到托盘，便捷窗口管理

#### 🐛 Bug修复
- ✅ 修复终端切换显示异常（IntersectionObserver自动调整）
- ✅ 修复全屏时底部空白区域

#### ⚡ 性能优化
- ✅ 终端尺寸自适应优化
- ✅ 字体缩放性能优化

### v2.0.2 (2025-10-03)

#### 🎉 新功能
- ✅ **智能Token切换和会话自动重启** - Token失效自动检测和恢复
- ✅ **顶部导航栏优化** - 改善用户体验
- ✅ **会话终端标签页管理** - 便捷的标签页切换

#### ⚡ 性能优化
- ✅ Token管理优化 - 添加tokenId字段，避免重复选择
- ✅ 代码质量改善 - 修复多个Ant Design废弃警告

#### 🐛 Bug修复
- ✅ 修复Token健康状态更新失败
- ✅ 修复重复弹窗问题
- ✅ 修复SessionDTO缺少tokenId

[查看完整更新日志](CHANGELOG.md)

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 开发环境搭建

```bash
# 克隆仓库
git clone https://github.com/3202336152/llmctl-desktop.git
cd llmctl

# 安装后端依赖
mvn clean install

# 安装前端依赖
cd electron-app
npm install

# 开发模式运行
npm run dev
```

详细开发指南请参考 [DEVELOPMENT.md](docs/DEVELOPMENT.md)

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: Bug修复
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建/工具
```

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

感谢以下开源项目：

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [Spring Boot](https://spring.io/projects/spring-boot)
- [Ant Design](https://ant.design/)
- [xterm.js](https://xtermjs.org/)
- [MyBatis](https://mybatis.org/)

---

## 📞 联系方式

- **GitHub**: https://github.com/3202336152/llmctl-desktop
- **Issues**: https://github.com/3202336152/llmctl-desktop/issues
- **Discussions**: https://github.com/3202336152/llmctl-desktop/discussions

---

<div align="center">

**如果这个项目对您有帮助，请给个 ⭐️ Star！**

Made with ❤️ by LLMctl Team

</div>