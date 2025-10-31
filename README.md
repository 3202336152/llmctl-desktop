<div align="center">

# LLMctl

**强大的 LLM Provider、Token 和会话管理桌面应用**

[![Version](https://img.shields.io/badge/version-2.2.4-blue.svg)](https://github.com/3202336152/llmctl-desktop/releases)
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
- **模板库** - 内置常用 MCP 服务器（mysql、gitlab、context7、brave-search等）
- **自定义配置** - 支持创建和管理自定义 MCP 服务器
- **智能关联** - 为不同 Provider 和 CLI 工具配置专属 MCP
- **自动注入** - 会话启动时自动生成配置文件（`.mcp.json`）
- **配置刷新** - 右键菜单一键刷新 MCP 配置

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
- MySQL 8.x + Lombok

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

### v2.2.4 (2025-10-30)

- 🔌 **MCP 服务器管理** - 完整的 Model Context Protocol 服务器管理功能
- 📚 **模板库** - 内置常用 MCP 服务器模板（memory、sqlite、fetch、git、context7）
- 🔗 **智能关联** - 为每个 Provider 的不同 CLI 工具配置专属 MCP 服务器
- 🔄 **配置刷新** - 右键菜单一键刷新 MCP 配置，无需重启会话
- 🐛 **Bug 修复** - 修复重复提交、图标显示、删除确认等问题

### v2.2.1 (2025-10-23)

- 🔐 **Codex 会话配置隔离** - 每个会话使用独立的 `.codex-sessions/{sessionId}/` 配置目录
- 🗂️ **归档管理系统** - Settings 页面新增归档清理功能，支持 10/20/30 天和全部清理选项
- 📊 **归档统计展示** - 显示归档数量、占用空间、会话列表
- 🛠️ **智能目录检测** - 自动修正用户选择的目录路径，避免路径错误

### v2.2.0 (2025-10-23)

- 🏗️ **Provider 配置分离架构** - 一个 Provider 支持多个 CLI 工具，配置独立存储
- 🎯 **Codex 配置优化** - 简化配置输入，自动生成 auth.json，CODEX_HOME 支持
- 🐛 **Bug 修复** - 修复 Redux sessionId 不匹配、Codex 配置路径、Provider 编辑等问题
- 🎨 **UI 优化** - Provider 表单改为下拉多选，动态显示配置项

### v2.1.7 (2025-10-17)

- 🎨 **暗色主题** - 完整的深色模式支持，实时切换无需重启
- 🌙 **视觉优化** - 夜间模式保护眼睛，降低屏幕亮度

### v2.1.6 (2025-10-17)

- 📊 **会话表格优化** - 会话名称、时间信息、工作目录显示优化
- 🖱️ **快捷操作** - 右键菜单、双击打开终端、命令下拉选择

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
