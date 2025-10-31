-- =============================================================================
-- LLMctl Database Migration Script (简化版 - 仅用于测试)
-- Version: v2.3.0
-- Feature: MCP (Model Context Protocol) Management - Simplified Templates
-- Created: 2025-01-30
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: 清除所有现有的 MCP 模板数据
-- -----------------------------------------------------------------------------
DELETE FROM `mcp_servers` WHERE `is_template` = 1;

-- -----------------------------------------------------------------------------
-- Step 2: 插入精简的 MCP 模板（每个类别只保留一个，方便测试）
-- -----------------------------------------------------------------------------

-- 1. 文件系统类别 - memory (无需任何配置，开箱即用)
INSERT INTO `mcp_servers`
(`name`, `description`, `type`, `command`, `args`, `env`, `enabled`, `is_template`, `template_category`, `icon`, `config_hints`)
VALUES
(
  'memory',
  '内存中的键值存储，支持持久化数据存储和检索',
  'stdio',
  'npx',
  JSON_ARRAY('-y', '@modelcontextprotocol/server-memory'),
  NULL,
  1,
  1,
  'filesystem',
  'hdd',
  JSON_OBJECT('description', '✅ 无需额外配置，开箱即用')
);

-- 2. 数据库类别 - sqlite (只需文件路径，不需要账号密码)
INSERT INTO `mcp_servers`
(`name`, `description`, `type`, `command`, `args`, `env`, `enabled`, `is_template`, `template_category`, `icon`, `config_hints`)
VALUES
(
  'sqlite',
  '连接 SQLite 数据库文件，轻量级数据库查询',
  'stdio',
  'npx',
  JSON_ARRAY('-y', '@modelcontextprotocol/server-sqlite', './test.db'),
  NULL,
  1,
  1,
  'database',
  'file',
  JSON_OBJECT('args[2]', 'SQLite 数据库文件路径，例如：./data/mydb.sqlite（会自动创建）')
);

-- 3. API & 服务类别 - fetch (无需任何配置，直接发送 HTTP 请求)
INSERT INTO `mcp_servers`
(`name`, `description`, `type`, `command`, `args`, `env`, `enabled`, `is_template`, `template_category`, `icon`, `config_hints`)
VALUES
(
  'fetch',
  'HTTP 请求工具，支持 GET/POST/PUT/DELETE 等请求',
  'stdio',
  'npx',
  JSON_ARRAY('-y', '@modelcontextprotocol/server-fetch'),
  NULL,
  1,
  1,
  'api',
  'cloud',
  JSON_OBJECT('description', '✅ 无需额外配置，可直接发送 HTTP 请求到任何 URL')
);

-- 4. 开发工具类别 - git (无需配置，自动检测 Git 仓库)
INSERT INTO `mcp_servers`
(`name`, `description`, `type`, `command`, `args`, `env`, `enabled`, `is_template`, `template_category`, `icon`, `config_hints`)
VALUES
(
  'git',
  'Git 版本控制集成，执行 Git 命令和查询仓库信息',
  'stdio',
  'npx',
  JSON_ARRAY('-y', '@modelcontextprotocol/server-git'),
  NULL,
  1,
  1,
  'dev-tools',
  'branches',
  JSON_OBJECT('description', '✅ 无需额外配置，自动检测当前工作目录的 Git 仓库')
);

-- 5. API & 服务类别 - context7 (需要配置 API Key)
INSERT INTO `mcp_servers`
(`name`, `description`, `type`, `command`, `args`, `env`, `enabled`, `is_template`, `template_category`, `icon`, `config_hints`)
VALUES
(
  'context7',
  'Context7 文档搜索服务，获取最新的库文档和代码示例',
  'stdio',
  'npx',
  JSON_ARRAY('-y', '@upstreamapi/mcp-context7'),
  JSON_OBJECT('CONTEXT7_API_KEY', 'your_api_key_here'),
  1,
  1,
  'api',
  'search',
  JSON_OBJECT(
    'env.CONTEXT7_API_KEY',
    '⚠️ 必需配置：Context7 API Key（在 https://context7.ai/ 申请免费或付费账户）',
    'description',
    '提供最新的库文档和 API 参考，支持数千个开源项目'
  )
);

-- 6. API & 服务类别 - brave-search (需要配置 API Key)
INSERT INTO `mcp_servers`
(`name`, `description`, `type`, `command`, `args`, `env`, `enabled`, `is_template`, `template_category`, `icon`, `config_hints`)
VALUES
(
  'brave-search',
  'Brave Search API 集成，支持网页搜索、新闻搜索等功能',
  'stdio',
  'npx',
  JSON_ARRAY('-y', '@modelcontextprotocol/server-brave-search'),
  JSON_OBJECT('BRAVE_API_KEY', 'your_api_key_here'),
  1,
  1,
  'api',
  'search',
  JSON_OBJECT(
    'env.BRAVE_API_KEY',
    '⚠️ 必需配置：Brave Search API Key（在 https://brave.com/search/api/ 申请）',
    'description',
    '提供独立、隐私优先的网页搜索能力，支持搜索、图片、新闻等'
  )
);

-- 7. 开发工具类别 - gitlab (需要配置 Personal Access Token)
INSERT INTO `mcp_servers`
(`name`, `description`, `type`, `command`, `args`, `env`, `enabled`, `is_template`, `template_category`, `icon`, `config_hints`)
VALUES
(
  'gitlab',
  'GitLab API 集成，管理项目、问题、合并请求等',
  'stdio',
  'npx',
  JSON_ARRAY('-y', '@modelcontextprotocol/server-gitlab'),
  JSON_OBJECT(
    'GITLAB_API_URL', 'https://gitlab.com/api/v4',
    'GITLAB_PERSONAL_ACCESS_TOKEN', 'your_gitlab_token_here'
  ),
  1,
  1,
  'dev-tools',
  'github',
  JSON_OBJECT(
    'env.GITLAB_API_URL',
    '✅ 可选配置：GitLab API URL（默认：https://gitlab.com/api/v4，自建实例需修改）',
    'env.GITLAB_PERSONAL_ACCESS_TOKEN',
    '⚠️ 必需配置：GitLab Personal Access Token（在 https://gitlab.com/-/profile/personal_access_tokens 创建）',
    'description',
    '支持 GitLab 项目管理、代码审查、CI/CD 流水线等功能'
  )
);

-- =============================================================================
-- Migration Complete - 简化版（7 个模板）
-- =============================================================================
-- 验证数据：
-- SELECT * FROM mcp_servers WHERE is_template = 1;
--
-- 预期结果：7 条记录
-- 1. memory (filesystem) - 内存存储（✅ 开箱即用）
-- 2. sqlite (database) - SQLite 数据库（✅ 开箱即用）
-- 3. fetch (api) - HTTP 请求工具（✅ 开箱即用）
-- 4. git (dev-tools) - Git 版本控制（✅ 开箱即用）
-- 5. context7 (api) - Context7 文档搜索（⚠️ 需要配置 API Key）
-- 6. brave-search (api) - Brave Search（⚠️ 需要配置 API Key）
-- 7. gitlab (dev-tools) - GitLab API（⚠️ 需要配置 Personal Access Token）
--
-- 注意：context7、brave-search 和 gitlab 需要用户在关联到 Provider 时配置自己的 API Key
