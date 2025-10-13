# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LLMctl 是一个功能强大的 LLM Provider、Token 和会话管理桌面应用。项目采用 Electron + Spring Boot 架构，已完成从 CLI 工具到桌面应用的重构，当前版本为 **v2.0.4**。

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
│   └── StatisticsController.java
├── service/                  # 业务服务层
│   ├── impl/                # 服务实现
│   └── interfaces/          # 服务接口
├── mapper/                   # MyBatis数据访问层
├── entity/                   # 数据库实体类
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
│       │   │   └── sessionSlice.ts
│       │   └── index.ts
│       ├── services/       # API服务
│       │   ├── api.ts      # HTTP请求封装
│       │   └── terminalManager.ts  # 终端管理器
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
- **全屏模式**: F11/ESC快捷键切换全屏
- **字体缩放**: Ctrl+滚轮动态调整字体（8-30px）
- **复制粘贴**: Ctrl+C/Ctrl+V完整支持
- **本地执行**: Electron本地执行，响应时间<10ms
- **错误检测**: 实时监控终端输出，识别Token错误
- **自动重启**: Token失效时自动重启会话

### 5. 配置管理
- 导入导出功能 (支持bash, powershell, cmd, json格式)
- 环境变量生成
- 配置验证和备份恢复
- 菜单栏快捷导入导出 (Ctrl+O / Ctrl+S)

### 6. 系统设置
- **国际化**: 中英文双语切换
- **主题**: 亮色主题
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

## API接口规范

- **Base URL**: `http://localhost:8080/llmctl`
- **响应格式**: 统一的JSON格式，包含code、message、data字段
- **主要接口模块**:
  - `/providers` - Provider管理 (CRUD)
  - `/tokens` - Token管理 (CRUD + 健康状态更新)
  - `/sessions` - 会话管理 (启动、终止、重启、清除)
  - `/config` - 配置管理 (导入、导出、全局配置)
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

## 最新版本特性 (v2.0.4)

### 🎨 UI改进
- 菜单项重命名为开发者友好格式
- 优化终端标签页与终端黑框间距

### 🐛 Bug修复
- 修复全屏终端关闭后界面空白
- 修复全屏模式下终端底部空白
- 修复全屏和非全屏模式下间距问题

### 🔧 技术细节
- Tabs组件 `tabBarStyle.marginBottom: 8`
- 终端容器 `top: 48px` (全屏) / `56px` (非全屏)
- 全屏状态自动监听和退出逻辑

---

开发时请参考这些文档了解项目的整体设计和实施计划。如有疑问，请查看 `CHANGELOG.md` 了解最新更新。
