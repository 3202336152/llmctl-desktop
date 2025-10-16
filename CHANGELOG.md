# Changelog

所有重要的更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

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
