<div align="center">

# LLMctl

**强大的 LLM Provider、Token 和会话管理桌面应用**

[![Version](https://img.shields.io/badge/version-2.3.0-blue.svg)](https://github.com/3202336152/llmctl-desktop/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/3202336152/llmctl-desktop)

</div>

---

## 📖 简介

LLMctl 是一个专业的 LLM CLI 工具管理平台，提供统一的 Provider 配置、智能 Token 轮询、会话管理和终端集成功能。支持 Claude Code、Codex、Gemini、Qoder 等主流 CLI 工具，在一个应用中高效管理所有 AI 开发工作流。

## ✨ 核心特性

### 🔐 安全与认证
- **JWT 用户认证** - 登录注册、邮箱验证、多用户隔离
- **AES-256-GCM 加密** - Token 企业级加密存储
- **权限管理** - 基于用户的数据隔离和访问控制

### 🏗️ Provider 管理
- **配置分离架构** - 一个 Provider 支持多个 CLI 工具
- **动态配置表单** - 根据 CLI 类型自动显示配置项
- **Codex 会话隔离** - 每个会话使用独立配置目录，支持多会话并行运行
- **归档管理** - 归档会话配置，支持按时间范围批量清理

### 🔌 MCP 服务器管理
- **模板库** - 内置常用 MCP 服务器（memory、sqlite、fetch、git、context7、brave-search、gitlab 等）
- **图标系统** - 为每个 MCP 服务器配置专属图标，视觉化管理更直观
- **动态配置** - 命令参数和环境变量可自由添加/删除，灵活配置
- **全局配置** - 统一管理 MCP 服务器，所有会话自动应用已启用的 MCP
- **状态管理** - 已启用服务器优先显示，实时排序，一键启用/禁用
- **批量操作** - 支持批量启用、批量禁用、批量删除

### 🔑 智能 Token 管理
- **多种轮询策略** - Round Robin、Weighted、Random、Least Used
- **健康检查** - 自动检测 Token 状态，失效自动切换
- **手动切换** - 终端内一键手动切换 Token

### 🖥️ 会话与终端
- **多终端并发** - 同时管理多个会话和终端窗口
- **快捷键支持** - `Ctrl+1/2/3` 切换标签页，`Ctrl+W` 关闭终端
- **全屏模式** - F11 切换全屏，专注终端操作
- **外部终端** - 一键切换到系统原生终端
- **自动执行命令** - 终端打开后自动执行配置的命令

### 🔔 实时通知
- **SSE 实时推送** - 基于 Server-Sent Events 的长连接推送
- **通知中心** - 完整的通知管理界面，支持过滤和批量操作
- **优先级分类** - 低、普通、高、紧急四个级别

### 🌐 其他特性
- **国际化** - 中英文双语切换
- **配置管理** - 导入导出配置，方便迁移备份
- **帮助中心** - 完整的应用内帮助文档
- **多级日志系统** - 前端 + 后端三层日志架构，支持开发/生产/调试模式
- **Redis 缓存优化** - 统一的缓存服务架构，提升性能和代码质量
- **Dashboard 仪表盘** - 系统运行状态实时概览，数据可视化展示

---

## 🚀 快速开始

### 系统要求

- 操作系统：Windows 10/11, macOS 10.15+, Ubuntu 20.04+
- 内存：4GB RAM（推荐 8GB）
- 数据库：MySQL 8.x

### 安装

1. 从 [Releases](https://github.com/3202336152/llmctl-desktop/releases) 下载对应平台的安装包
2. 运行安装程序，首次启动会自动初始化数据库

### 使用

1. **注册/登录** - 创建账户或使用现有账户登录
2. **添加 Provider** - 点击 "Providers" → "Add Provider"，填写名称、类型和配置
3. **添加 Token** - 点击 "API Keys" → "Add Token"，输入 API 密钥
4. **启动会话** - 点击 "Sessions" → "Start Session"，选择 Provider 和工作目录

详细使用说明请参考 [用户手册](docs/USER_GUIDE.md)

---

## 🎯 使用场景

- 🔧 **多项目开发** - 不同项目使用不同的 Provider 和 Token 配置
- 🔄 **Token 轮询** - 多个 API Key 负载均衡，避免速率限制
- 🔌 **MCP 扩展** - 为 AI 工具添加外部能力（文件系统、数据库、API 等）
- 🛡️ **团队协作** - 多用户隔离，每个成员独立管理自己的配置
- 📊 **使用统计** - 追踪 Token 使用情况和会话历史

---

## 🏗️ 技术架构

### 技术栈

**前端**
- Electron 26.x + React 18 + TypeScript
- Ant Design 5.x + Redux Toolkit
- xterm.js + node-pty

**后端**
- Spring Boot 3.1.5 + MyBatis 3.0.2
- MySQL 8.x + Redis (可选)
- Lombok + Spring Security Crypto

### 项目结构

```
LLMctl/
├── electron-app/          # Electron 前端应用
│   └── src/
│       ├── main/          # 主进程
│       ├── renderer/      # React 渲染进程
│       └── preload/       # 预加载脚本
├── src/                   # Spring Boot 后端
│   └── main/
│       ├── java/          # Java 源码
│       └── resources/     # 配置文件
└── docs/                  # 文档
```

---

## 📚 文档

- [用户手册](docs/USER_GUIDE.md) - 快速上手指南
- [开发文档](docs/DEVELOPMENT.md) - 开发者指南
- [API 文档](docs/api-documentation.md) - 后端 API 说明
- [更新日志](CHANGELOG.md) - 版本更新记录
- [架构设计](docs/refactor-architecture.md) - 系统架构设计

---

## 🔄 最新更新

### v2.3.0 (2025-11-05)

- 📊 **Dashboard 仪表盘** - 全新的数据可视化主页
  - 快速操作卡片：创建会话、配置 Provider、MCP 管理、查看通知
  - 系统状态概览：活跃会话、Token 健康度、Provider 统计、MCP 统计
  - 会话时长趋势图：折线图展示，支持 7/30/90 天切换
  - Provider 使用统计：柱状图展示，支持 7/30/90 天切换
  - 最近会话列表：快速打开终端，查看会话状态
  - 最近活动日志：实时显示系统操作记录
- 🎨 **图表视觉优化** - 提升数据可视化体验
  - 柱状图颜色调整为浅蓝色 (#4DA3FF)，视觉更协调
  - 柱体顶部显示数值，数据一目了然
  - Tooltip 增强显示，包含成功率等详细信息
  - 字体大小优化，图表更易阅读
- 🖌️ **UI 布局优化** - 统一卡片高度，改善视觉体验
  - SystemOverview 卡片统一 140px 高度
  - 最近活动与最近会话卡片高度一致
  - 终端标签页内容居中显示
- 🐛 **Bug 修复** - 修复多个 UI 显示问题
  - 修复图表标题动态括号显示
  - 修复 Provider 统计时间范围选项
  - 修复最近活动无数据问题
  - 修复 Tooltip 多余分号显示

### v2.2.9 (2025-11-04)

- 🎨 **终端UI优化** - 统一图标显示，全屏和非全屏模式UI一致
- ✨ **Tooltip支持** - 所有终端操作按钮添加鼠标悬停提示
- 🗑️ **批量关闭终端** - 新增"关闭所有终端"按钮，支持批量操作
- 🎯 **简化侧边栏** - 删除应用名称显示（LLMctl/CTL），界面更简洁

### v2.2.8 (2025-11-04)

- 🏗️ **Redis 缓存服务架构** - 统一的缓存管理接口，遵循 DRY 原则，代码质量显著提升
- 🔌 **MCP 配置文件支持** - 支持为 MCP 服务器配置独立的配置文件（JSON/YAML/TOML）
- 🐛 **自动更新安装修复** - 修复 Windows 安装程序报错 "LLMctl 无法关闭"
- 📖 **文档完善** - 更新 Redis 使用指南，新增缓存服务架构说明

### v2.2.7 (2025-11-04)

- 🐛 **外部终端启动优化** - 响应时间从 10-30 秒降至 < 10ms
- 🐛 **Electron 终端崩溃修复** - 修复快速切换页面导致的"未响应"问题
- 🐛 **MySQL 连接池优化** - 修复长时间运行后的连接失败问题

### v2.2.6 (2025-11-03)

- 📊 **多级日志系统** - 企业级三层日志架构（前端 + 后端），支持开发/生产/调试三种模式
- 🔧 **日志管理 UI** - Settings 页面新增日志管理功能，一键打开日志目录和查看日志路径
- 📖 **完整日志文档** - `docs/logging-guide.md` 提供 50+ 实用命令和完整的日志操作指南
- 🎯 **条件日志策略** - 生产环境仅记录错误，开发环境完整调试信息，支持 `--debug-logs` 临时启用详细日志
- ⚡ **性能优化** - 生产模式日志从 10MB 降至 1MB，减少磁盘占用，提升用户体验

### v2.2.4 (2025-10-30)

- 🔌 **MCP 服务器管理** - 完整的 Model Context Protocol 服务器管理功能
- 📚 **模板库** - 内置常用 MCP 服务器模板（memory、sqlite、fetch、git、context7）
- 🔗 **智能关联** - 为每个 Provider 的不同 CLI 工具配置专属 MCP 服务器
- 🔄 **配置刷新** - 右键菜单一键刷新 MCP 配置，无需重启会话
- 🐛 **Bug 修复** - 修复重复提交、图标显示、删除确认等问题

[查看完整更新日志](CHANGELOG.md)

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

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

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `perf:` 性能优化
- `test:` 测试
- `chore:` 构建/工具

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
