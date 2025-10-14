# Changelog

所有重要的更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

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
