<div align="center">

# LLMctl
**强大的LLM Provider、Token和会话管理桌面应用**

[![Version](https://img.shields.io/badge/version-2.0.3-blue.svg)](https://github.com/3202336152/llmctl-desktop/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/3202336152/llmctl-desktop)

</div>

---

## ✨ 特性

### 核心功能

- 🌐 **多Provider支持** - 支持Claude、OpenAI、Qwen、Gemini等主流LLM Provider
- 🔑 **智能Token管理** - 多Token轮询、健康检查、自动切换
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

### 基础配置

1. **创建Provider**
   - 点击"Provider管理" → "创建Provider"
   - 填写Provider信息（名称、类型、API URL等）
   - 添加至少一个Token

2. **启动会话**
   - 点击"会话管理" → "启动会话"
   - 选择Provider和工作目录
   - 系统自动选择Token并启动终端

详细使用说明请参考 [用户手册](docs/USER_GUIDE.md)

---

## 🎯 核心功能

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

### Token轮询策略

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
- [API文档](docs/api-documentation.md) - 后端API说明
- [架构设计](docs/refactor-architecture.md) - 系统架构设计
- [数据库设计](docs/database-schema.md) - 数据库表结构
- [更新日志](CHANGELOG.md) - 版本更新记录

---

## 🔄 最新更新

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