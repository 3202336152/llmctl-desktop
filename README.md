<div align="center">

# LLMctl
**强大的LLM Provider、Token和会话管理桌面应用**

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/3202336152/llmctl-desktop/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/3202336152/llmctl-desktop)

</div>

---

## ✨ 特性

### 核心功能

- 🔐 **用户认证系统** - 用户名+密码登录，JWT Token认证，数据隔离（🆕 v2.1.0）
- 🌐 **多Provider支持** - 支持Claude、OpenAI、Qwen、Gemini等主流LLM Provider
- 🔑 **智能Token管理** - 多Token轮询、健康检查、自动切换
- 🔒 **企业级加密** - AES-256-GCM加密存储Token，NSA绝密信息级安全（🆕 v2.0.4）
- 🔄 **自动故障恢复** - Token失效自动检测，一键切换到健康Token（🆕 v2.0.2）
- 🖥️ **会话管理** - CLI进程监控、工作目录记录、实时状态更新、会话重启（🆕 v2.0.3）
- 🌍 **国际化支持** - 支持中英文切换，语言配置持久化（🆕 v2.0.3）
- 📊 **统计分析** - 详细的使用统计和数据可视化
- ⚙️ **配置管理** - 支持导入导出配置，方便迁移和备份

### 终端功能

- 🪟 **多终端并发** - 同时打开多个终端窗口，在不同目录和项目中并行工作
- 📋 **复制粘贴支持** - 完整的终端复制粘贴功能，与系统终端体验一致
- 🏷️ **标签页管理** - 便捷的终端标签页切换和管理
- 🖥️ **全屏显示** - 支持F11/ESC快捷键切换全屏，专注终端操作（🆕 v2.0.3）
- 🔤 **字体缩放** - Ctrl+滚轮动态调整字体大小（8-30px）（🆕 v2.0.3）
- ⚡ **高性能** - Electron本地执行，响应时间<10ms

### 安全特性

#### 用户认证（🆕 v2.1.0）
- 🔐 **JWT认证** - 基于JWT Token的无状态认证机制
- 👤 **强制登录** - 应用启动必须登录，未登录无法访问任何功能
- 🔑 **BCrypt加密** - 密码采用BCrypt单向加密存储，永不明文
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

### 智能容错（🆕 v2.0.2）

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

2. **配置MySQL数据库**
   ```sql
   CREATE DATABASE llmctl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'llmctl'@'localhost' IDENTIFIED BY 'llmctl123';
   GRANT ALL PRIVILEGES ON llmctl.* TO 'llmctl'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **启动应用**
   - 运行安装的LLMctl应用
   - 首次启动会自动初始化数据库表结构

4. **首次登录** 🆕
   - 应用启动后显示登录页面
   - 使用默认管理员账户登录：
     - 用户名：`admin`
     - 密码：`admin123`
   - 或点击"注册"标签创建新账户

### 基础配置

1. **创建Provider**
   - 点击"Providers" → "创建Provider"
   - 填写Provider信息（名称、类型、API URL等）
   - 添加至少一个Token

2. **启动会话**
   - 点击"Sessions" → "启动会话"
   - 选择Provider和工作目录
   - 系统自动选择Token并启动终端

详细使用说明请参考 [用户手册](docs/USER_GUIDE.md)

---

## 🎯 核心功能

### 用户认证系统 🆕

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

### 智能Token切换 🆕

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
- ✅ 全屏模式（F11切换，ESC退出）（🆕 v2.0.3）
- ✅ 动态字体调整（Ctrl+滚轮缩放）（🆕 v2.0.3）
- ✅ 可以独立打开和关闭

### 终端全屏模式 🆕

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

### 字体动态调整 🆕

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
│   │   └── preload/       # 预加载脚本
│   └── package.json
├── src/                   # Spring Boot后端
│   ├── main/
│   │   ├── java/
│   │   │   └── com/llmctl/
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── mapper/
│   │   │       ├── entity/
│   │   │       └── dto/
│   │   └── resources/
│   │       └── mapper/    # MyBatis XML
│   └── test/
├── docs/                  # 文档
│   ├── USER_GUIDE.md
│   ├── DEVELOPMENT.md
│   └── API_DOCUMENTATION.md
└── README.md
```

---

## 📚 文档

- [用户手册](docs/USER_GUIDE.md) - 完整的使用指南
- [开发文档](docs/DEVELOPMENT.md) - 开发者指南
- [用户认证系统设计](docs/user-authentication-system.md) - 完整的认证系统设计文档 🆕
- [加密配置指南](docs/encryption-guide.md) - Jasypt与AES-256-GCM加密详解
- [API文档](docs/api-documentation.md) - 后端API说明
- [架构设计](docs/refactor-architecture.md) - 系统架构设计
- [数据库设计](docs/database-schema.md) - 数据库表结构
- [更新日志](CHANGELOG.md) - 版本更新记录

---

## 🔄 最新更新

### v2.1.0 (2025-10-10) 🆕

#### 🎉 新功能
- ✅ **用户认证系统** - 完整的登录认证系统
  - 用户名+密码登录/注册
  - JWT Token认证（Access Token 24h + Refresh Token 7天）
  - BCrypt密码加密存储
  - 防暴力破解（连续失败5次锁定30分钟）
  - Token自动刷新机制
  - 登录审计日志
- ✅ **多用户数据隔离** - 每个用户只能访问自己的数据
  - Provider、Token、Session按用户隔离
  - 数据库级别的用户关联
  - 自动用户上下文管理
- ✅ **强制登录机制** - 应用启动必须登录才能使用
  - 登录页面优先显示
  - 路由守卫保护所有页面
  - 未登录自动跳转

#### 📖 文档更新
- ✅ 创建完整的认证系统设计文档（`docs/user-authentication-system.md`）
- ✅ 更新README.md添加认证系统说明
- ✅ 更新CHANGELOG.md记录版本更新

#### 🔐 安全增强
- ✅ 数据库密码BCrypt加密（不可逆）
- ✅ JWT签名防篡改（HS256算法）
- ✅ 本地Token加密存储（Electron Store）
- ✅ 登录IP记录和追踪

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