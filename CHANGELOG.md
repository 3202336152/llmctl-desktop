# Changelog

所有重要的更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [2.2.9] - 2025-11-04

### Improved 🚀
- **终端 UI/UX 优化** - 简化界面，统一操作位置
  - **标签页字体优化**：
    - 标签页文本改为系统默认字体，与操作系统风格更一致
    - 保持浅灰色 (#6b6b6b) 和普通粗细 (font-weight: 500)
  - **工具栏功能集中**：
    - 在右上角工具栏添加"滚动到底部"按钮
    - 统一的操作位置：滚动到底部 → 切换 Token → 外部终端 → 全屏显示
    - 所有终端操作都在工具栏中，操作更集中便捷
  - **涉及文件**：
    - `electron-app/src/renderer/styles/global.css` (375-425行)
    - `electron-app/src/renderer/components/Terminal/TerminalManager.tsx` (10行, 257-266行, 466-507行)
    - `electron-app/src/renderer/components/Terminal/TerminalComponent.tsx` (681-697行)

### Removed ❌
- **删除半圆形悬浮菜单** - 简化界面，减少视觉干扰
  - 移除右下角的半圆形扇形菜单及其所有相关代码
  - 移除菜单状态管理 (`isMenuOpen`, `menuRef`)
  - 移除菜单配置数组和处理函数
  - 删除相关 CSS 样式（约 100 字节）
  - 简化 `TerminalComponentProps` 接口，移除不必要的回调参数
  - **涉及文件**：
    - `electron-app/src/renderer/components/Terminal/TerminalComponent.tsx` (1-11行, 36-44行, 681-697行)
    - `electron-app/src/renderer/components/Terminal/TerminalManager.tsx` (343-366行)
    - `electron-app/src/renderer/styles/global.css` (删除 634-698行的菜单样式)

### Technical Details 🔧
- **组件间通信优化**：
  - 使用 `CustomEvent` 实现 TerminalManager 到 TerminalComponent 的滚动到底部功能
  - 事件名称：`terminal-scroll-to-bottom`
  - 事件数据：`{ sessionId: string }`
  - 优势：解耦组件，避免通过 props 层层传递回调函数

- **代码简化成果**：
  - TerminalComponent.tsx：删除约 80 行菜单相关代码
  - TerminalManager.tsx：删除 24 行回调包装函数
  - global.css：删除 65 行半圆形菜单样式
  - 总计减少约 169 行代码，提升代码可维护性

- **接口简化**：
  ```typescript
  // 重构前
  interface TerminalComponentProps {
    // ... 基础属性
    onSwitchToken?: () => void;
    onOpenExternalTerminal?: () => void;
    onToggleFullscreen?: () => void;
    isFullscreen?: boolean;
  }

  // 重构后
  interface TerminalComponentProps {
    // ... 基础属性（移除所有回调函数）
  }
  ```

## [2.2.8] - 2025-11-04

### Added 🎉
- **Redis 缓存服务架构** - 统一的缓存管理接口，遵循 DRY 原则
  - **新增组件**：
    - `ICacheService.java` - 缓存服务接口，定义统一的缓存操作契约
    - `CacheServiceImpl.java` - 缓存服务实现，提供故障容错和详细日志
  - **设计原则**：
    - 单一职责：缓存逻辑集中管理，业务代码更简洁
    - DRY 原则：消除重复代码，3 处相同的缓存清除逻辑合并为 1 行调用
    - 故障容错：所有 Redis 操作包含 try-catch，失败时优雅降级
  - **功能支持**：
    - Token 可用列表缓存专用方法（get/set/evict）
    - 通用缓存方法（支持任意类型）
    - 批量删除（支持通配符模式）
  - **涉及文件**：
    - `src/main/java/com/llmctl/service/ICacheService.java` (新增)
    - `src/main/java/com/llmctl/service/impl/CacheServiceImpl.java` (新增)
    - `src/main/java/com/llmctl/service/impl/TokenServiceImpl.java` (重构)

- **MCP 配置文件支持** - 完善 MCP 服务器配置的文件参数管理
  - **新增实体字段**：
    - `McpServer.configFilePath` - 配置文件路径（支持 JSON/TOML/YAML 等）
    - `McpServer.configFileContent` - 配置文件内容（TEXT 类型，支持大文件）
  - **应用场景**：
    - Context7 MCP 服务器 API Key 配置（config.json）
    - 其他需要配置文件的 MCP 服务器
  - **后端实现**：
    - 会话启动时自动创建临时配置文件
    - 配置文件路径：`项目目录/.mcp-configs/{mcpServerId}/config.{ext}`
    - 会话结束后自动清理临时文件（可选保留）
  - **前端实现**：
    - MCP 服务器表单新增"配置文件"选项卡
    - 文件路径输入框 + 文件内容编辑器
    - 支持语法高亮（JSON/YAML/TOML）
  - **涉及文件**：
    - `src/main/resources/mapper/McpServerMapper.xml` (修改)
    - `src/main/java/com/llmctl/entity/McpServer.java` (修改)

### Improved 🚀
- **代码质量提升** - TokenServiceImpl 代码量从 640 行减少到 598 行
  - `createToken()` 方法：7 行重复代码 → 1 行调用
  - `updateToken()` 方法：7 行重复代码 → 1 行调用
  - `deleteToken()` 方法：7 行重复代码 → 1 行调用
  - `selectToken()` 方法：28 行手动缓存逻辑 → 8 行清晰调用

- **缓存操作统一性** - 所有缓存操作使用一致的日志格式和错误处理
  - 统一的日志前缀（✅/⚠️）
  - 统一的异常处理策略
  - 统一的缓存 Key 命名规范

- **可扩展性增强** - 未来新增缓存功能只需在 CacheService 中添加方法
  - 避免在业务代码中重复编写缓存逻辑
  - 便于统一升级缓存策略（如迁移到 Caffeine）

### Fixed 🐛
- **Electron 自动更新安装失败** - 修复 Windows 安装程序报错 "LLMctl 无法关闭"
  - **问题**：安装更新时应用无法正常退出，安装程序超时
  - **根本原因**：
    - `autoUpdater.quitAndInstall()` 触发应用退出
    - `before-quit` 事件处理器执行耗时操作（3 秒 API 调用 + 终端清理）
    - Windows 安装程序等待应用关闭超时
  - **修复方案**：
    - `autoUpdater.ts`：更新下载完成后设置 `isUpdating` 全局标记
    - `main.ts`：`before-quit` 处理器检查标记，跳过耗时操作
    - 更新场景下只执行快速同步清理，应用立即退出
  - **优化效果**：安装更新时应用退出时间从 10-30 秒降至 < 100ms
  - **涉及文件**：
    - `electron-app/src/main/services/autoUpdater.ts` (98-110行)
    - `electron-app/src/main/main.ts` (945-961行)

### Documentation 📖
- **Redis 使用指南更新** - `docs/redis-usage-guide.md`
  - 新增章节"5. 缓存服务架构（CacheService）"
  - 详细的代码简化对比表格
  - 设计理念和架构优势说明
  - 更新版本号至 v2.3.1
  - 新增设计原则 #10：DRY 原则

### Technical Details 🔧
- **缓存服务设计模式**：
  - 接口 + 实现分离（ICacheService + CacheServiceImpl）
  - 泛型编程（支持 `<T>` 类型安全）
  - 依赖注入（TokenServiceImpl 注入 ICacheService）
  - 故障容错（try-catch + 日志 + 返回 null/0）

- **代码简化对比**：

| 场景 | 重构前（TokenServiceImpl） | 重构后（使用 CacheService） |
|------|---------------------------|---------------------------|
| 清除缓存 | 7 行代码（try-catch + 日志） | 1 行代码 |
| 读取缓存 | 12 行代码 | 1 行代码 |
| 写入缓存 | 9 行代码 | 1 行代码 |
| 代码重复 | 3 处相同的清除逻辑 | 完全消除重复 |

## [2.2.7] - 2025-11-04

### Fixed 🐛
- **外部终端启动延迟** - 优化外部终端打开响应速度
  - **问题**：点击"切换到外部终端"后，前端 loading 状态持续 30 秒以上
  - **根本原因**：`child_process.exec()` 等待命令执行完成才返回
  - **修复方案**：
    - 使用 `child_process.spawn()` 代替 `exec()`
    - 添加 `detached: true` 参数，让子进程完全独立
    - 使用 `stdio: 'ignore'` 忽略所有输出
    - 调用 `unref()` 立即断开连接
  - **优化效果**：响应时间从 10-30 秒降至 < 10ms
  - **涉及文件**：`electron-app/src/main/main.ts` (827-840行)

- **Electron 终端崩溃** - 修复快速切换页面导致的 "未响应" 问题
  - **问题**：在终端和会话页面快速切换时，Electron 显示"未响应"对话框
  - **根本原因**：
    1. 所有隐藏终端同时变为可见，触发 IntersectionObserver 风暴
    2. 10+ 个终端并发调用 `fitAddon.fit()`，导致 DOM 重排风暴
    3. window.resize 监听器累积，每个终端都注册
  - **修复方案**：
    - 实现全局 fit 锁机制，确保 fit() 串行执行
    - IntersectionObserver 添加三重检查（DOM可见 + 20%阈值 + Redux状态）
    - window.resize 事件添加可见性过滤
    - 增加防抖延迟从 200ms 到 300ms
  - **优化效果**：减少 85% 的 DOM 重排操作，彻底解决崩溃问题
  - **涉及文件**：`electron-app/src/renderer/components/Terminal/TerminalComponent.tsx` (11-538行)

- **MySQL 连接池超时** - 修复后端频繁报 "No operations allowed after connection closed" 错误
  - **问题**：应用空闲一段时间后，数据库操作失败，必须重启后端
  - **根本原因**：application.yml 缺少 HikariCP 连接池配置，MySQL 关闭空闲连接
  - **修复方案**：
    - 添加完整的 HikariCP 配置
    - `keepalive-time: 300000` (5分钟心跳保持连接活跃)
    - `max-lifetime: 1800000` (30分钟重建连接，小于 MySQL 超时)
    - `connection-test-query: SELECT 1` (连接验证)
  - **涉及文件**：`src/main/resources/application.yml` (26-83行)

### Improved 🚀
- **外部终端响应速度** - 点击后立即显示成功消息，无需等待窗口启动完成
- **终端性能** - 大幅减少页面切换时的 CPU 占用和卡顿现象
- **数据库稳定性** - 长时间运行不再出现连接失败，无需手动重启后端服务

### Technical Details 🔧
- **child_process 优化**：spawn + detached + unref 实现完全异步子进程启动
- **全局 fit 锁**：fitQueue 队列 + globalFitLock 标志位，防止并发 fit() 调用
- **HikariCP 配置**：20 个最大连接 + 5 分钟心跳 + 30 分钟最大生命周期

## [2.2.6] - 2025-11-03

### Added 🎉
- **多级日志系统** - 企业级三层日志架构，支持开发、生产、调试三种模式
  - **前端日志**：Electron 主进程 + 渲染进程日志，基于 electron-log
  - **后端日志**：Spring Boot 服务日志，基于 Logback (SLF4J)
  - **日志级别策略**：
    - 开发模式：DEBUG 级别，10MB 文件大小，完整的调试信息
    - 生产模式：ERROR 级别，1MB 文件大小，仅记录错误，减少磁盘占用
    - 调试模式：INFO 级别，5MB 文件大小，启动时添加 `--debug-logs` 参数启用
  - **日志 IPC 通道**：渲染进程日志通过 IPC 传递到主进程，统一写入文件
  - **日志文件路径**：
    - Windows: `%USERPROFILE%\AppData\Roaming\llmctl-desktop\logs\main.log`
    - macOS: `~/Library/Logs/llmctl-desktop/main.log`
    - Linux: `~/.config/llmctl-desktop/logs/main.log`

- **日志管理 UI** - Settings 页面新增日志管理功能
  - **打开日志目录**：一键打开系统日志文件夹
  - **显示日志路径**：弹窗显示完整的日志文件路径
  - **日志说明**：详细的日志级别策略说明和调试模式使用指南
  - **使用提示**：如何通过 `--debug-logs` 参数启用详细日志

- **完整日志操作文档** - `docs/logging-guide.md`
  - **后端日志（CentOS 服务器）**：
    - 日志文件位置和查看命令（tail、journalctl、grep、less）
    - 日志级别配置（临时和永久修改）
    - 日志轮转配置（logrotate）
    - 日志文件管理和清理
  - **前端日志（Electron 应用）**：
    - 跨平台日志路径（Windows/macOS/Linux）
    - 通过 UI 和命令行查看日志
    - 启用调试模式的方法
  - **日志分析技巧**：
    - 快速定位问题（50+ 实用命令）
    - 追踪特定请求
    - 性能分析和错误统计
  - **常见问题排查**：
    - MCP 配置无法写入
    - Token 切换失败
    - 数据库连接失败
    - 日志文件过大
  - **日志管理最佳实践**：
    - 生产环境建议配置
    - 日志轮转策略
    - 日志监控告警脚本
    - 安全注意事项

### Changed 🔄
- **MCP 配置写入日志优化** - 条件日志策略，减少生产环境日志输出
  - `mcpConfigHelper.ts`：
    - 开发环境：记录所有 INFO/WARN 日志，便于调试
    - 生产环境：仅记录 ERROR 日志，减少磁盘占用
    - 错误始终被记录：保证关键问题可追溯
  - 详细的 MCP 配置写入流程日志（开发模式）
  - 跨平台文件写入的完整调用链追踪

- **日志格式统一** - 三层日志使用统一格式
  - 时间戳：`[{y}-{m}-{d} {h}:{i}:{s}.{ms}]`
  - 级别：`[INFO]` / `[WARN]` / `[ERROR]` / `[DEBUG]`
  - 来源标签：`[Renderer]` / `[IPC]` / `[Backend]`

### Improved 🚀
- **生产环境用户体验** - 大幅减少普通用户的日志文件占用
  - 生产模式日志从 10MB 降至 1MB
  - 静默正常操作，仅在出错时记录
  - 支持临时启用详细日志（不需要重新打包应用）

- **开发体验** - 更强大的日志调试能力
  - 详细的 MCP 配置写入日志
  - IPC 通信过程完整记录
  - 文件操作成功/失败的清晰日志
  - 错误堆栈完整保存

## [2.3.0] - 2025-10-30

### Added 🎉
- **MCP 服务器管理** - 完整的 Model Context Protocol 服务器管理功能
  - **模板库**：内置常用 MCP 服务器模板（memory、sqlite、fetch、git、context7）
  - **自定义服务器**：支持创建自定义 MCP 服务器配置
  - **Provider 关联**：为每个 Provider 的不同 CLI 工具配置专属 MCP 服务器
  - **优先级管理**：可调整 MCP 服务器优先级，控制加载顺序
  - **配置预览**：实时预览生成的 MCP 配置 JSON
  - **使用教程**：内置完整的 MCP 使用指南

- **自动配置注入** - 会话启动时自动注入 MCP 配置
  - **Claude Code**：自动生成 `.mcp.json` 文件（项目级配置）
  - **Codex**：自动生成 `.codex/mcp.json` 文件
  - **跨平台兼容**：Windows 系统自动添加 `cmd /c` 包装，支持 npx/npm/yarn/pnpm 命令

- **刷新 MCP 配置** - 新增手动刷新功能
  - **右键菜单操作**：在 Sessions 页面右键会话，选择"刷新 MCP 配置"
  - **即时更新**：不重启会话即可更新 `.mcp.json` 配置文件
  - **智能提示**：自动提示用户重启 CLI 进程使配置生效

### Fixed 🐛
- **Provider MCP 配置重复提交** - 添加/删除 MCP 服务器时防止重复点击
  - 添加 `submitting` 状态管理
  - Modal 显示 `confirmLoading` 加载状态
  - 有效防止网络延迟导致的重复提交

- **MCP 删除确认对话框** - 删除 MCP 服务器时显示详细确认信息
  - 改用 `modal.confirm` 替代简单的 `Popconfirm`
  - 明确告知删除影响：配置移除、Provider 关联失效、需重启会话生效
  - 提升用户删除操作的安全性

- **context7 图标显示** - 修复 context7 MCP 服务器的 search 图标无法显示
  - 在 `iconMap` 中添加 `search: <SearchOutlined />` 映射
  - 所有图标类型均正确渲染

### Changed 🔄
- **菜单顺序调整** - 将 "MCP Servers" 菜单移动到 "Sessions" 上方
  - 新顺序：Providers → Tokens → **MCP Servers** → Sessions → Terminals
  - 更符合逻辑的工作流程：先配置 MCP，再创建会话

## [2.2.3] - 2025-10-29

### Fixed 🐛
- **/resume 命令错误检测误报** - 彻底解决 `/resume` 后触发 Token 错误弹窗问题 ⭐
  - **问题描述**：
    - 用户执行 `/resume` 命令恢复历史对话时，系统错误地检测历史对话中的 Token 错误
    - 触发"当前 Token 已失效"弹窗，提示切换 Token
    - 即使 Token 正常，仍会误报，影响用户体验

  - **根本原因**：
    - 用户通过方向键（↑/↓）选择会话并按回车确认
    - 方向键和回车被误认为"用户再次输入"
    - 错误检测被过早重新启用
    - `/resume` 输出的历史对话内容被检测，触发误报

  - **解决方案 - 三层防护机制**：
    1. **输出检测 `/resume`** (`terminalManager.ts:308-319`)
       - 在终端输出中检测 `/resume` 回显（支持历史命令选择方式）
       - 检测到后立即禁用错误检测，清空缓冲区

    2. **控制键过滤** (`terminalManager.ts:400-420`)
       - 过滤方向键（`\x1b[A/B/C/D`）、回车（`\r`）、退格等控制键
       - 只有真正的文本命令才重新启用错误检测
       - 避免在会话选择过程中误启用检测

    3. **时间戳过滤** (`terminalManager.ts:479-486`)
       - 添加 `errorDetectionEnabledAt` 时间戳字段
       - 只检测错误检测启用之后的输出
       - 防止残留历史输出被误检

  - **技术细节**：
    - 修改文件：`electron-app/src/main/services/terminalManager.ts`
    - 新增字段：`errorDetectionEnabledAt?: number`（记录检测启用时间）
    - 新增字段：`waitingForNextInput: boolean`（等待用户真正输入）
    - 删除废弃代码：`RESUME_COMPLETION_PATTERNS` 常量和相关复杂逻辑

  - **用户体验提升**：
    - 清理冗余调试日志，控制台输出简洁明了
    - `/resume` 命令执行流畅，不再有误报弹窗
    - 错误检测仍然有效，真正的 Token 错误依然能被准确捕获

- **外部终端临时文件清理** - 修复 `.llmctl-temp` 目录未自动删除问题
  - **问题描述**：
    - 使用"外部终端"功能后，工作目录下会残留 `.llmctl-temp/launch-{timestamp}.bat` 文件和空文件夹
    - 影响用户体验，项目目录显得杂乱

  - **根本原因**：
    - 批处理文件（.bat）在5秒后被正确删除
    - 但 `.llmctl-temp` 空目录本身没有被清理
    - 导致用户可见空文件夹残留

  - **解决方案**：
    - 在删除批处理文件后，检查 `.llmctl-temp` 目录是否为空
    - 如果为空，则自动删除该目录
    - 同时处理成功和失败两种情况，确保完整清理

  - **技术细节**：
    - 修改文件：`electron-app/src/main/main.ts` (720-747行)
    - 使用 `fs.readdirSync()` 检查目录是否为空
    - 使用 `fs.rmSync({ recursive: true, force: true })` 删除空目录
    - 添加详细的清理日志便于追踪

  - **用户体验提升**：
    - 外部终端使用后无残留文件，对用户无感知
    - 工作目录保持整洁，不会积累临时文件夹
    - 异常情况下也能正确清理，避免垃圾文件堆积

## [2.2.1] - 2025-10-23

### Added 🎉
- **Codex 会话配置隔离** - 实现会话级别的配置管理
  - **会话独立配置目录**：每个 Codex 会话使用独立的配置目录 `.codex-sessions/{sessionId}/`
  - **配置文件隔离**：每个会话包含独立的 config.toml、auth.json 和对话历史（sessions/）
  - **环境变量自动配置**：后端自动设置 `CODEX_HOME` 环境变量指向会话配置目录
  - **解决配置冲突**：多个会话可在同一工作目录中并行运行，不会相互干扰

- **归档管理系统** - Settings 页面新增 Codex 归档管理功能
  - **归档目录结构**：归档会话存储在 `.codex-sessions/archived/{sessionId}/` 目录
  - **智能目录选择**：支持通过文件夹选择对话框选择项目根目录
  - **自动路径检测**：智能检测用户是否误选归档目录，自动修正为项目根目录
  - **清理选项**：提供 10天、20天、30天和全部归档的清理选项
  - **归档统计展示**：
    - 显示归档目录占用的磁盘空间
    - 显示归档会话数量
    - 列出所有可恢复的归档会话（会话ID、归档时间、大小、天数）
  - **批量清理**：支持按时间范围批量删除归档会话

- **Electron API 增强** - 新增文件系统操作 API
  - `getDirectorySize(dirPath)` - 递归计算目录大小
  - `listArchives(workingDirectory)` - 列出归档会话列表
  - `cleanArchives(workingDirectory, days)` - 按时间范围清理归档（days=0 表示全部）

### Fixed 🐛
- **归档路径优化** - 将归档目录从项目根目录的 `.codex-sessions-archived/` 移动到 `.codex-sessions/archived/`
  - 避免项目根目录文件混乱
  - 保持归档在 Codex 配置目录内，便于统一管理
- **UI 高度一致性** - 修复归档管理 Modal 中统计卡片高度不一致问题
  - 统一所有统计卡片的 `minHeight: '120px'`
  - 统一字体大小 `fontSize: '18px'`
  - 将完整工作目录路径移至 Tooltip，避免卡片高度变化

### Changed 📝
- **Codex 配置管理架构升级**：
  - 旧方案：每个项目使用单一 `.codex/` 目录存储配置
  - 新方案：每个会话使用独立的 `.codex-sessions/{sessionId}/` 目录
  - 优势：支持同一项目中多个 Codex 会话并行运行，互不干扰
  - 迁移：旧会话仍使用旧配置路径，新会话自动使用新方案

## [2.2.0] - 2025-10-23

### Added 🎉
- **Provider 配置分离架构** - 重大架构升级，提升扩展性和维护性
  - **数据库表结构变更**：
    - `providers` 表简化：只保留核心字段（id、name、description、types、策略配置等）
    - 新增 `provider_configs` 表：存储 CLI 专用配置，支持一对多关系
    - 删除 providers 表的冗余字段（baseUrl、modelName、maxTokens等10+个CLI专用字段）
    - 使用 JSON 字段存储配置数据，灵活支持不同 CLI 的配置结构

  - **后端实现**：
    - 新增 `ProviderConfig.java` 实体类，支持 CliType 枚举（claude code、codex、gemini、qoder）
    - 新增 `ProviderConfigMapper` 接口和 XML 映射文件
    - 新增 `CliTypeHandler.java` 自定义 MyBatis TypeHandler，处理带空格的枚举值
    - `Provider.java` 简化，添加 `configs` 字段关联配置列表
    - Service 层使用 `@Transactional` 处理 Provider 和配置的级联创建/更新
    - 优化查询性能：使用 JOIN 查询一次性获取 Provider 及其配置

  - **前端实现**：
    - 更新 TypeScript 类型定义，添加 `ProviderConfig` 接口
    - 更新 `Provider` 接口，添加 `configs` 数组字段
    - 重写 `ProviderManager.tsx` 表单提交逻辑，动态构建配置数据
    - 优化表单编辑逻辑，从 `configs` 数组中提取对应配置数据回填
    - 表格显示优化，展示所有配置的 CLI 类型

  - **Codex 配置优化**：
    - 简化 auth.json 输入，自动生成默认结构
    - 前端只需输入 config.toml 内容
    - 后端自动生成 auth.json 模板并注入 API Token
    - 添加 `CODEX_HOME` 环境变量支持，指向项目 `.codex` 目录
    - 修复 Codex CLI 读取系统配置而不是项目配置的问题

  - **数据迁移**：
    - 创建迁移脚本：`migration_v2.3.0_split_configs.sql`
    - 自动将 providers 表的 CLI 专用字段迁移到 provider_configs 表
    - 保持数据完整性和一致性
    - 支持回滚操作

- **详细配置验证日志** - 增强 Codex 配置文件创建的可追踪性
  - 配置文件写入后立即验证文件是否存在
  - 输出配置文件大小和内容预览（前200字符）
  - 便于排查配置文件创建失败问题

### Fixed 🐛
- **修复 Redux sessionId 不匹配导致的 404 错误** ⭐
  - **问题描述**：
    - 后端创建新会话 `session_72d985f9b3e1402d9a62c4df2a98dd11`
    - 前端却尝试访问旧的 `session_9cc488ff590b4ab9bb3777199af1d134`
    - 导致获取会话环境变量时返回 404 错误

  - **根本原因**：
    - Redux store 中的 `createdTerminalSessions` 数组包含过期的 sessionId
    - `TerminalManager.tsx` 会为所有 `createdTerminalSessions` 中的 ID 创建 TerminalComponent
    - 即使会话已删除，旧的 sessionId 仍然留在数组中

  - **解决方案**：
    - 修改 `sessionSlice.ts` 的 `setSessions` action，添加自动清理逻辑
    - 对比后端返回的有效会话 ID，过滤掉无效的 sessionId
    - 清理 `createdTerminalSessions`、`openTerminalSessions`、`terminalSessionData`
    - 重置 `activeTabKey` 如果当前激活的标签已无效
    - 添加详细的控制台日志，便于追踪清理过程

  - **修复效果**：
    - 前端不再尝试访问不存在的会话
    - 终端组件只为有效会话创建实例
    - 会话列表刷新时自动清理过期状态

  - **涉及文件**：
    - `sessionSlice.ts` (33-66行) - 添加清理逻辑
    - `TerminalComponent.tsx` (52-60行) - 添加 404 错误处理
    - `SessionServiceImpl.java` (334-353行) - 添加重试逻辑

- **修复 Codex CLI 读取系统配置而不是项目配置的问题**
  - **问题描述**：Codex CLI 默认读取 `~/.codex/config.toml`，忽略项目目录配置
  - **解决方案**：添加 `CODEX_HOME` 环境变量，指向项目 `.codex` 目录
  - **实现细节**：
    - 修改 `SessionServiceImpl.buildEnvironmentVariables()` 方法签名，添加 `workingDirectory` 参数
    - 在 Codex 配置分支中设置 `CODEX_HOME = {workingDirectory}/.codex`
    - Codex CLI 会优先读取 `CODEX_HOME` 指定目录下的配置文件
  - **修复效果**：每个项目使用独立的 Codex 配置，互不干扰
  - **涉及文件**：`SessionServiceImpl.java` (352, 364, 404-421行)

- **修复 Provider 编辑时 Claude Code 配置不显示的问题**
  - **问题描述**：编辑 Provider 时，Codex 配置可以正常回填，但 Claude Code 配置无法显示
  - **根本原因**：TypeScript `CliConfig` 接口的 `cliType` 类型定义错误（使用了 `'claude'` 而不是 `'claude code'`）
  - **解决方案**：修正类型定义为 `'claude code' | 'codex' | 'gemini' | 'qoder'`
  - **涉及文件**：`types/index.ts`

### Changed 🎨
- **Provider 表单 UI 优化**：
  - 类型选择改为 Select 下拉多选框，替代原来的 Checkbox.Group
  - 提升用户体验，多选操作更流畅
  - 根据选中类型动态显示对应的配置表单

- **Gemini 和 Qoder 配置禁用**：
  - 在类型选择中添加 disabled 状态
  - 显示"暂未适配"提示信息
  - 为将来实现预留接口

### Technical Details 🔧
- **数据库设计**：
  ```sql
  -- providers 表（简化版）
  CREATE TABLE `providers` (
    `id` VARCHAR(50) PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `types` JSON NOT NULL,  -- ["claude code", "codex"]
    `token_strategy_type` ENUM(...),
    `token_fallback_on_error` TINYINT(1),
    `is_active` TINYINT(1) DEFAULT 1,
    ...
  );

  -- provider_configs 表（新增）
  CREATE TABLE `provider_configs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `provider_id` VARCHAR(50) NOT NULL,
    `cli_type` ENUM('claude code', 'codex', 'gemini', 'qoder') NOT NULL,
    `config_data` JSON NOT NULL,
    ...,
    UNIQUE KEY (`provider_id`, `cli_type`),
    FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE
  );
  ```

- **配置数据结构（JSON）**：
  ```json
  // Claude Code 配置
  {
    "baseUrl": "https://api.anthropic.com/v1",
    "modelName": "claude-3-5-sonnet-20241022",
    "maxTokens": 8192,
    "temperature": 0.7
  }

  // Codex 配置
  {
    "configToml": "model = \"gpt-4-turbo\"\n...",
    "authJson": "{\"OPENAI_API_KEY\": \"${API_KEY}\"}"
  }
  ```

- **后端修改文件**：
  - `ProviderConfig.java` (新增) - 配置实体类
  - `ProviderConfigMapper.java` (新增) - 数据访问接口
  - `ProviderConfigMapper.xml` (新增) - MyBatis 映射文件
  - `CliTypeHandler.java` (新增) - 自定义枚举类型处理器
  - `Provider.java` - 简化字段，添加 configs 关联
  - `ProviderServiceImpl.java` - 重写创建/更新/查询逻辑
  - `SessionServiceImpl.java` - 添加 CODEX_HOME 环境变量，修复配置读取
  - `CreateProviderRequest.java` - 更新 DTO 结构
  - `UpdateProviderRequest.java` - 更新 DTO 结构

- **前端修改文件**：
  - `types/index.ts` - 新增 ProviderConfig 接口，修正 CliType 类型
  - `ProviderManager.tsx` - 完整重写表单提交和编辑逻辑
  - `sessionSlice.ts` - 添加 Redux 状态自动清理逻辑
  - `terminalManager.ts` - 添加配置文件验证日志

- **数据库迁移文件**：
  - `migration_v2.3.0_split_configs.sql` - 完整的迁移脚本

### Architecture 🏗️
- **优势对比**：
  | 特性 | 旧方案 | 新方案 |
  |------|--------|--------|
  | 扩展性 | ❌ 每增加 CLI 需要 ALTER TABLE | ✅ 只需插入新记录 |
  | 表结构 | ❌ 字段冗余（10+ 个 CLI 专用字段） | ✅ 核心表只有 8 个字段 |
  | 维护性 | ❌ 字段语义混乱 | ✅ 职责清晰 |
  | 查询性能 | ✅ 直接查询，无 JOIN | ⚠️ 需要 JOIN（可接受） |
  | 配置灵活性 | ❌ 字段固定 | ✅ JSON 灵活配置 |

- **设计原则**：
  - **单一职责**：providers 表只管理核心信息，配置独立存储
  - **开闭原则**：新增 CLI 类型无需修改表结构，只需插入新配置
  - **依赖倒置**：Service 层依赖抽象的配置接口，而不是具体字段

### Documentation 📖
- 新增完整的架构文档：`docs/provider-config-separation-guide.md`
  - 架构设计说明
  - 数据库表结构设计
  - 后端实现指南（实体类、Service、Mapper）
  - 前端实现指南（TypeScript类型、表单逻辑）
  - 数据迁移步骤
  - FAQ 和最佳实践
- 更新 `CHANGELOG.md` - 记录 v2.3.0 所有变更
- 更新 `README.md` - 添加架构升级说明

### Breaking Changes ⚠️
- **数据库结构变更**：必须执行迁移脚本 `migration_v2.3.0_split_configs.sql`
- **API 接口变更**：Provider 创建/更新接口的请求体结构变化
- **前端类型定义变更**：Provider 接口新增 `configs` 字段，移除 CLI 专用字段

### Migration Guide 📋
1. **备份数据库**：
   ```bash
   mysqldump -u llmctl -p llmctl > llmctl_backup_$(date +%Y%m%d).sql
   ```

2. **执行迁移脚本**：
   ```bash
   mysql -u llmctl -p llmctl < src/main/resources/db/migration_v2.3.0_split_configs.sql
   ```

3. **验证数据迁移**：
   ```sql
   -- 检查 provider_configs 表
   SELECT COUNT(*) FROM provider_configs;

   -- 检查数据完整性
   SELECT p.id, p.name, COUNT(pc.id) AS config_count
   FROM providers p
   LEFT JOIN provider_configs pc ON p.id = pc.provider_id
   GROUP BY p.id;
   ```

4. **重启后端应用**：新的实体类和 Mapper 生效

5. **清除前端缓存**：确保使用最新的 TypeScript 类型定义

## [2.1.7] - 2025-10-17

### Added 🎉
- **暗色主题功能** - 完整的深色模式支持
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

### Changed 🎨
- **主题系统架构优化**：
  - 将主题状态管理提升到 App 组件
  - ConfigProvider 动态传递主题配置
  - 通过 settings-changed 事件实现实时更新
  - 前后端状态完全同步

- **Settings 组件增强**：
  - 保存设置后触发全局主题更新事件
  - 更好的用户反馈机制

### Technical Details 🔧
- **前端修改文件**：
  - `theme.ts` (92-208行) - 新增完整 darkTheme 配置
  - `App.tsx` - 实现动态主题切换逻辑
    - 新增 currentTheme 状态管理（525行）
    - 新增主题加载逻辑（528-549行）
    - 添加 settings-changed 事件监听器（545-554行）
    - ConfigProvider 动态传递主题（558行）
  - `Settings.tsx` (119-120行) - 触发 settings-changed 事件

- **主题配置内容**：
  - **Token配置**：
    - 主题色系（primary、success、warning、error、info）
    - 背景色系（container、elevated、layout）
    - 文字颜色系（text、textSecondary、textTertiary）
    - 边框颜色系（border、borderSecondary）
    - 圆角、字体、间距、高度、阴影等

  - **组件配置**：
    - Layout（header、body、sider背景）
    - Button（阴影效果）
    - Card（背景、边框、阴影）
    - Table（header、hover、边框）
    - Input（边框、背景）
    - Select（选项背景）
    - Tabs（hover、selected）
    - Modal（背景）
    - Dropdown（背景）
    - Menu（背景、选中、hover）

- **主题切换流程**：
  ```
  Settings 保存 → 后端更新 app.theme 配置
  → 触发 settings-changed 事件
  → App 重新加载配置
  → setCurrentTheme('dark')
  → ConfigProvider 使用 darkTheme
  → 全局 UI 更新
  ```

### User Experience 🌟
- **视觉舒适性提升**：
  - 夜间模式保护眼睛，减少蓝光刺激
  - 暗色背景降低屏幕亮度
  - 文字对比度适中，易于阅读

- **个性化定制**：
  - 用户自由选择喜欢的主题
  - 主题偏好跨设备同步
  - 满足不同场景使用需求

### Compatibility 🔄
- **向后兼容性**：
  - 未设置主题的用户默认使用亮色主题
  - 不影响现有用户配置
  - 平滑升级无需手动调整

### Documentation 📖
- 更新 `CHANGELOG.md` - 记录 v2.1.7 所有变更
- 更新 `README.md` - 添加暗色主题功能说明
- 更新 `CLAUDE.md` - 同步项目版本信息

## [2.1.6] - 2025-10-17

### Added 🎉
- **会话表格优化** - 全面提升 Sessions 页面用户体验
  - **会话名称优化**：
    - 显示格式改为 `Provider名 - 项目名 #序号`
    - 自动从工作目录提取项目名（最后一个文件夹名）
    - 同项目单个会话时不显示序号
    - 同项目多个会话时按时间顺序自动编号
    - Tooltip 显示完整会话ID和命令信息

  - **时间信息增强**：
    - 相对时间显示：刚刚、N分钟前、N小时前、昨天、N天前、N周前、N月前、N年前
    - 持续时间计算：显示会话运行时长（天、小时、分钟）
    - Tooltip 显示完整时间信息（开始时间、最后活动、持续时间）

  - **工作目录优化**：
    - 显示格式：`项目名 (路径层级)`
    - 智能路径提示：显示最后3层路径或完整路径
    - Tooltip 显示完整工作目录路径

  - **表格列优化**：
    - 删除 Provider 列（已集成到会话名称）
    - 删除命令列（已集成到会话名称 Tooltip）
    - 合并时间列为单一"时间信息"列
    - 更紧凑的表格布局，信息密度更高

- **快捷操作功能** - 便捷的会话管理
  - **右键菜单**：
    - 打开终端 / 重新启动（根据状态自适应）
    - 复制会话ID
    - 复制工作目录
    - 在文件管理器中打开（跨平台支持：Windows资源管理器/macOS Finder/Linux文件管理器）
    - 终止会话 / 删除会话（根据状态自适应）
  - **双击打开终端**：双击任意会话行即可打开终端

- **命令选择优化** - 更安全的命令输入
  - 将命令输入框改为下拉选择框
  - 提供 4 个 CLI 命令选项：
    - `claude` - Claude Code CLI
    - `codex` - Codex CLI
    - `gemini` - Gemini CLI
    - `qoder` - Qoder CLI
  - 添加必填验证，确保用户必须选择命令
  - 保持与 Provider 选择的自动联动（自动填充对应命令）

- **刷新按钮** - 手动刷新会话列表
  - 在卡片顶部添加刷新按钮
  - 显示加载状态
  - 一键更新所有会话信息

### Changed 🎨
- **Sessions 页面交互优化**：
  - 更直观的会话名称显示，易于区分不同项目和会话
  - 更友好的时间信息展示，一目了然掌握会话状态
  - 更紧凑的表格布局，提升信息浏览效率
  - 更便捷的快捷操作，减少操作步骤

- **命令输入安全性提升**：
  - 避免用户输入错误的命令名称
  - 标准化 CLI 命令选项
  - 统一的下拉选择交互方式

### Fixed 🐛
- **修复右键菜单"在文件管理器中打开"报错**
  - 问题：使用 `openExternal` 打开文件夹在 Windows 上失败
  - 原因：`openExternal` 不支持 `file://` 协议打开本地文件夹
  - 修复：
    - 在 preload.ts 中新增 `openPath(path: string)` API
    - 在 main.ts 中添加 `ipcMain.handle('open-path')` 处理器
    - 使用 Electron 的 `shell.openPath()` API（跨平台支持）
  - 涉及文件：`preload.ts:22,91`、`main.ts:260-270`、`SessionManager.tsx:483`

### Technical Details 🔧
- **前端修改文件**：
  - `SessionManager.tsx` - 核心优化文件
    - 新增常量：`PROVIDER_COMMAND_MAP` - Provider 到命令的映射
    - 新增函数：`extractProjectName()` - 提取项目名
    - 新增函数：`getSessionNumber()` - 计算会话序号
    - 新增函数：`getSessionDisplayName()` - 生成会话显示名称
    - 新增函数：`getRelativeTime()` - 计算相对时间
    - 新增函数：`getSessionDuration()` - 计算会话持续时间
    - 新增函数：`formatWorkingDirectory()` - 格式化工作目录显示
    - 新增函数：`copyToClipboard()` - 复制到剪贴板
    - 新增函数：`getContextMenu()` - 生成右键菜单
    - 优化：重写 `columns` 定义，删除冗余列，优化信息展示
    - 优化：修改命令输入为 Select 下拉选择框
    - 优化：添加 `onRow` 双击处理器

  - `preload.ts` - 新增 openPath API
    - 类型定义：`openPath(path: string): Promise<void>`
    - IPC 调用：`ipcRenderer.invoke('open-path', pathToOpen)`

- **后端修改文件**：
  - `main.ts` - 新增 IPC 处理器
    - `ipcMain.handle('open-path')` - 在文件管理器中打开路径
    - 使用 `shell.openPath(path)` 实现跨平台支持

- **跨平台支持**：
  - `shell.openPath()` API 在所有平台均可正常工作
  - Windows: 在文件资源管理器中打开
  - macOS: 在 Finder 中打开
  - Linux: 在默认文件管理器中打开

### User Experience 🌟
- **信息浏览效率提升**：
  - 会话名称更有意义，快速识别项目和序号
  - 时间信息更直观，相对时间 + 持续时间双重展示
  - 工作目录更简洁，突出项目名和路径层级

- **操作便捷性提升**：
  - 右键菜单集成常用操作，无需记忆快捷键
  - 双击打开终端，减少点击次数
  - 下拉选择命令，避免输入错误

- **视觉体验优化**：
  - 表格布局更紧凑，信息密度适中
  - Tooltip 提供详细信息，保持界面简洁
  - 图标和颜色标识，提升可读性

### Documentation 📖
- 更新 `CHANGELOG.md` - 记录 v2.1.6 所有变更
- 更新 `README.md` - 添加新功能说明
- 更新 `CLAUDE.md` - 同步项目版本信息

## [2.1.5] - 2025-10-16

### Changed 🔄
- **Provider 类型重构** - 从 API 服务商改为 CLI 工具类型分类
  - **新的 Provider 类型支持**：
    - `claude code` - Claude Code CLI 工具
    - `codex` - Codex CLI 工具
    - `gemini` - Google Gemini CLI 工具
    - `qoder` - Qoder CLI 工具
  - **移除的旧类型**：
    - `anthropic` - 已合并到 `claude code`
    - `openai` - 已合并到 `codex`
    - `qwen` - 已移除（不支持对应的 CLI 工具）

### 🔧 环境变量命名规则统一
- **Claude Code 环境变量**：
  ```bash
  ANTHROPIC_AUTH_TOKEN=your_token
  ANTHROPIC_BASE_URL=https://api.anthropic.com
  ANTHROPIC_MODEL=claude-3-sonnet-20240229
  CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096
  ```

- **Codex 环境变量**：
  ```bash
  CODEX_API_KEY=your_token
  CODEX_BASE_URL=https://api.openai.com
  CODEX_MODEL=code-davinci-002
  CODEX_MAX_TOKENS=4096
  CODEX_TEMPERATURE=0.7
  ```

- **Gemini 环境变量**：
  ```bash
  GOOGLE_API_KEY=your_token
  GOOGLE_BASE_URL=https://generativelanguage.googleapis.com
  GEMINI_MODEL=gemini-pro
  GEMINI_MAX_TOKENS=4096
  GEMINI_TEMPERATURE=0.7
  ```

- **Qoder 环境变量**：
  ```bash
  QODER_API_KEY=your_token
  QODER_BASE_URL=https://api.qoder.com
  QODER_MODEL=qoder-latest
  QODER_MAX_TOKENS=4096
  QODER_TEMPERATURE=0.7
  ```

### 🏗️ 数据库和后端修改
- **数据库表结构**：
  - `providers` 表注释更新为新的 CLI 工具类型
  - 移除 `max_output_tokens` 字段（已删除）

- **后端验证规则**：
  - `CreateProviderRequest.java` - 更新正则表达式：`^(claude code|codex|gemini|qoder)$`
  - 错误消息更新：`Provider类型必须是：claude code, codex, gemini, qoder 之一`

- **统计功能更新**：
  - `ProviderController.java` - 统计接口更新为新的类型计数
  - `ProviderStatistics` 类字段更新：
    - `claudeCodeCount` 替代 `anthropicCount`
    - `codexCount` 替代 `openaiCount`
    - `qoderCount` 替代 `qwenCount`
    - `geminiCount` 保持不变

- **环境变量构建逻辑统一**：
  - `ConfigServiceImpl.java` - 导出配置时使用新的环境变量规则
  - `SessionServiceImpl.java` - 会话启动时使用统一的环境变量命名
  - 两个 Service 中的环境变量命名规则完全一致

### 🎨 前端界面更新
- **类型定义更新**：
  - `types/index.ts` - Provider 接口类型更新为 `'claude code' | 'codex' | 'gemini' | 'qoder'`

- **UI 组件更新**：
  - `ProviderManager.tsx` - 类型选项和颜色映射更新
  - 类型标签颜色：`claude code`(蓝色)、`codex`(绿色)、`gemini`(紫色)、`qoder`(橙色)

- **帮助文档同步**：
  - `Help.tsx` - 更新支持的 Provider 类型和功能描述
  - 关键词更新为：`['provider', '服务商', '配置', 'claude code', 'codex', 'gemini', 'qoder']`

### 🔄 实体类和 DTO 更新
- **删除的文件**：
  - `ProviderTemplate.java` - Provider模板实体类
  - `ProviderTemplateMapper.java` - Provider模板数据访问接口
  - `ProviderTemplateMapper.xml` - Provider模板 XML 映射文件
  - `ProviderTemplateServiceImpl.java` - Provider模板服务实现
  - `IProviderTemplateService.java` - Provider模板服务接口
  - `ProviderTemplateController.java` - Provider模板控制器
  - `ProviderTemplateDTO.java` - Provider模板数据传输对象

- **保留的数据库结构**：
  - `provider_templates` 表结构保留（未删除），以备将来需要重新实现模板功能

### ⚠️ 破坏性变更
- **配置兼容性**：现有的 Provider 配置需要手动更新类型
- **环境变量**：CLI 工具需要使用新的环境变量名称
- **API 接口**：创建 Provider 时必须使用新的类型值

### 📋 修改文件清单
#### **数据库文件**：
- `src/main/resources/db/schema.sql` - 更新 providers 表注释

#### **后端 Java 文件**：
- `src/main/java/com/llmctl/entity/Provider.java` - 更新类型注释
- `src/main/java/com/llmctl/dto/CreateProviderRequest.java` - 更新验证规则
- `src/main/java/com/llmctl/dto/UpdateProviderRequest.java` - 更新验证规则
- `src/main/java/com/llmctl/dto/ProviderDTO.java` - 更新类型注释
- `src/main/java/com/llmctl/controller/ProviderController.java` - 更新统计方法
- `src/main/java/com/llmctl/service/impl/ConfigServiceImpl.java` - 更新环境变量构建
- `src/main/java/com/llmctl/service/impl/SessionServiceImpl.java` - 更新环境变量构建
- `src/main/resources/mapper/ProviderMapper.xml` - 移除 `max_output_tokens` 字段映射

#### **前端 TypeScript 文件**：
- `electron-app/src/renderer/types/index.ts` - 更新 Provider 接口类型

#### **前端 React 文件**：
- `electron-app/src/renderer/components/Provider/ProviderManager.tsx` - 更新类型选项和颜色映射

#### **文档文件**：
- `electron-app/src/renderer/components/Help/Help.tsx` - 更新支持的 Provider 类型

### 🎯 技术目标
- **CLI 工具导向**：Provider 类型分类更符合实际 CLI 工具使用场景
- **环境变量标准化**：每个 CLI 工具使用其官方推荐的环境变量命名
- **类型安全**：前后端类型定义完全一致，避免类型错误
- **向后兼容**：保留数据库表结构，为将来的模板功能预留空间

### 🔍 测试建议
- 创建新的 Provider 测试所有 4 种类型
- 验证环境变量导出功能是否正确
- 确认会话启动时环境变量传递正常
- 检查统计功能是否准确反映新的类型分布

## [2.1.5] - 2025-10-16

### Added 🎉
- **外部终端环境变量传递功能** - 完整的配置同步体验
  - **环境变量自动获取**：
    - 外部终端打开时自动获取当前会话的环境变量
    - 包含 Provider 配置的 `ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_BASE_URL` 等
    - 通过 `/sessions/{sessionId}/environment` API 接口获取
    - 支持所有 Provider 类型（Anthropic、OpenAI、Qwen、Gemini）

  - **跨平台环境变量注入**：
    - **Windows**: 使用 `set "变量名=值" &&` 语法设置环境变量
    - **macOS/Linux**: 使用 `export 变量名="值" &&` 语法设置环境变量
    - 自动转义特殊字符，防止命令注入
    - 确保外部终端使用与内部终端相同的配置

  - **错误容错机制**：
    - 获取环境变量失败时仍能正常打开外部终端
    - 友好的用户提示，告知使用系统默认配置
    - 完整的错误日志记录，便于问题排查

### Changed 🎨
- **终端重启逻辑优化** - 彻底解决黑屏和卡死问题
  - **根本原因修复**：
    - 重新激活会话时删除旧会话记录，创建全新会话
    - 避免 terminalManager 误判为 `/resume` 操作
    - 确保 sessionId 唯一性，防止状态混乱
  - **用户体验提升**：
    - 重启后终端界面正常显示，无黑屏
    - 终端响应正常，无系统卡死
    - 会话状态管理更加稳定可靠

### Technical Details 🔧
- **前端修改文件**：
  - `TerminalManager.tsx` - 新增环境变量获取逻辑（299-312行）
  - `SessionManager.tsx` - 优化重启逻辑，删除旧会话创建新会话
  - `preload.ts` - 更新 `openExternalTerminal` 接口类型定义

- **后端修改文件**：
  - `main.ts` - 更新 IPC 处理器，支持环境变量参数注入（197-235行）
  - `SessionController.java` - 提供环境变量获取接口
  - `ConfigServiceImpl.java` - `buildEnvironmentVariables` 方法构建 Provider 环境变量

- **API 接口变更**：
  - `GET /sessions/{sessionId}/environment` - 获取会话环境变量
  - `open-external-terminal` IPC 支持 `env?: Record<string, string>` 参数

### Security 🔐
- **环境变量安全处理**：
  - 特殊字符自动转义，防止命令注入攻击
  - 跳过内部变量（如 `CHCP`），仅传递业务相关变量
  - 完整的类型检查，确保参数安全性

### Documentation 📖
- 更新 `CHANGELOG.md` - 记录外部终端环境变量功能实现
- 更新 `CLAUDE.md` - 添加新功能说明和技术细节

## [2.1.4] - 2025-10-16

### Added 🎉
- **用户资料管理功能** - 完整的个人信息编辑和头像上传
  - **个人信息编辑**：
    - 支持修改显示名称（displayName）
    - 支持绑定/更新邮箱地址（email）
    - 实时显示当前登录用户信息
    - 修改后自动更新本地存储和界面显示

  - **头像上传功能**：
    - 支持上传 JPG、JPEG、PNG、GIF 格式图片
    - 文件大小限制 2MB
    - 自动生成唯一文件名（时间戳+原文件名）
    - 跨平台路径处理（Windows开发/Linux生产）
    - 头像实时预览和更新
    - 完整的错误提示和上传状态显示

  - **密码修改功能**：
    - 邮箱验证码验证机制（需先绑定邮箱）
    - 三层安全验证：邮箱绑定检查 → 邮箱一致性验证 → 验证码验证
    - 支持新增的 `CHANGE_PASSWORD` 验证码用途
    - 详细的错误提示和用户引导
    - 修改成功后自动跳转到登录页面

### Changed 🎨
- **登录响应优化** - 返回完整用户信息
  - `LoginResponse` 新增 `email` 和 `avatarUrl` 字段
  - 登录和刷新 Token 接口同步返回用户资料
  - 前端自动保存到本地存储，减少额外查询

- **术语优化：将"显示名称"改为"昵称"**
  - 更符合中文用户习惯的表述
  - 涉及文件：
    - `UserProfile.tsx` - UI 标签文本
    - `User.java`, `LoginResponse.java`, `RegisterRequest.java`, `UpdateProfileRequest.java`, `UserInfoDTO.java` - Java 注释
    - `schema.sql` - 数据库字段注释

- **菜单项优化：移除"重新加载(Ctrl+R)"**
  - 问题：该快捷键过于容易误触，导致用户体验下降
  - 保留"强制重新加载"功能
  - 涉及文件：`menu.ts` - 删除 reload 菜单项和翻译

- **静态资源配置** - 支持头像文件HTTP访问
  - 新增 `WebConfig` 静态资源处理器
  - 开发环境：`/uploads/**` 映射到项目 `uploads/avatars/` 目录
  - 生产环境：通过环境变量配置绝对路径
  - 公开访问（不需要JWT认证）
  - 缓存时间 1 小时

- **JWT拦截器优化** - 精确控制公开接口
  - `/uploads/**` 路径排除在JWT验证之外
  - 其他 `/auth/*` 接口仍需要认证
  - 公开接口白名单：login, register, refresh, send-verification-code, verify-code

### Fixed 🐛
- **修复 Authorization Header 缺失问题**
  - 问题：`/auth/profile` 等接口无法获取 JWT Token
  - 原因：httpClient.ts 错误地排除了所有 `/auth/*` 路径
  - 修复：改为白名单机制，只排除真正的公开接口
  - 涉及文件：`httpClient.ts`

- **修复邮箱不显示问题**
  - 问题：个人信息页面邮箱字段为空
  - 原因：后端登录接口未返回 `email` 和 `avatarUrl`
  - 修复：`LoginResponse` 新增字段，登录时返回完整信息
  - 涉及文件：`LoginResponse.java`, `AuthServiceImpl.java`

- **修复头像不实时更新问题**
  - 问题：上传头像后，TopBar 右上角头像不更新
  - 原因：TopBar 使用 const currentUser，未监听 localStorage 变化
  - 修复：
    - 改用 useState 管理 currentUser 状态
    - 添加 storage 事件监听器
    - 添加 0.5s 轮询检测作为 fallback
    - Avatar 组件使用 avatarUrl 作为 src
  - 涉及文件：`TopBar.tsx:7-50`

- **修复修改密码逻辑：未绑定邮箱时应先提示绑定邮箱**
  - 问题：用户未绑定邮箱时，仍可输入任意邮箱发送验证码
  - 原因：缺少邮箱绑定状态的前置检查
  - 修复：
    - 点击"修改"按钮时检查 `userInfo?.email` 是否存在
    - 未绑定邮箱时，提示"请先在个人信息中绑定邮箱"并自动切换到编辑模式
    - 修改密码表单的邮箱字段设置为 disabled，防止输入错误邮箱
  - 涉及文件：`UserProfile.tsx:286-291`

- **修复验证码用途验证失败**
  - 问题：发送修改密码验证码时报错"无效的验证码用途"
  - 原因：`CHANGE_PASSWORD` 未添加到枚举和验证规则
  - 修复：
    - `SendVerificationCodeRequest.java` - 添加 CHANGE_PASSWORD 到验证规则
    - `EmailVerificationCode.java` - 添加 CHANGE_PASSWORD 枚举值
    - `schema.sql` - 更新数据库表定义
    - **数据库迁移**：创建 `add_change_password_purpose.sql` 迁移脚本

- **修复文件上传路径问题**
  - 问题：Windows 开发环境无法识别 Linux 绝对路径格式
  - 原因：路径处理未考虑跨平台兼容性
  - 修复：
    - 使用 `File.isAbsolute()` 检测路径类型
    - 相对路径自动转换为项目相对路径
    - 绝对路径直接使用（生产环境）
    - 使用 `Files.copy()` 替代 `transferTo()` 提升兼容性
  - 涉及文件：`AuthServiceImpl.java`, `WebConfig.java`

- **修复 /resume 命令后历史错误仍被检测的问题** ⭐
  - 问题：使用 `/resume` 恢复历史会话时，历史错误消息（如"Insufficient credits"）仍会触发 Token 切换提示
  - 根本原因：
    - `/resume` 命令执行后，终端输出历史会话内容
    - 历史错误消息被添加到 `timedOutputBuffer` 缓冲区
    - 3秒后错误检测逻辑检测到这些历史错误，误判为新错误
  - 解决方案：
    - **阻止历史输出进入缓冲区**：在 `/resume` 完成检测期间（`resumeDetectionActive && !resumeCompletionDetected`），直接返回，不添加任何内容到缓冲区
    - **完成检测机制**：检测到 resume 完成标记（如 `Continue this conversation?`, `[Y/n]`, 命令提示符等）后，启用错误检测
    - **重置错误标记**：检测到完成后，重置 `errorDetected = false`，允许检测新的真实错误
  - 技术实现：
    - `sendInput()` - 检测 `/resume` 命令，清空缓冲区并启动完成检测
    - `detectTokenError()` - 在完成检测期间跳过所有输出，不添加到缓冲区
    - 使用 `RESUME_COMPLETION_PATTERNS` 匹配命令完成标记
    - 添加详细调试日志便于追踪问题
  - 涉及文件：`terminalManager.ts:347-370`

### Technical Details 🔧
- **后端新增/修改文件**：
  - `AuthController.java` - 新增个人资料、修改密码、上传头像接口
  - `AuthServiceImpl.java` - 实现业务逻辑，优化跨平台路径处理
  - `LoginResponse.java` - 新增 email 和 avatarUrl 字段
  - `UpdateProfileRequest.java` - 个人资料更新请求DTO（新增）
  - `ChangePasswordRequest.java` - 修改密码请求DTO（新增）
  - `SendVerificationCodeRequest.java` - 添加 CHANGE_PASSWORD 验证
  - `EmailVerificationCode.java` - 添加 CHANGE_PASSWORD 枚举
  - `WebConfig.java` - 配置静态资源处理器和JWT拦截器排除规则
  - `application.yml` - 新增头像上传配置

- **前端新增/修改文件**：
  - `Profile.tsx` - 完整的个人资料编辑页面（新增）
  - `httpClient.ts` - 修复 JWT Token 附加逻辑
  - `authStorage.ts` - 扩展用户信息存储，新增 setCurrentUser() 方法
  - `TopBar.tsx` - 新增"个人信息"菜单项

- **数据库变更**：
  - 创建迁移脚本：`src/main/resources/db/migration/add_change_password_purpose.sql`
  - 更新 `email_verification_codes` 表的 `purpose` 字段枚举值

- **环境变量配置**：
  - `AVATAR_UPLOAD_PATH` - 头像文件存储路径
    - 开发环境默认：`uploads/avatars/`（项目相对路径）
    - 生产环境：`/var/www/llmctl/downloads/llmctl/images/avatar/`（绝对路径）
  - `AVATAR_BASE_URL` - 头像访问URL前缀
    - 开发环境默认：`http://localhost:8080/llmctl/uploads/`
    - 生产环境：`http://117.72.200.2/downloads/llmctl/images/avatar/`

### Security 🔐
- **头像上传安全**：
  - 文件类型白名单验证（仅允许图片格式）
  - 文件大小限制 2MB
  - 唯一文件名生成，防止覆盖和路径遍历
  - 安全的文件路径处理

- **密码修改安全**：
  - 必须先绑定邮箱才能修改密码
  - 邮箱一致性验证（输入邮箱必须与绑定邮箱一致）
  - 邮箱验证码验证（5分钟有效期，一次性使用）
  - BCrypt 密码哈希存储

- **认证安全增强**：
  - JWT Token 验证覆盖所有需要认证的接口
  - 公开资源（头像）不暴露服务器路径信息
  - 静态资源独立配置，与业务逻辑隔离

### Deployment 🚀
- **Docker 环境配置更新**：
  - `deploy/.env.template` - 添加头像相关环境变量
  - `deploy/docker-compose.yml` - 添加环境变量和 volume 挂载
  - 生产环境需配置 Nginx 提供静态文件服务

- **数据库迁移**：
  ```bash
  # 执行迁移脚本（生产环境）
  mysql -u huanyu -p llmctl < src/main/resources/db/migration/add_change_password_purpose.sql
  ```

### Documentation 📖
- 更新 `.env.template` - 添加头像上传配置说明
- 更新 `docker-compose.yml` - 添加环境变量和卷挂载
- 更新 `CHANGELOG.md` - 记录本版本所有变更
- 更新 `README.md` - 添加用户资料管理功能说明

## [2.1.3] - 2025-10-15

### Added 🎉
- **终端快捷键功能** - 提升终端操作效率
  - `Ctrl+1/2/3` 快速切换终端标签页（最多支持9个标签）
  - `Ctrl+W` 快速关闭当前终端标签页
  - 仅在 Terminals 页面生效，不干扰其他页面操作

- **右键粘贴功能** - 增强终端粘贴体验
  - 在终端区域右键点击直接粘贴剪贴板内容
  - 支持多行文本粘贴
  - 自动读取系统剪贴板

- **手动切换 Token 按钮** - 灵活的 Token 管理
  - 终端标签栏新增"切换 Token"按钮
  - 支持手动触发 Token 切换（不依赖自动错误检测）
  - 切换时自动标记当前 Token 为不健康
  - 重启会话并使用新 Token
  - 适用于自动检测未捕获的错误场景

- **切换到外部终端功能** - 支持系统原生终端
  - 终端标签栏新增"外部终端"按钮
  - 一键切换到系统外部终端（Windows CMD/macOS Terminal/Linux Terminal）
  - 自动切换到会话工作目录
  - 自动执行会话命令（如 `claude`）
  - 关闭内置终端，会话状态更新为非活跃
  - **跨平台支持**：Windows、macOS、Linux
  - **详细用户提示**：明确告知外部终端限制和状态管理

### Changed 🎨
- **优化粘贴逻辑** - 更好的 Windows CMD 兼容性
  - 使用 xterm.js 原生 `paste()` 方法
  - 保留 CMD 的 `[Pasted text #N +X lines]` 提示
  - 确保粘贴内容完整，无截断
  - 移除分块发送逻辑，避免内容碎片化

- **外部终端确认对话框优化**
  - 添加详细的警告提示
  - 说明会话状态变化和限制
  - 引导用户正确使用外部终端功能

### Fixed 🐛
- **修复粘贴内容截断问题**
  - 移除调试日志，保持控制台简洁
  - 解决大文本粘贴时内容不完整的问题
  - 修复粘贴时出现碎片（如 `rit`, `IOUt。`）的问题

### Technical Details 🔧
- **前端修改文件**：
  - `TerminalManager.tsx` - 添加快捷键、手动切换Token、外部终端功能
  - `TerminalComponent.tsx` - 优化粘贴逻辑、添加右键粘贴
  - `preload.ts` - 新增 `openExternalTerminal` API
  - `tokenAPI.ts` - 新增 `updateTokenHealth` 方法

- **后端修改文件**：
  - `main.ts` - 实现 `open-external-terminal` IPC处理器
  - `TokenMapper.xml` - 修复 MyBatis 参数映射错误

- **外部终端实现细节**：
  - Windows: 使用 `start` 命令打开新 CMD 窗口，`/K` 保持窗口打开
  - macOS: 使用 AppleScript 控制 Terminal.app
  - Linux: 使用 `gnome-terminal` 或 `x-terminal-emulator`
  - 使用 `child_process.exec()` 替代 `spawn()` 确保窗口正确创建

### Known Limitations ⚠️
- **外部终端状态检测限制**：
  - 系统无法自动检测外部终端是否关闭
  - 用户需手动管理外部终端的生命周期
  - 外部终端关闭后，需手动重新创建会话
  - 技术原因：外部终端是独立进程，受操作系统安全限制

## [2.1.2] - 2025-10-14

### Added 🎉
- **邮箱验证码注册/登录** - 完整的邮箱验证功能
  - 支持 QQ 邮箱（@qq.com）和 163 邮箱（@163.com）注册
  - 6位数字验证码，5分钟有效期，一次性使用
  - 60秒倒计时防止验证码滥发
  - 注册时自动验证邮箱验证码
  - 后端实现完整的邮件发送和验证逻辑
- **用户名或邮箱登录** - 灵活的登录方式
  - 支持使用用户名登录（原有功能）
  - 支持使用邮箱地址登录（新增功能）
  - 自动识别输入类型（包含@符号即为邮箱）
  - 邮箱优先查找，用户名兜底
  - 保持原有的安全机制（密码验证、账户锁定等）
- **忘记密码功能** - 密码重置入口
  - 登录页面添加"忘记密码？"链接
  - 点击显示提示模态框
  - 引导用户联系管理员重置密码（密码重置功能即将推出）

### Changed 🎨
- **登录注册UI优化** - 更简洁统一的界面
  - 使用实际的 icon.png 作为 Logo 图标
  - 移除空的分割线和"或"内容
  - 统一登录和注册页面的视觉风格
  - 优化忘记密码链接的交互体验

### Technical Details 🔧
- **后端新增文件**：
  - `EmailVerificationCode.java` - 验证码实体类
  - `SendVerificationCodeRequest.java` - 发送验证码请求DTO
  - `VerifyCodeRequest.java` - 验证验证码请求DTO
  - `EmailVerificationCodeMapper.java` - 验证码数据访问接口
  - `EmailVerificationCodeMapper.xml` - MyBatis映射文件
  - `IEmailService.java` - 邮件服务接口
  - `EmailServiceImpl.java` - 邮件服务实现
  - `IVerificationCodeService.java` - 验证码服务接口
  - `VerificationCodeServiceImpl.java` - 验证码服务实现
  - `PurposeTypeHandler.java` - 枚举类型处理器
- **后端修改文件**：
  - `AuthController.java` - 新增验证码发送和验证接口
  - `AuthServiceImpl.java` - 优化登录逻辑支持邮箱登录
  - `pom.xml` - 添加 Spring Boot Mail 依赖
  - `application.yml` - 配置邮件服务参数
  - `schema.sql` - 新增 email_verification_codes 表
- **前端修改文件**：
  - `LoginPage.tsx` - 更新Logo、添加忘记密码模态框、移除空内容
  - `RegisterPage.tsx` - 完整的注册表单含邮箱验证功能、更新Logo、移除空内容
  - `Auth.css` - 添加Logo图片样式、优化链接样式
- **数据库设计**：
  - `email_verification_codes` 表结构：
    - `id` - 主键（VARCHAR 36）
    - `email` - 邮箱地址
    - `code` - 6位验证码
    - `purpose` - 用途（REGISTER/LOGIN/RESET_PASSWORD）
    - `used` - 是否已使用
    - `expire_time` - 过期时间
    - `created_at` - 创建时间
    - 索引：`idx_email_purpose`, `idx_expire_time`

### Security 🔐
- **邮箱验证安全**：
  - 验证码有效期仅5分钟
  - 验证码一次性使用，验证后立即标记为已使用
  - 邮箱域名严格限制（仅QQ和163）
  - 60秒发送间隔防止滥发
  - 后端验证邮箱格式和验证码有效性
- **登录安全增强**：
  - 邮箱登录同样受到账户锁定保护
  - 保持原有的防暴力破解机制
  - 登录日志记录用户名或邮箱

### Documentation 📖
- 新增 `EMAIL_SETUP.md` - 完整的邮件服务配置指南
  - QQ邮箱配置步骤
  - 163邮箱配置步骤
  - 环境变量设置方法
  - 常见问题解答
  - 安全建议

## [2.1.1] - 2025-10-14

### Added 🎉
- **终端自动执行命令** - 终端打开后自动执行会话配置的命令（如 `claude`）
  - 延迟100ms确保pty完全初始化
  - 自动添加回车符，无需用户手动输入
  - 提升终端使用体验

### Changed
- **终端空状态简化** - 优化"没有打开的终端"界面
  - 移除冗余的会话数量显示
  - 简化为单一操作按钮"前往 Sessions 页面"
  - 更清晰的用户引导流程

### Performance ⚡
- **SQL查询性能优化** - 使用 INNER JOIN 技术显著提升核心接口响应速度
  - **API Keys 列表查询优化**：
    - 优化前：2次数据库查询（权限验证 + Token获取）
    - 优化后：1次JOIN查询（减少50%查询次数）
    - 涉及文件：`TokenMapper.xml`、`TokenMapper.java`、`TokenServiceImpl.java`
    - 新增方法：`findByProviderIdWithPermissionCheck()`
  - **Sessions 重启功能优化**：
    - 优化前：4次数据库查询（Session获取 + 权限验证 + 状态更新 + 重新查询）
    - 优化后：3次查询（减少25%查询次数）
    - 涉及文件：`SessionMapper.xml`、`SessionMapper.java`、`SessionServiceImpl.java`
    - 新增方法：`findByIdWithPermissionCheck()`
  - **优化技术细节**：
    - 使用 `INNER JOIN` 将权限验证和数据查询合并为单次操作
    - 在 JOIN 条件中直接过滤用户权限（`p.user_id = #{userId}`）
    - 提前加载关联数据（`provider_name`），避免额外查询
    - 减少网络往返延迟，提升接口响应速度
  - **建议索引优化**：
    ```sql
    CREATE INDEX idx_tokens_provider_id ON tokens(provider_id);
    CREATE INDEX idx_sessions_provider_id ON sessions(provider_id);
    CREATE INDEX idx_providers_user_id ON providers(user_id);
    ```

### Fixed 🐛
- **终端路由切换保持内容** - 修复切换菜单时终端内容重新加载的问题
  - 使用 CSS `visibility` 替代条件渲染
  - 终端组件始终挂载，只控制显示隐藏
  - 完美保持 xterm.js 的 DOM 状态和 pty 连接
  - 切换菜单后终端内容完整保留
- **终端关闭后页面刷新** - 修复关闭所有终端后页面不更新的问题
  - Redux 状态变化自动触发组件重新渲染
  - 正确显示空状态提示

### Technical Details
- **App.tsx** (437-450行)：使用 `visibility` 和 `pointerEvents` 控制终端显示
- **TerminalComponent.tsx** (118-127行)：添加自动执行命令逻辑
- **TerminalManager.tsx** (140-158行)：简化空状态显示组件
- **TokenMapper.xml** (47-56行)：添加 `findByProviderIdWithPermissionCheck` 优化查询
- **SessionMapper.xml** (42-60行)：添加 `findByIdWithPermissionCheck` 优化查询
- **TokenServiceImpl.java** (48-70行)：使用优化查询方法
- **SessionServiceImpl.java** (200-226行)：使用优化查询方法

## [2.1.0] - 2025-10-13

### Added 🎉
- **完整通知系统实现** - 企业级实时通知功能
  - **实时推送机制**：基于 SSE (Server-Sent Events) 的实时通知推送
  - **通知管理中心**：完整的通知列表界面，支持分页、过滤、搜索
  - **智能通知图标**：顶部导航栏实时显示未读数量和连接状态
  - **通知类型支持**：系统通知、会话提醒、统计报告、警告、成功、错误消息
  - **优先级管理**：4个优先级（低、普通、高、紧急）和相应的视觉样式
  - **批量操作**：支持批量标记已读、批量删除、全选/取消选择
  - **通知设置**：桌面通知、声音提醒、实时推送、自动刷新等配置选项

### 📖 帮助中心完善
- **全面内容更新**：帮助页面与README.md完全同步
  - 更新版本信息：v2.0.4 → v2.1.0
  - 新增用户认证系统详细介绍（JWT、BCrypt、多用户隔离）
  - 新增实时通知系统完整说明（SSE推送、通知管理）
  - 补充AES-256-GCM加密存储安全特性说明
- **快速开始指南优化**：
  - 添加"第一步：用户登录"说明
  - 包含默认管理员账户信息（admin/admin123）
  - 调整步骤顺序，符合实际使用流程
- **故障排查内容扩展**：
  - 新增认证问题解答（登录失败、Token过期）
  - 新增通知问题解答（收不到通知、通知不显示）
  - 新增数据库连接问题解决方案
- **功能特性列表更新**：
  - 增加用户认证、实时通知、企业级加密、帮助中心等新功能
  - 使用丰富的emoji图标，提升视觉效果
- **快速链接修复**：
  - 修复GitHub项目和问题反馈按钮无法跳转的问题
  - 添加正确的外部链接导航功能

### 🏗️ 技术架构
- **后端组件**：
  - `NotificationController` - RESTful API 接口
  - `NotificationService` - 业务逻辑处理层
  - `SseConnectionManager` - SSE 连接管理和心跳检测
  - `NotificationPublisher` - 异步通知发布服务
  - `NotificationMapper` - MyBatis 数据访问层
  - 完整的数据库表设计和索引优化

- **前端组件**：
  - `NotificationCenter` - 通知中心主页面
  - `NotificationIcon` - 顶部通知图标组件
  - `NotificationItem` - 单个通知项组件
  - `useNotifications` - React Hook 状态管理
  - `notificationSlice` - Redux Toolkit 状态管理
  - `notificationAPI.ts` - HTTP API 和 SSE 连接封装

### 🌐 用户体验
- **国际化支持**：完整的中英文翻译
- **响应式设计**：支持不同屏幕尺寸的设备
- **实时状态显示**：SSE 连接状态、未读数量实时更新
- **优雅的动画效果**：通知进入、删除、状态变更动画
- **无障碍访问**：符合 WCAG 标准的可访问性设计

### 🔧 集成功能
- **业务场景集成**：
  - 会话状态变更通知（启动、终止、错误）
  - Token 状态监控通知（失效、错误、健康警告）
  - Provider 配置变更通知（添加、更新、禁用）
  - 系统状态通知（启动、错误、配置导入导出）

- **通知辅助工具**：
  - `NotificationHelper` - 快速创建通知的工具类
  - `NotificationTemplates` - 预定义的通知模板库
  - 自动通知触发机制

### 🛠️ 开发体验
- **TypeScript 类型安全**：完整的类型定义和类型检查
- **代码质量**：符合 ESLint 和 Prettier 规范
- **错误处理**：完善的异常处理和用户友好的错误提示
- **性能优化**：SSE 连接复用、通知缓存、分页加载

### 📱 数据库设计
- **通知表 (notifications)**：
  - 支持用户隔离、类型分类、优先级管理
  - JSON 字段存储扩展数据
  - 自动过期机制和软删除支持
  - 完善的索引设计，支持高效查询

## [2.0.5] - 2025-10-13

### Added
- 未登录状态下的菜单项访问控制
  - 导入配置、导出配置、会话管理、导航菜单等功能在未登录时自动禁用
  - 登录/登出时自动更新菜单状态
- 优化后端日志输出
  - 禁用 MyBatis 详细 SQL 日志，提升性能
  - 调整日志级别，减少不必要的输出

### Changed
- 图标资源路径优化
  - 修复打包后图标显示为空白的问题
  - 支持开发和生产环境的图标路径自动切换
  - 添加多平台图标配置（Windows/macOS/Linux）

### Security
- **重要安全改进**：优化前端日志输出
  - 生产环境完全禁用 API 请求/响应日志，防止敏感信息泄露
  - 开发环境对敏感字段（密码等）进行脱敏处理
  - 登录/注册请求的密码字段自动替换为 `***`
  - 减少控制台输出，提升用户体验和应用性能

### Removed
- 移除统计信息功能模块
  - 删除前端统计信息组件和相关代码
  - 删除后端统计信息相关 API、Service、Mapper
  - 从菜单和命令面板中移除统计信息入口

### Fixed
- 修复 node-pty 原生模块编译问题
  - 解决 Windows 上 GetCommitHash.bat 脚本调用失败
  - 成功构建并打包 Electron 应用
- 修复会话重启加载速度慢的问题
  - 优化 MyBatis 日志配置
  - 提升数据库查询性能

## [2.0.4] - 2025-10-12

### Changed
- 优化菜单项命名为开发者友好格式
- 优化终端标签页与终端黑框间距

### Fixed
- 修复全屏终端关闭后界面空白
- 修复全屏模式下终端底部空白
- 修复全屏和非全屏模式下间距问题

## [2.0.3] - 2025-10-10

### Added
- Provider、Token、Session 核心功能完整实现
- 终端全屏模式和字体缩放
- 国际化支持（中英文）
- 系统托盘功能
- 智能Token切换和错误恢复
- 配置导入导出
- 命令面板 (Ctrl+K)

### Changed
- 完成从 CLI 工具到桌面应用的重构

## [1.0.0] - 2025-09-01

### Added
- 初始版本发布
- 基础 CLI 功能实现
