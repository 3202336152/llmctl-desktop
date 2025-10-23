# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LLMctl 是一个功能强大的 LLM Provider、Token 和会话管理桌面应用。项目采用 Electron + Spring Boot 架构，已完成从 CLI 工具到桌面应用的重构,当前版本为 **v2.2.0**。

## 开发环境要求

### 后端环境
- Java 17+
- Maven 3.8+
- MySQL 8.x

### 前端环境
- Node.js 18+
- npm 或 yarn

## 核心技术栈

### 后端技术栈
- **框架**: Spring Boot 3.1.5
- **ORM**: MyBatis 3.0.2
- **数据库**: MySQL 8.x
- **工具**: Lombok, Spring Security Crypto
- **构建**: Maven

### 前端技术栈
- **桌面框架**: Electron 26.x
- **UI框架**: React 18 + TypeScript
- **组件库**: Ant Design 5.x
- **状态管理**: Redux Toolkit
- **终端**: xterm.js + node-pty
- **HTTP客户端**: Axios
- **国际化**: i18next
- **构建**: Webpack 5

## 项目架构

### 后端结构
```
src/main/java/com/llmctl/
├── LLMctlApplication.java    # SpringBoot启动类
├── controller/               # REST控制器层
│   ├── ProviderController.java
│   ├── TokenController.java
│   ├── SessionController.java
│   ├── ConfigController.java
│   ├── NotificationController.java  # 通知管理API
│   └── SseController.java              # SSE实时推送API
├── service/                  # 业务服务层
│   ├── impl/                # 服务实现
│   │   ├── NotificationServiceImpl.java  # 通知服务实现
│   │   └── SseConnectionManager.java     # SSE连接管理
│   └── interfaces/          # 服务接口
├── mapper/                   # MyBatis数据访问层
│   └── NotificationMapper.java          # 通知数据映射
├── entity/                   # 数据库实体类
│   └── Notification.java                # 通知实体
├── dto/                      # 数据传输对象
├── config/                   # 配置类
└── utils/                    # 工具类

src/main/resources/
├── mapper/                   # MyBatis XML映射文件
├── schema.sql               # 数据库表结构
└── application.yml          # 应用配置
```

### 前端结构
```
electron-app/
├── src/
│   ├── main/                # Electron主进程
│   │   └── main.ts
│   ├── preload/             # 预加载脚本
│   │   └── preload.ts
│   └── renderer/            # React渲染进程
│       ├── components/      # React组件
│       │   ├── Common/     # 通用组件
│       │   │   ├── CommandPalette.tsx    # 命令面板 (Ctrl+K)
│       │   │   ├── ContextMenu.tsx       # 右键菜单
│       │   │   ├── ErrorBoundary.tsx     # 错误边界
│       │   │   └── NotificationManager.tsx
│       │   ├── Notifications/ # 通知系统组件
│       │   │   ├── NotificationCenter.tsx  # 通知中心页面
│       │   │   ├── NotificationIcon.tsx    # 通知图标组件
│       │   │   ├── NotificationItem.tsx    # 通知项组件
│       │   │   ├── types.ts               # 通知类型定义
│       │   │   ├── notificationAPI.ts     # 通知API封装
│       │   │   └── *.css                  # 通知样式文件
│       │   ├── Layout/     # 布局组件
│       │   │   ├── ResizableSider.tsx    # 可调整侧边栏
│       │   │   ├── TopBar.tsx            # 顶部导航栏
│       │   │   └── StatusBar.tsx         # 底部状态栏
│       │   ├── Provider/   # Provider管理
│       │   │   └── ProviderManager.tsx
│       │   ├── Token/      # Token管理
│       │   │   └── TokenManager.tsx
│       │   ├── Session/    # 会话管理
│       │   │   └── SessionManager.tsx
│       │   ├── Terminal/   # 终端组件
│       │   │   └── TerminalComponent.tsx
│       │   ├── Settings/   # 设置页面
│       │   │   └── Settings.tsx
│       │   └── Statistics/ # 统计页面
│       │       └── Statistics.tsx
│       ├── store/          # Redux状态管理
│       │   ├── slices/     # Redux切片
│       │   │   ├── providerSlice.ts
│       │   │   ├── tokenSlice.ts
│       │   │   ├── sessionSlice.ts
│       │   │   └── notificationSlice.ts     # 通知状态管理
│       │   └── index.ts
│       ├── services/       # API服务
│       │   ├── api.ts      # HTTP请求封装
│       │   └── terminalManager.ts  # 终端管理器
│       ├── hooks/          # React Hooks
│       │   └── useNotifications.ts      # 通知Hook
│       ├── utils/          # 工具类
│       │   └── notificationHelper.ts   # 通知辅助工具
│       ├── i18n/           # 国际化
│       │   ├── index.ts
│       │   └── locales/
│       │       ├── zh.json
│       │       └── en.json
│       ├── styles/         # 样式文件
│       │   ├── global.css
│       │   ├── App.css
│       │   └── design-tokens.css
│       ├── types/          # TypeScript类型定义
│       ├── theme.ts        # 主题配置
│       ├── App.tsx         # 主应用组件
│       └── index.tsx       # 入口文件
├── package.json
└── webpack配置文件
```

## 常用开发命令

### 后端命令
```bash
# 编译项目
mvn clean compile

# 运行测试
mvn test

# 启动应用 (开发模式)
mvn spring-boot:run

# 打包JAR
mvn clean package

# 跳过测试打包
mvn clean package -DskipTests
```

### 前端命令
```bash
# 进入前端目录
cd electron-app

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建项目
npm run build

# 打包应用
npm run package      # 打包当前平台
npm run make         # 创建安装程序
```

### 数据库操作
```bash
# 创建数据库 (MySQL命令)
CREATE DATABASE llmctl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户
CREATE USER 'llmctl'@'localhost' IDENTIFIED BY 'llmctl123';
GRANT ALL PRIVILEGES ON llmctl.* TO 'llmctl'@'localhost';
FLUSH PRIVILEGES;
```

## 核心功能模块

### 1. Provider管理 (Providers)
- 支持多种LLM Provider (Claude, OpenAI, Qwen, Gemini等)
- Provider配置的增删改查
- Provider启用/停用状态管理
- 配置验证机制
- 模板化配置向导

### 2. Token管理 (API Keys)
- 多Token支持和轮询策略
- 4种轮询策略：
  - **Round Robin**: 顺序轮询
  - **Weighted**: 按权重随机选择
  - **Random**: 完全随机
  - **Least Used**: 选择最少使用的Token
- 健康状态监控和故障自动检测
- Token失效自动切换
- Token使用统计
- Token脱敏显示

### 3. 会话管理 (Sessions)
- CLI进程监控和生命周期管理
- 工作目录选择器（文件夹选择对话框）
- 实时状态更新 (ACTIVE/INACTIVE)
- 会话重启功能
- 智能Token切换
- 环境变量自动配置

### 4. 终端功能
- **多终端并发**: 同时打开多个终端窗口
- **标签页管理**: 便捷的终端标签页切换
- **快捷键支持** (v2.1.3 新增):
  - `Ctrl+1/2/3` 快速切换终端标签页
  - `Ctrl+W` 快速关闭当前终端
- **全屏模式**: F11/ESC快捷键切换全屏
- **字体缩放**: Ctrl+滚轮动态调整字体（8-30px）
- **复制粘贴**: Ctrl+C/Ctrl+V完整支持，右键点击粘贴 (v2.1.3 新增)
- **本地执行**: Electron本地执行，响应时间<10ms
- **错误检测**: 实时监控终端输出，识别Token错误
- **自动重启**: Token失效时自动重启会话
- **手动切换Token** (v2.1.3 新增): 终端标签栏一键手动切换Token
- **外部终端支持** (v2.1.3 新增): 一键切换到系统原生终端（Windows CMD/macOS Terminal/Linux Terminal）

### 5. 配置管理
- 导入导出功能 (支持bash, powershell, cmd, json格式)
- 环境变量生成
- 配置验证和备份恢复
- 菜单栏快捷导入导出 (Ctrl+O / Ctrl+S)

### 6. 通知系统 (Notifications) 🎉
- **实时推送**: 基于 SSE (Server-Sent Events) 的实时通知推送
- **通知管理中心**: 完整的通知列表界面，支持分页、过滤、搜索
- **智能通知图标**: 顶部导航栏实时显示未读数量和连接状态
- **通知类型支持**: 系统通知、会话提醒、统计报告、警告、成功、错误消息
- **优先级管理**: 4个优先级（低、普通、高、紧急）和相应的视觉样式
- **批量操作**: 支持批量标记已读、批量删除、全选/取消选择
- **通知设置**: 桌面通知、声音提醒、实时推送、自动刷新等配置选项
- **业务场景集成**: 自动触发会话、Token、Provider等状态变更通知

### 7. 系统设置
- **国际化**: 中英文双语切换
- **主题**: 亮色主题和暗色主题（v2.1.7新增）
- **系统托盘**: 最小化到托盘
- **数据管理**: 清理日志、缓存、重置数据


## 数据库配置

项目使用MyBatis作为ORM框架：

- **Mapper位置**: `src/main/resources/mapper/*.xml`
- **实体包**: `com.llmctl.entity`
- **数据库URL**: `jdbc:mysql://localhost:3306/llmctl`
- **字段映射**: 自动下划线转驼峰命名
- **核心表**:
  - `providers` - Provider配置表
  - `tokens` - Token信息表
  - `sessions` - 会话记录表
  - `token_strategies` - Token轮询策略表
  - `statistics` - 统计数据表
  - `global_configs` - 全局配置表
  - `notifications` - 通知表 (新增)

## API接口规范

- **Base URL**: `http://localhost:8080/llmctl`
- **响应格式**: 统一的JSON格式，包含code、message、data字段
- **主要接口模块**:
  - `/providers` - Provider管理 (CRUD)
  - `/tokens` - Token管理 (CRUD + 健康状态更新)
  - `/sessions` - 会话管理 (启动、终止、重启、清除)
  - `/config` - 配置管理 (导入、导出、全局配置)
  - `/notifications` - 通知管理 (CRUD、标记已读、批量操作)
  - `/sse/notifications` - SSE实时推送接口
  - `/statistics` - 统计信息查询

详细API文档请参考 `docs/api-documentation.md`

## 关键配置文件

### 后端配置

**application.yml**
- 服务器端口: 8080
- 上下文路径: `/llmctl`
- 数据库连接配置
- MyBatis配置
- 日志配置

**pom.xml 关键依赖**
- spring-boot-starter-web
- mybatis-spring-boot-starter
- mysql-connector-j
- spring-boot-starter-validation
- jasypt-spring-boot-starter (密码加密)
- lombok

### 前端配置

**package.json**
- electron
- react, react-dom
- antd
- @reduxjs/toolkit, react-redux
- axios
- xterm, node-pty
- i18next, react-i18next

**webpack配置**
- webpack.main.config.js - 主进程配置
- webpack.preload.config.js - 预加载脚本配置
- webpack.renderer.config.js - 渲染进程配置

## 开发注意事项

### 代码规范

#### 后端规范
- 使用Lombok简化代码 (@Data, @Slf4j等)
- 实体类放在entity包，DTO放在dto包
- Mapper接口放在mapper包，XML文件放在resources/mapper目录
- 业务逻辑在service层，控制器只做参数验证和调用
- 统一异常处理和响应格式

#### 前端规范
- 使用TypeScript，确保类型安全
- 组件按功能模块分类存放
- 使用Redux Toolkit管理全局状态
- API调用统一通过services/api.ts
- 国际化文本统一使用t()函数
- 遵循React Hooks最佳实践

### 架构约束
- **单个Java文件不超过400行**
- **单个TypeScript/React文件不超过300行**
- **每层文件夹中的文件不超过8个**（超过则拆分为子文件夹）
- 避免循环依赖和数据泥团
- 保持代码简洁，避免过度设计

### UI/UX注意事项
- 菜单项命名使用英文开发者友好格式（Providers, API Keys, Sessions）
- 全屏和非全屏模式下标签页与终端要保持适当间距
- 使用Ant Design组件库，避免使用废弃的API
- 表单使用 `preserve={false}` 防止状态污染
- Modal使用 `destroyOnClose` 确保关闭后清理

### 性能优化
- 终端使用本地执行（Electron），避免HTTP往返
- 使用IntersectionObserver优化终端可见性检测
- 避免频繁的fit()调用，使用延迟批处理
- 合理使用React.memo和useCallback减少重渲染

## 项目状态

✅ **已完成**:
- 后端 Spring Boot 服务完整实现
- 前端 Electron 应用完整实现
- Provider、Token、Session 核心功能
- **完整通知系统** - 企业级实时通知功能
- 终端全屏模式和字体缩放
- 国际化支持（中英文）
- 系统托盘功能
- 智能Token切换和错误恢复
- 配置导入导出
- 命令面板 (Ctrl+K)

🚧 **待优化**:
- 统计信息页面数据可视化
- 更多Provider类型支持
- 性能监控和分析
- 自动更新功能

## 文档资源

项目文档位于 `docs/` 目录：
- `refactor-architecture.md` - 架构设计文档
- `api-documentation.md` - API接口文档
- `database-schema.md` - 数据库设计文档
- `implementation-guide.md` - 实施指南文档
- `README.md` - 项目主页文档
- `CHANGELOG.md` - 版本更新记录

## 最新版本特性 (v2.2.0)

### 🏗️ Provider 配置分离架构 - 重大架构升级
- **数据库表结构变更**：
  - `providers` 表简化：只保留核心字段（id、name、description、types、策略配置等）
  - 新增 `provider_configs` 表：存储 CLI 专用配置，支持一对多关系
  - 使用 JSON 字段存储配置数据，灵活支持不同 CLI 的配置结构
- **后端实现**：
  - 新增 `ProviderConfig.java` 实体类，支持 CliType 枚举（claude code、codex、gemini、qoder）
  - 新增 `CliTypeHandler.java` 自定义 MyBatis TypeHandler，处理带空格的枚举值
  - Service 层使用 `@Transactional` 处理 Provider 和配置的级联创建/更新
  - 优化查询性能：使用 JOIN 查询一次性获取 Provider 及其配置
- **前端实现**：
  - 更新 TypeScript 类型定义，添加 `ProviderConfig` 接口
  - 重写 `ProviderManager.tsx` 表单提交逻辑，动态构建配置数据
  - 优化表单编辑逻辑，从 `configs` 数组中提取对应配置数据回填
  - 表格显示优化，展示所有配置的 CLI 类型

### 🎯 Codex 配置优化
- **简化配置输入**：前端只需输入 config.toml 内容
- **自动生成模板**：后端自动生成 auth.json 模板并注入 API Token
- **环境变量支持**：添加 `CODEX_HOME` 环境变量，指向项目 `.codex` 目录
- **修复配置读取问题**：Codex CLI 使用项目专用配置，而不是系统全局配置

### 🐛 Bug修复
- **修复 Redux sessionId 不匹配导致的 404 错误**
  - 问题：后端创建新会话 `session_72d985f9b3e1402d9a62c4df2a98dd11`，前端却尝试访问旧的 `session_9cc488ff590b4ab9bb3777199af1d134`
  - 根本原因：Redux store 中的 `createdTerminalSessions` 数组包含过期的 sessionId
  - 解决方案：修改 `sessionSlice.ts` 的 `setSessions` action，添加自动清理逻辑
  - 涉及文件：`sessionSlice.ts` (33-66行)、`TerminalComponent.tsx` (52-60行)、`SessionServiceImpl.java` (334-353行)
- **修复 Codex CLI 读取配置路径问题**
  - 问题：Codex CLI 默认读取 `~/.codex/config.toml`，忽略项目目录配置
  - 解决方案：添加 `CODEX_HOME` 环境变量，指向项目 `.codex` 目录
  - 修复效果：每个项目使用独立的 Codex 配置，互不干扰
- **修复 Provider 编辑时 Claude Code 配置不显示**
  - 问题：编辑 Provider 时，Codex 配置可以正常回填，但 Claude Code 配置无法显示
  - 根本原因：TypeScript `CliConfig` 接口的 `cliType` 类型定义错误（使用了 `'claude'` 而不是 `'claude code'`）
  - 解决方案：修正类型定义为 `'claude code' | 'codex' | 'gemini' | 'qoder'`

### 🎨 UI/UX 优化
- **Provider 表单优化**：
  - 类型选择改为 Select 下拉多选框，替代原来的 Checkbox.Group
  - 提升用户体验，多选操作更流畅
  - 根据选中类型动态显示对应的配置表单
- **Gemini 和 Qoder 配置禁用**：在类型选择中添加 disabled 状态，显示"暂未适配"提示

### 🏗️ 架构优势
- **扩展性**：新增 CLI 类型无需 ALTER TABLE，只需插入新配置记录
- **表结构简化**：providers 核心表从 18+ 字段减少到 8 个字段
- **职责清晰**：providers 表管理核心信息，provider_configs 表管理 CLI 专用配置
- **配置灵活性**：JSON 字段支持任意结构的配置数据
- **设计原则**：遵循单一职责、开闭原则、依赖倒置原则

### ⚠️ 破坏性变更
- **数据库结构变更**：必须执行迁移脚本 `migration_v2.3.0_split_configs.sql`
- **API 接口变更**：Provider 创建/更新接口的请求体结构变化
- **前端类型定义变更**：Provider 接口新增 `configs` 字段，移除 CLI 专用字段

### 📖 文档更新
- 新增完整的架构文档：`docs/provider-config-separation-guide.md`

## 历史版本特性 (v2.1.7)

### 🎨 暗色主题功能
- **暗色主题配置**：
  - 完整的暗色配色方案（背景色：#1f1f1f, #262626, #141414）
  - 优化的暗色主题色（#177ddc）
  - 适配的文字颜色（rgba(255, 255, 255, 0.85)）
  - 所有组件的暗色样式覆盖（Layout、Card、Table、Input、Select、Modal、Menu等）
- **动态主题切换**：
  - 在设置页面选择主题（亮色/暗色）
  - 实时切换无需重启应用
  - 主题偏好自动保存到数据库
  - 登录后自动加载用户主题偏好
- **用户体验优化**：
  - 保存设置后立即生效
  - 全局UI自动更新
  - 流畅的主题切换动画
  - 所有页面统一的主题风格

### 🔧 技术实现
- **前端修改文件**：
  - `theme.ts` (92-208行) - 新增完整 darkTheme 配置
  - `App.tsx` - 实现动态主题切换逻辑
  - `Settings.tsx` (119-120行) - 触发 settings-changed 事件
- **主题切换流程**：Settings 保存 → 后端更新配置 → 触发事件 → App 重新加载 → ConfigProvider 使用 darkTheme → 全局 UI 更新

### 🌟 用户体验
- **视觉舒适性提升**：夜间模式保护眼睛，减少蓝光刺激
- **个性化定制**：用户自由选择喜欢的主题，满足不同场景需求
- **向后兼容性**：未设置主题的用户默认使用亮色主题

## 历史版本特性 (v2.1.6)

### 🎯 Sessions 页面全面优化
- **会话表格优化**：
  - **会话名称优化**：显示格式改为 `Provider名 - 项目名 #序号`，自动从工作目录提取项目名
  - **时间信息增强**：相对时间显示（刚刚、N分钟前、N小时前等）+ 持续时间计算
  - **工作目录优化**：显示格式 `项目名 (路径层级)`，智能路径提示
  - **表格列优化**：删除冗余列（Provider、命令），合并时间列，更紧凑的布局
- **快捷操作功能**：
  - **右键菜单**：打开终端/重新启动、复制会话ID、复制工作目录、在文件管理器中打开、终止/删除会话
  - **双击打开终端**：双击任意会话行即可打开终端
- **命令选择优化**：将命令输入框改为下拉选择框，提供 4 个 CLI 命令选项（claude、codex、gemini、qoder）
- **刷新按钮**：手动刷新会话列表

### 🐛 Bug修复
- **修复右键菜单"在文件管理器中打开"报错**
  - 问题：使用 `openExternal` 打开文件夹在 Windows 上失败
  - 修复：使用 Electron 的 `shell.openPath()` API（跨平台支持）

### 🎨 用户体验优化
- **信息浏览效率提升**：会话名称更有意义，快速识别项目和序号
- **操作便捷性提升**：右键菜单集成常用操作，双击打开终端，下拉选择命令
- **视觉体验优化**：表格布局更紧凑，Tooltip 提供详细信息，保持界面简洁

## 历史版本特性 (v2.1.3)

### 🎯 终端功能增强
- **快捷键支持**：`Ctrl+1/2/3` 切换标签页，`Ctrl+W` 关闭终端
- **右键粘贴**：在终端区域右键直接粘贴剪贴板内容
- **手动切换Token**：终端标签栏新增"切换 Token"按钮，支持手动触发Token切换
- **外部终端支持**：一键切换到系统原生终端
  - Windows: CMD 窗口
  - macOS: Terminal.app
  - Linux: gnome-terminal
  - 自动切换工作目录并执行会话命令
  - **已知限制**：外部终端关闭后，系统无法自动检测，需手动重新创建会话

### 🐛 Bug修复
- 修复粘贴内容截断问题（移除分块发送逻辑）
- 修复 MyBatis 参数映射错误
- 优化粘贴逻辑，保留 CMD 原生 `[Pasted text]` 提示

## 历史版本特性 (v2.1.0)

### 🎉 通知系统完整实现
- **实时推送机制**：基于 SSE (Server-Sent Events) 的实时通知推送
- **通知管理中心**：完整的通知列表界面，支持分页、过滤、搜索
- **智能通知图标**：顶部导航栏实时显示未读数量和连接状态
- **通知类型支持**：系统通知、会话提醒、统计报告、警告、成功、错误消息
- **优先级管理**：4个优先级（低、普通、高、紧急）和相应的视觉样式
- **批量操作**：支持批量标记已读、批量删除、全选/取消选择
- **通知设置**：桌面通知、声音提醒、实时推送、自动刷新等配置选项

### 🏗️ 技术架构升级
- **后端组件**：NotificationController、NotificationService、SseConnectionManager、NotificationPublisher
- **前端组件**：NotificationCenter、NotificationIcon、NotificationItem、useNotifications Hook
- **数据库设计**：完整的 notifications 表结构，支持用户隔离、类型分类、优先级管理
- **状态管理**：Redux Toolkit notificationSlice，支持实时状态更新
- **类型安全**：完整的 TypeScript 类型定义和类型检查

### 🌐 用户体验优化
- **国际化支持**：完整的中英文翻译
- **响应式设计**：支持不同屏幕尺寸的设备
- **实时状态显示**：SSE 连接状态、未读数量实时更新
- **优雅的动画效果**：通知进入、删除、状态变更动画
- **无障碍访问**：符合 WCAG 标准的可访问性设计

### 🔧 集成功能
- **业务场景集成**：自动触发会话、Token、Provider等状态变更通知
- **通知辅助工具**：NotificationHelper 工具类和预定义通知模板
- **错误处理**：完善的异常处理和用户友好的错误提示
- **性能优化**：SSE 连接复用、通知缓存、分页加载

### 🛠️ 开发体验
- **TypeScript 类型安全**：完整的类型定义和类型检查
- **代码质量**：符合 ESLint 和 Prettier 规范
- **构建优化**：成功修复所有 TypeScript 编译错误，构建无警告

---

开发时请参考这些文档了解项目的整体设计和实施计划。如有疑问，请查看 `CHANGELOG.md` 了解最新更新。
