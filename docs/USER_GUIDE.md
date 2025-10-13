# LLMctl 用户使用手册

## 目录

- [简介](#简介)
- [系统要求](#系统要求)
- [安装指南](#安装指南)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
  - [Provider管理](#provider管理)
  - [Token管理](#token管理)
  - [会话管理](#会话管理)
    - [多终端并发使用](#多终端并发使用)
    - [终端复制粘贴功能](#终端复制粘贴功能)
  - [统计信息](#统计信息)
  - [系统设置](#系统设置)
- [高级功能](#高级功能)
- [故障排查](#故障排查)
- [常见问题FAQ](#常见问题faq)
- [更新日志](#更新日志)

---

## 简介

LLMctl是一个强大的LLM控制系统，帮助您管理多个LLM Provider、Token、会话，并提供详细的使用统计信息。本应用采用桌面客户端形式，提供友好的图形界面，让LLM管理变得简单高效。

### 主要特性

✅ **多Provider支持**: 支持Claude、OpenAI、Qwen、Gemini等主流LLM Provider
✅ **智能Token管理**: 支持多Token轮询、健康检查、自动切换
✅ **会话管理**: CLI进程监控、工作目录记录、实时状态更新
✅ **多终端并发**: 同时打开多个终端窗口,在不同目录和项目中并行工作 🆕
✅ **复制粘贴支持**: 完整的终端复制粘贴功能,与系统终端体验一致 🆕
✅ **统计分析**: 详细的使用统计和数据可视化
✅ **配置管理**: 支持导入导出配置,方便迁移和备份

---

## 系统要求

### 最低配置

- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 20.04+
- **内存**: 4GB RAM
- **磁盘空间**: 500MB可用空间
- **网络**: 稳定的互联网连接

### 推荐配置

- **操作系统**: Windows 11, macOS 12+, Ubuntu 22.04+
- **内存**: 8GB RAM或以上
- **磁盘空间**: 1GB可用空间
- **网络**: 高速互联网连接

### 依赖软件

- **MySQL 8.x**: 用于数据存储（需预先安装）
- **Java 17+**: 运行后端服务（已内置在安装包中）

---

## 安装指南

### Windows安装

1. **下载安装包**
   - 访问 [GitHub Releases](https://github.com/yourusername/llmctl/releases)
   - 下载 `LLMctl-Setup-2.0.0.exe`

2. **运行安装程序**
   - 双击安装包
   - 按照向导提示完成安装
   - 默认安装路径: `C:\Program Files\LLMctl`

3. **配置MySQL数据库**
   ```cmd
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE llmctl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'llmctl'@'localhost' IDENTIFIED BY 'llmctl123';
   GRANT ALL PRIVILEGES ON llmctl.* TO 'llmctl'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **启动应用**
   - 从开始菜单或桌面快捷方式启动LLMctl

### macOS安装

1. **下载安装包**
   - 访问 [GitHub Releases](https://github.com/yourusername/llmctl/releases)
   - 下载 `LLMctl-2.0.0.dmg`

2. **安装应用**
   - 打开DMG文件
   - 将LLMctl拖拽到Applications文件夹

3. **配置MySQL数据库**
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE llmctl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'llmctl'@'localhost' IDENTIFIED BY 'llmctl123';
   GRANT ALL PRIVILEGES ON llmctl.* TO 'llmctl'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **启动应用**
   - 从Applications文件夹或Launchpad启动LLMctl
   - 首次启动可能需要在系统偏好设置中允许运行

### Linux安装

1. **下载安装包**
   ```bash
   wget https://github.com/yourusername/llmctl/releases/download/v2.0.0/LLMctl-2.0.0.AppImage
   ```

2. **添加执行权限**
   ```bash
   chmod +x LLMctl-2.0.0.AppImage
   ```

3. **配置MySQL数据库**
   ```bash
   sudo mysql -u root -p
   ```
   ```sql
   CREATE DATABASE llmctl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'llmctl'@'localhost' IDENTIFIED BY 'llmctl123';
   GRANT ALL PRIVILEGES ON llmctl.* TO 'llmctl'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **启动应用**
   ```bash
   ./LLMctl-2.0.0.AppImage
   ```

---

## 快速开始

### 首次使用配置

1. **启动应用**
   - 首次启动后，应用会自动检查数据库连接
   - 如果连接失败，请检查MySQL是否正确安装和配置

2. **创建第一个Provider**
   - 点击左侧导航栏的"Provider管理"
   - 点击"创建Provider"按钮
   - 填写Provider信息：
     - **名称**: 为Provider起一个易识别的名字（如"Claude Production"）
     - **类型**: 选择Provider类型（Claude/OpenAI/Qwen/Gemini）
     - **Base URL**: API的基础URL（通常可留空使用默认值）
     - **模型名称**: 使用的模型名称（如"claude-3-opus-20240229"）
     - **初始Token**: 您的API Token
     - **描述**: 可选的备注信息
   - 点击"确认"保存

3. **添加更多Token（可选）**
   - 如果您有多个Token用于负载均衡，可在"Token管理"中添加
   - 支持设置Token权重和启用状态

4. **开始使用**
   - 在"会话管理"中启动新会话
   - 选择工作目录和Provider
   - 系统将自动启动CLI进程并管理Token轮换

---

## 核心功能

### Provider管理

Provider是LLM服务提供商的抽象，每个Provider代表一个LLM服务端点。

#### 创建Provider

1. **进入Provider管理页面**
   - 点击左侧导航栏的"Provider管理"

2. **点击创建按钮**
   - 点击页面右上角的"创建Provider"按钮

3. **填写表单**

   | 字段 | 说明 | 示例 |
   |------|------|------|
   | 名称 | Provider的显示名称 | `Claude Production` |
   | 类型 | Provider类型 | `anthropic` |
   | Base URL | API基础URL（可选） | `https://api.anthropic.com` |
   | 模型名称 | 使用的模型 | `claude-3-opus-20240229` |
   | 初始Token | API密钥 | `sk-ant-api03-...` |
   | 描述 | 备注信息（可选） | `生产环境使用` |

4. **保存配置**
   - 点击"确认"按钮
   - 系统将自动验证Token有效性
   - 创建成功后，Provider将出现在列表中

#### 查看Provider详情

- 在Provider列表中，点击任意Provider行
- 右侧将显示详细信息：
  - Provider基本信息
  - 关联的Token列表
  - 使用统计信息

#### 编辑Provider

1. 点击Provider行右侧的"编辑"按钮
2. 修改需要更新的字段
3. 点击"确认"保存更改

#### 删除Provider

1. 点击Provider行右侧的"删除"按钮
2. 确认删除操作
3. **注意**: 删除Provider将同时删除关联的所有Token和会话

#### 激活/停用Provider

- 点击Provider行右侧的开关按钮
- 停用后，该Provider将不会被用于新会话

---

### Token管理

Token是访问LLM API的密钥。LLMctl支持为单个Provider配置多个Token，实现负载均衡和高可用。

#### 添加Token

1. **进入Token管理页面**
   - 点击左侧导航栏的"Token管理"
   - 如果已有Provider,系统会自动选择第一个Provider并显示其Token列表 🆕

2. **选择Provider**
   - 在顶部下拉框中选择要添加Token的Provider
   - 切换Provider时会自动加载对应的Token列表

3. **点击添加按钮**
   - 点击"添加Token"按钮

4. **填写Token信息**

   | 字段 | 说明 | 默认值 |
   |------|------|--------|
   | Token值 | 完整的API密钥 | - |
   | 权重 | 用于加权轮询策略 | 1 |
   | 启用状态 | 是否启用此Token | 是 |

5. **保存**
   - 点击"确认"按钮
   - 系统将自动对Token进行脱敏显示（仅显示前8位和后4位）

#### Token轮询策略

LLMctl支持4种Token轮询策略，可在"系统设置"中配置：

##### 1. Round Robin (轮询)

- **工作原理**: 按顺序依次使用每个启用的Token
- **适用场景**: Token性能相近，需要均匀分配请求
- **示例**:
  ```
  请求1 → Token A
  请求2 → Token B
  请求3 → Token C
  请求4 → Token A (循环)
  ```

##### 2. Weighted (加权轮询)

- **工作原理**: 根据Token权重随机选择，权重越高被选中概率越大
- **适用场景**: Token有不同的配额或性能等级
- **示例**:
  ```
  Token A (权重3) → 60%概率
  Token B (权重2) → 40%概率
  ```

##### 3. Random (随机)

- **工作原理**: 完全随机选择启用的Token
- **适用场景**: 简单的负载分散，无特殊要求
- **示例**: 每次请求随机选择任一Token

##### 4. Least Used (最少使用)

- **工作原理**: 选择使用次数最少的Token
- **适用场景**: 最大化Token利用率，避免配额不均
- **示例**:
  ```
  Token A (已使用100次)
  Token B (已使用50次)  ← 优先选择
  Token C (已使用80次)
  ```

#### Token健康检查

系统会定期检查Token的健康状态，确保服务可用性。

**手动测试Token**:
1. 在Token列表中找到要测试的Token
2. 点击"测试"按钮
3. 系统将发送测试请求验证Token有效性
4. 结果显示：
   - ✅ **健康**: Token可正常使用
   - ❌ **不健康**: Token失效或配额耗尽

**自动健康检查**:
- 系统每5分钟自动检查所有Token
- 不健康的Token将自动停用
- 恢复健康后可手动重新启用

#### 编辑Token

1. 点击Token行右侧的"编辑"按钮
2. 修改权重或启用状态
3. 点击"确认"保存

#### 删除Token

1. 点击Token行右侧的"删除"按钮
2. 确认删除操作
3. **注意**: 如果Provider只有一个Token，删除前需确保已添加其他Token

---

### 会话管理

会话代表一个运行中的CLI进程，LLMctl会自动管理Token的选择和轮换。

#### 启动新会话

1. **进入会话管理页面**
   - 点击左侧导航栏的"会话管理"

2. **点击启动按钮**
   - 点击"启动会话"按钮

3. **配置会话**

   | 字段 | 说明 | 示例 |
   |------|------|------|
   | Provider | 选择要使用的Provider | `Claude Production` |
   | 工作目录 | CLI进程的工作目录 | `/home/user/projects/myapp` |

4. **启动**
   - 点击"确认"按钮
   - 系统将自动：
     - 根据轮询策略选择Token
     - 设置环境变量
     - 启动CLI进程
     - 记录进程PID和启动时间

#### 会话状态

会话有三种状态：

| 状态 | 说明 | 颜色标识 |
|------|------|----------|
| **Active** | 进程正在运行 | 🟢 绿色 |
| **Inactive** | 进程已暂停 | 🟡 黄色 |
| **Terminated** | 进程已终止 | 🔴 红色 |

#### 查看会话详情

点击会话行查看详细信息：
- **基本信息**: ID、Provider、状态
- **进程信息**: PID、启动时间、运行时长
- **目录信息**: 工作目录路径
- **Token信息**: 当前使用的Token（脱敏显示）

#### 终止会话

1. 找到要终止的会话
2. 点击右侧的"终止"按钮
3. 确认操作
4. 系统将：
   - 向进程发送终止信号
   - 更新会话状态为Terminated
   - 记录终止时间

#### 会话列表筛选

- **按状态筛选**: 使用顶部的状态标签页快速切换
- **按Provider筛选**: 使用Provider下拉框筛选
- **搜索**: 支持按工作目录搜索

#### 智能Token切换和会话自动重启 🆕

LLMctl 具备智能的Token错误检测和自动恢复能力，确保服务的持续可用性。

**功能特性**:
- 🔍 实时监控终端输出，自动检测Token错误
- ⚠️ Token失效时自动标记为不健康状态
- 🔄 智能提示用户重启会话切换到健康Token
- 🗑️ 自动清理失效会话，保持数据库整洁
- ✅ 无缝切换到新Token，最小化服务中断

**支持的错误检测**:
- Credit balance too low（余额不足）
- Rate limit exceeded（速率限制）
- 401 Unauthorized（认证失败）
- 403 Forbidden（权限拒绝）
- Invalid API key（无效密钥）
- Authentication error（认证错误）

**自动恢复流程**:

1. **错误检测**
   - 系统实时监控终端输出
   - 匹配预定义的错误模式
   - 检测到Token错误后立即响应

2. **标记Token状态**
   - 自动将失效的Token标记为"不健康"状态
   - 记录Token失效时间和原因
   - 更新Token错误计数

3. **用户确认**
   - 弹出确认对话框通知用户Token已失效
   - 询问是否自动重启会话切换Token
   - 提供"重启会话"和"稍后手动处理"两个选项

4. **自动重启会话**（用户确认后）
   - 关闭旧终端界面
   - 删除失效的会话记录（不保留terminated状态）
   - 创建新会话，使用相同的工作目录和配置
   - **自动选择健康的Token**（跳过不健康的Token）
   - 自动打开新终端，无缝继续工作

**使用示例**:

```bash
# 场景1: Token余额不足
$ claude "分析这个项目"
Error: credit balance is too low
[系统自动检测到错误]
[弹窗] Token 已失效，是否自动重启会话以切换到新 Token？
[点击"重启会话"]
[自动删除旧会话session_abc123]
[创建新会话session_def456，使用健康的Token-B]
[继续工作，无需手动操作]

# 场景2: 认证错误
$ claude "写一个函数"
Error: 401 Unauthorized - Invalid API key
[系统自动标记Token-A为不健康]
[自动重启后使用Token-B]
[Token-A可在Token管理中手动恢复或删除]
```

**Token选择逻辑**:
- 新会话创建时，系统只从**健康且启用**的Token中选择
- 自动跳过所有标记为"不健康"的Token
- 确保新会话使用可用的Token，避免重复失败

**最佳实践**:

1. **配置多个Token**
   - 为每个Provider配置至少2-3个Token
   - 设置合理的Token权重
   - 定期检查Token健康状态

2. **及时处理失效Token**
   - Token失效后及时充值或更换
   - 在Token管理中手动恢复健康状态
   - 删除长期失效的Token

3. **监控Token使用情况**
   - 在统计页面查看Token使用趋势
   - 关注Token错误计数
   - 设置Token配额预警

**注意事项**:
- 重启会话会删除旧会话记录，不会保留terminated状态
- 新会话会继承原会话的工作目录和启动命令
- 如果所有Token都不健康，会话创建将失败
- Token恢复健康后可在Token管理中手动重新启用

#### 多终端并发使用 🆕

LLMctl 支持同时打开多个终端窗口,方便您在不同目录和会话中同时工作。

**功能特性**:
- 同时打开多个会话的终端
- 每个终端独立管理,互不干扰
- 支持不同的工作目录和环境变量
- 独立的终端窗口,可以自由关闭和打开

**使用方法**:

1. **打开终端**
   - 在会话列表中找到要操作的会话
   - 点击"打开终端"按钮
   - 终端窗口将出现在会话列表下方
   - 按钮文字变为"已打开",表示该会话终端已打开

2. **打开多个终端**
   - 重复上述步骤,为其他会话打开终端
   - 所有打开的终端会按顺序排列显示
   - 每个终端窗口显示对应的会话ID和工作目录

3. **终端窗口操作**
   - 每个终端窗口右上角有关闭按钮(×)
   - 关闭终端窗口不会终止会话进程
   - 关闭后可以再次点击"打开终端"按钮重新打开

4. **终端交互**
   - 支持完整的命令行交互
   - 支持复制粘贴(见下方说明)
   - 支持历史命令导航(↑↓键)
   - 支持Tab自动补全

**使用场景示例**:

```
场景1: 多项目开发
- 会话1: /project/frontend (前端开发)
- 会话2: /project/backend (后端开发)
- 会话3: /project/docs (文档编写)

场景2: 同时测试不同配置
- 会话1: Claude Opus (高级任务)
- 会话2: Claude Sonnet (中等任务)
- 会话3: Claude Haiku (简单任务)

场景3: 多环境管理
- 会话1: 生产环境 (production)
- 会话2: 测试环境 (staging)
- 会话3: 开发环境 (development)
```

**注意事项**:
- 建议同时打开的终端数量不超过5个,以保持界面清晰
- 每个终端都会占用系统资源,请根据机器性能合理使用
- 关闭浏览器或刷新页面会清空已打开的终端列表(但不会终止会话进程)

#### 终端复制粘贴功能 🆕

内置终端完全支持复制粘贴操作,提供与系统终端一致的使用体验。

**复制文本**:

1. **选择文本**
   - 使用鼠标拖动选中终端中的文本
   - 选中的文本会高亮显示

2. **复制到剪贴板**
   - Windows/Linux: 按 `Ctrl + C`
   - macOS: 按 `Cmd + C`
   - 文本将自动复制到系统剪贴板

**智能Ctrl+C**:
- **有选中文本时**: 执行复制操作
- **无选中文本时**: 发送中断信号(终止当前命令)
- 这与大多数现代终端的行为一致

**粘贴文本**:

1. **粘贴剪贴板内容**
   - Windows/Linux: 按 `Ctrl + V`
   - macOS: 按 `Cmd + V`
   - 剪贴板内容将自动输入到终端

2. **粘贴多行文本**
   - 支持粘贴多行命令或代码
   - 多行内容会保持原有格式

**使用技巧**:

```bash
# 示例1: 复制命令输出
$ ls -la
[选中输出结果,按Ctrl+C复制]

# 示例2: 粘贴长命令
[从编辑器复制命令]
[在终端按Ctrl+V粘贴]

# 示例3: 复制错误信息
$ npm install
Error: ENOENT...
[选中错误信息,按Ctrl+C复制到Issues]

# 示例4: 中断执行
$ npm run dev
[按Ctrl+C终止进程]
```

**快捷键总结**:

| 操作 | Windows/Linux | macOS |
|------|---------------|-------|
| 复制 | `Ctrl + C` | `Cmd + C` |
| 粘贴 | `Ctrl + V` | `Cmd + V` |
| 中断 | `Ctrl + C` (无选中文本) | `Cmd + C` (无选中文本) |

**兼容性**:
- 支持所有主流剪贴板格式
- 与系统剪贴板完全集成
- 支持在不同应用间复制粘贴

---

#### 导出统计数据

1. 点击页面右上角的"导出"按钮
2. 选择导出格式：
   - **CSV**: 表格数据，适合Excel处理
   - **JSON**: 结构化数据，适合程序处理
   - **PDF**: 报告格式，适合打印分享
3. 选择保存位置

---

### 系统设置

系统设置允许您自定义应用的行为和外观。

#### 进入设置页面

- 点击左侧导航栏的"系统设置"

#### 配置项

##### Token轮询策略

选择全局的Token轮询策略：
- Round Robin (轮询)
- Weighted (加权轮询)
- Random (随机)
- Least Used (最少使用)

**更改方式**:
1. 在"Token轮询策略"下拉框中选择策略
2. 点击"保存"按钮
3. 新策略将立即生效于新启动的会话

##### 健康检查间隔

设置Token自动健康检查的间隔时间。

**配置范围**: 1-60分钟
**默认值**: 5分钟
**建议**:
- 生产环境: 5-10分钟
- 开发环境: 15-30分钟

##### 数据库配置

修改数据库连接信息：
- **主机**: 数据库服务器地址
- **端口**: 数据库端口（默认3306）
- **数据库名**: 数据库名称
- **用户名**: 数据库用户
- **密码**: 数据库密码

**注意**: 修改后需要重启应用生效

##### 日志级别

设置应用日志的详细程度：
- **ERROR**: 仅记录错误
- **WARN**: 记录警告和错误
- **INFO**: 记录一般信息（推荐）
- **DEBUG**: 记录详细调试信息

##### 主题设置

选择应用主题：
- 浅色主题（默认）
- 深色主题
- 跟随系统

---

## 高级功能

### 配置导入导出

LLMctl支持导入导出完整配置，方便备份和迁移。

#### 导出配置

1. **进入设置页面**
   - 点击左侧导航栏的"系统设置"

2. **选择导出格式**
   - **Bash**: 适用于Linux/macOS Shell脚本
   - **PowerShell**: 适用于Windows PowerShell
   - **CMD**: 适用于Windows命令提示符
   - **JSON**: 通用JSON格式

3. **导出示例**

**Bash格式**:
```bash
export ANTHROPIC_AUTH_TOKEN="sk-ant-api03-..."
export OPENAI_API_KEY="sk-..."
export LLMCTL_POLLING_STRATEGY="round-robin"
```

**PowerShell格式**:
```powershell
$env:ANTHROPIC_AUTH_TOKEN = "sk-ant-api03-..."
$env:OPENAI_API_KEY = "sk-..."
$env:LLMCTL_POLLING_STRATEGY = "round-robin"
```

**JSON格式**:
```json
{
  "providers": [
    {
      "name": "Claude Production",
      "type": "anthropic",
      "tokens": ["sk-ant-api03-..."]
    }
  ],
  "settings": {
    "pollingStrategy": "round-robin"
  }
}
```

4. **保存文件**
   - 点击"复制"按钮复制到剪贴板
   - 或点击"下载"按钮保存为文件

#### 导入配置

1. **准备配置文件**
   - 确保配置文件格式正确
   - 支持JSON格式

2. **导入步骤**
   - 点击"导入配置"按钮
   - 选择配置文件或粘贴配置内容
   - 点击"确认"导入

3. **导入选项**
   - **合并模式**: 保留现有配置，添加新配置
   - **覆盖模式**: 清空现有配置，使用新配置

4. **验证导入**
   - 导入完成后，检查Provider和Token列表
   - 建议测试Token健康状态

### 环境变量管理

LLMctl可以生成环境变量配置，供外部程序使用。

#### 生成环境变量

1. 在设置页面点击"生成环境变量"
2. 选择目标格式（Bash/PowerShell/CMD）
3. 复制生成的配置
4. 在终端中执行或添加到配置文件

#### 应用环境变量

**Linux/macOS (Bash)**:
```bash
# 临时生效（当前终端）
source llmctl-env.sh

# 永久生效（添加到~/.bashrc或~/.zshrc）
echo "source /path/to/llmctl-env.sh" >> ~/.bashrc
```

**Windows (PowerShell)**:
```powershell
# 临时生效（当前会话）
. .\llmctl-env.ps1

# 永久生效（添加到PowerShell配置）
Add-Content $PROFILE ". C:\path\to\llmctl-env.ps1"
```

### 备份与恢复

#### 备份数据

**手动备份**:
1. 导出配置（JSON格式）
2. 备份MySQL数据库：
   ```bash
   mysqldump -u llmctl -p llmctl > llmctl_backup.sql
   ```

**自动备份** (需手动设置):
- 使用系统定时任务（cron/Task Scheduler）
- 定期执行备份脚本

#### 恢复数据

1. **恢复数据库**:
   ```bash
   mysql -u llmctl -p llmctl < llmctl_backup.sql
   ```

2. **导入配置**:
   - 在设置页面导入之前导出的JSON配置

---

## 故障排查

### 应用无法启动

#### 问题: 双击图标无反应

**可能原因**:
- 端口被占用（默认8080）
- MySQL服务未启动
- 数据库连接配置错误

**解决方案**:
1. 检查MySQL服务状态：
   ```bash
   # Linux/macOS
   sudo systemctl status mysql

   # Windows
   services.msc (查找MySQL服务)
   ```

2. 检查端口占用：
   ```bash
   # Linux/macOS
   lsof -i :8080

   # Windows
   netstat -ano | findstr :8080
   ```

3. 查看应用日志：
   - Windows: `C:\Users\<用户名>\AppData\Roaming\LLMctl\logs\`
   - macOS: `~/Library/Application Support/LLMctl/logs/`
   - Linux: `~/.config/LLMctl/logs/`

#### 问题: 显示数据库连接错误

**错误信息**: `Communications link failure` 或 `Access denied`

**解决方案**:
1. 确认MySQL已启动
2. 验证数据库凭据：
   ```bash
   mysql -u llmctl -p
   ```
3. 检查数据库是否存在：
   ```sql
   SHOW DATABASES;
   ```
4. 重新创建数据库和用户（参考安装指南）

### Provider/Token相关问题

#### 问题: Token测试失败

**错误信息**: `Token测试失败: 401 Unauthorized`

**可能原因**:
- Token已过期或被撤销
- Token格式不正确
- API服务不可用

**解决方案**:
1. 在Provider官网验证Token有效性
2. 检查Token是否包含正确的前缀（如`sk-ant-`）
3. 确认网络连接正常
4. 检查Base URL配置是否正确

#### 问题: Token自动切换不生效

**症状**: 始终使用同一个Token

**可能原因**:
- 只有一个Token处于启用状态
- 轮询策略配置错误

**解决方案**:
1. 检查Token列表，确保多个Token已启用
2. 在设置中确认轮询策略
3. 查看会话详情，验证Token切换记录

### 会话管理问题

#### 问题: 会话启动失败

**错误信息**: `无法启动会话`

**可能原因**:
- 工作目录不存在或无权限
- Provider没有可用Token
- CLI命令不存在

**解决方案**:
1. 验证工作目录路径是否正确
2. 确认选择的Provider有健康的Token
3. 检查系统PATH环境变量

#### 问题: 会话状态显示不准确

**症状**: 进程已终止但状态仍显示Active

**解决方案**:
1. 手动刷新页面
2. 点击"终止"按钮强制更新状态
3. 重启应用

### 界面问题

#### 问题: 界面显示不完整或错乱

**可能原因**:
- 浏览器缓存问题
- 窗口尺寸太小
- 显示缩放设置不当

**解决方案**:
1. 清除应用缓存（设置 → 清除缓存）
2. 调整窗口大小至至少1024x768
3. 检查系统显示缩放比例（推荐100%）

#### 问题: 图表不显示

**症状**: 统计页面图表区域空白

**解决方案**:
1. 确保选择的时间范围内有数据
2. 刷新页面
3. 查看浏览器控制台错误（F12）

### 性能问题

#### 问题: 应用响应缓慢

**可能原因**:
- 数据量过大
- 数据库查询慢
- 内存不足

**解决方案**:
1. 清理历史数据：
   ```sql
   DELETE FROM sessions WHERE status = 'terminated' AND end_time < DATE_SUB(NOW(), INTERVAL 30 DAY);
   ```
2. 优化数据库索引
3. 增加应用内存限制（在设置中配置）

---

## 常见问题FAQ

### 基础问题

**Q1: LLMctl是什么？它能做什么？**

A: LLMctl是一个LLM控制系统桌面应用，主要功能包括：
- 管理多个LLM Provider和Token
- 智能Token轮换和负载均衡
- CLI会话监控和管理
- 详细的使用统计和分析

**Q2: LLMctl支持哪些LLM Provider？**

A: 目前支持以下Provider：
- Anthropic Claude (claude-3-opus, claude-3-sonnet, claude-3-haiku)
- OpenAI (GPT-4, GPT-3.5-turbo)
- 阿里云Qwen
- Google Gemini

**Q3: LLMctl是否免费？**

A: LLMctl应用本身免费开源，但使用LLM服务需要向各Provider支付API费用。

**Q4: 我的数据安全吗？**

A: 是的，您的数据完全存储在本地MySQL数据库中，不会上传到任何外部服务器。Token等敏感信息经过加密存储。

### 配置问题

**Q5: 如何获取API Token？**

A:
- **Claude**: 访问 https://console.anthropic.com/settings/keys
- **OpenAI**: 访问 https://platform.openai.com/api-keys
- **Qwen**: 访问阿里云控制台
- **Gemini**: 访问 Google AI Studio

**Q6: 可以同时使用多个Provider吗？**

A: 可以。您可以创建多个Provider，并在启动会话时选择要使用的Provider。

**Q7: Token轮询策略应该选择哪个？**

A: 建议根据使用场景选择：
- **一般用途**: Round Robin
- **有配额等级差异**: Weighted
- **追求最大利用率**: Least Used
- **简单分散**: Random

**Q8: 如何修改数据库密码？**

A:
1. 在MySQL中修改密码：
   ```sql
   ALTER USER 'llmctl'@'localhost' IDENTIFIED BY '新密码';
   ```
2. 在LLMctl设置中更新数据库密码
3. 重启应用

### 使用问题

**Q9: 为什么我的Token一直显示"不健康"？**

A: 可能的原因：
- Token已过期或配额耗尽
- 网络连接问题
- Provider API服务故障

解决方案：检查Token有效性，更新Token，或联系Provider支持。

**Q10: 会话终止后可以恢复吗？**

A: 不能。会话终止后进程已结束，无法恢复。但可以使用相同配置启动新会话。

**Q11: 统计数据可以保留多久？**

A: 默认永久保留。您可以在设置中配置自动清理策略，或手动删除历史数据。

**Q12: 如何备份我的配置？**

A: 两种方式：
1. 使用"导出配置"功能导出JSON文件
2. 直接备份MySQL数据库

### 故障处理

**Q13: 应用突然崩溃怎么办？**

A:
1. 查看日志文件定位问题
2. 尝试重启应用
3. 如问题持续，提交Issue到GitHub并附上日志

**Q14: 数据库连接断开后如何恢复？**

A:
1. 检查MySQL服务是否运行
2. 重启应用，会自动尝试重连
3. 如无法恢复，检查数据库配置

**Q15: 如何重置应用到初始状态？**

A:
1. 备份重要数据
2. 删除数据库：`DROP DATABASE llmctl;`
3. 重新创建数据库（参考安装指南）
4. 重启应用

### 高级问题

**Q16: 可以通过命令行使用LLMctl吗？**

A: 目前主要提供GUI界面，但可以通过导出的环境变量在命令行中使用配置。未来版本将支持CLI接口。

**Q17: 支持分布式部署吗？**

A: 当前版本设计为单机桌面应用。企业级分布式部署功能在规划中。

**Q18: 如何扩展支持新的Provider？**

A: 请参考开发文档中的"Provider扩展指南"，或提交Feature Request到GitHub。

**Q19: 统计数据可以导出到BI工具吗？**

A: 可以。统计数据存储在MySQL中，可以直接连接BI工具（如Tableau、Power BI）进行分析。

**Q20: 如何自定义Token健康检查逻辑？**

A: 健康检查逻辑在后端实现，可以修改源码自定义。具体参考开发文档。

---

## 获取帮助

### 官方资源

- **GitHub仓库**: https://github.com/yourusername/llmctl
- **问题追踪**: https://github.com/yourusername/llmctl/issues
- **文档中心**: https://llmctl.readthedocs.io
- **更新日志**: https://github.com/yourusername/llmctl/releases

### 社区支持

- **讨论区**: https://github.com/yourusername/llmctl/discussions
- **Discord**: https://discord.gg/llmctl
- **邮件列表**: llmctl@googlegroups.com

### 报告问题

提交Issue时请包含：
- 操作系统和版本
- LLMctl版本
- 问题详细描述
- 复现步骤
- 错误日志（如适用）

### 贡献代码

欢迎贡献代码和文档！请查看 `CONTRIBUTING.md` 了解贡献指南。

---

## 附录

### 快捷键

| 快捷键 | 功能 | 适用平台 |
|--------|------|----------|
| `Ctrl+N` / `Cmd+N` | 新建Provider | 全平台 |
| `Ctrl+R` / `Cmd+R` | 刷新页面 | 全平台 |
| `Ctrl+,` / `Cmd+,` | 打开设置 | 全平台 |
| `F5` | 刷新当前页面 | 全平台 |
| `F12` | 打开开发者工具 | 全平台 |

### Provider官方文档链接

- [Anthropic Claude API文档](https://docs.anthropic.com/)
- [OpenAI API文档](https://platform.openai.com/docs)
- [阿里云Qwen文档](https://help.aliyun.com/product/2400256.html)
- [Google Gemini API文档](https://ai.google.dev/)

### 术语表

| 术语 | 解释 |
|------|------|
| **Provider** | LLM服务提供商，如Anthropic、OpenAI等 |
| **Token** | API访问密钥，用于身份验证和计费 |
| **Session** | CLI会话，代表一个运行中的进程 |
| **Polling Strategy** | Token轮询策略，决定如何选择Token |
| **Health Check** | 健康检查，验证Token可用性的测试 |
| **Base URL** | API基础URL，Provider的服务端点地址 |
| **Masking** | 脱敏，隐藏Token敏感部分仅显示头尾 |

---

## 更新日志

### v2.0.2 - 2025-10-03

#### 🎉 新功能

**智能Token切换和会话自动重启**
- ✅ 实时监控终端输出，自动检测Token错误（支持多种错误模式）
- ✅ Token失效时自动标记为不健康状态并更新数据库
- ✅ 智能弹窗提示用户重启会话
- ✅ 一键自动重启：删除旧会话+创建新会话+切换健康Token
- ✅ 新会话只从健康且启用的Token中选择，确保可用性
- ✅ 完整的错误检测和恢复日志，便于问题追踪

**顶部导航栏优化**
- ✅ 优化导航栏布局和样式
- ✅ 改善页面切换体验
- ✅ 统一视觉风格

**会话终端标签页管理**
- ✅ 支持终端标签页切换
- ✅ 每个标签页显示工作目录信息
- ✅ 支持快捷键切换标签页
- ✅ 优化标签页关闭逻辑

#### ⚡ 性能优化

**Token管理优化**
- ✅ 在Session实体和DTO中添加tokenId字段
- ✅ 会话创建时保存Token ID，避免重复选择
- ✅ 环境变量生成时直接使用保存的Token ID
- ✅ 错误检测时精确定位失效的Token

**代码质量改善**
- ✅ 增强后端日志输出，便于调试
- ✅ 修复Ant Design组件废弃警告
- ✅ 优化前端错误处理逻辑
- ✅ 统一Modal组件使用规范

#### 🐛 Bug修复

- ✅ 修复Token健康状态更新失败的问题
- ✅ 修复重复弹窗的问题（添加errorDetected标记）
- ✅ 修复SessionDTO缺少tokenId导致前端无法获取Token信息
- ✅ 修复bodyStyle废弃警告（改为styles.body）
- ✅ 修复destroyOnHidden废弃警告（改为destroyOnClose）
- ✅ 修复Form未连接警告（添加preserve和afterClose）

#### 📖 文档更新

- ✅ 更新USER_GUIDE.md，添加智能Token切换功能详细说明
- ✅ 创建CHANGELOG.md记录所有版本更新
- ✅ 更新README.md项目说明
- ✅ 添加Token切换最佳实践和使用场景

### v2.0.1 - 2025-09-30

#### 🎉 新功能

**多终端并发支持**
- ✅ 支持同时打开多个会话的终端窗口
- ✅ 每个终端独立管理,互不干扰
- ✅ 支持不同工作目录和环境变量配置
- ✅ 灵活的终端窗口管理(打开/关闭)

**终端复制粘贴功能**
- ✅ 完整支持 Ctrl+C / Cmd+C 复制文本
- ✅ 完整支持 Ctrl+V / Cmd+V 粘贴文本
- ✅ 智能 Ctrl+C: 有选中文本时复制,无选中文本时发送中断信号
- ✅ 支持多行文本粘贴
- ✅ 与系统剪贴板完全集成

**Token管理优化**
- ✅ 自动选择第一个Provider并显示Token列表
- ✅ 无需手动选择即可查看Token
- ✅ 改善首次进入页面的用户体验

#### ⚡ 性能优化

**终端性能提升**
- ✅ 从Spring Boot后端执行迁移到Electron本地执行
- ✅ 减少90%以上的网络延迟
- ✅ 终端响应时间从500ms提升到10ms以内
- ✅ 降低后端服务器资源占用

**代码质量改善**
- ✅ 移除30+处冗余日志输出
- ✅ 清理不必要的控制台输出
- ✅ 减少14%的前端包大小(main.js)
- ✅ 修复所有TypeScript类型警告

#### 🐛 Bug修复

- ✅ 修复环境变量无法传递到终端的问题
- ✅ 修复启动命令参数不生效的问题
- ✅ 修复命令默认执行错误的问题
- ✅ 修复终端粘贴功能不可用的问题

#### 📖 文档更新

- ✅ 更新DEVELOPMENT.md,添加详细的优化记录
- ✅ 更新USER_GUIDE.md,添加新功能使用说明
- ✅ 新增性能指标对比表
- ✅ 新增多终端使用场景示例

### v2.0.0 - 2025-09-25

#### 🎉 重大更新

**架构重构**
- ✅ 从CLI工具重构为Electron + Spring Boot桌面应用
- ✅ 全新的图形化用户界面
- ✅ 完整的Provider和Token管理功能
- ✅ 实时会话监控和管理
- ✅ 详细的统计信息和数据可视化

**核心功能**
- ✅ 多Provider支持(Claude, OpenAI, Qwen, Gemini)
- ✅ 智能Token轮询策略(4种策略可选)
- ✅ Token健康检查和自动切换
- ✅ 会话生命周期管理
- ✅ 配置导入导出功能

**技术栈**
- ✅ 前端: Electron + React + TypeScript + Ant Design
- ✅ 后端: Spring Boot 3.x + MyBatis + MySQL
- ✅ 终端: xterm.js + node-pty
- ✅ 状态管理: Redux Toolkit

---

**文档版本**: v2.0.2
**最后更新**: 2025-10-03
**适用版本**: LLMctl 2.0.0及以上

如有任何问题或建议，欢迎通过GitHub Issues反馈！