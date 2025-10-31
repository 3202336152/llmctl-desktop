-- =============================================================================
-- LLMctl Database Migration Script
-- Version: v2.3.1
-- Feature: 为 mcp_servers 表添加 user_id 字段，实现用户级 MCP 管理
-- Created: 2025-01-30
-- =============================================================================

-- 说明：
-- 1. 添加 user_id 字段，允许为 NULL（模板的 user_id 为 NULL）
-- 2. 全局模板：user_id IS NULL AND is_template = 1
-- 3. 用户的 MCP 服务器：user_id = 当前用户ID AND is_template = 0

-- -----------------------------------------------------------------------------
-- Step 1: 添加 user_id 字段
-- -----------------------------------------------------------------------------
ALTER TABLE `mcp_servers`
ADD COLUMN `user_id` BIGINT NULL COMMENT '用户ID（NULL表示全局模板，非NULL表示用户专属MCP）'
AFTER `id`;

-- -----------------------------------------------------------------------------
-- Step 2: 添加索引以提升查询性能
-- -----------------------------------------------------------------------------
CREATE INDEX `idx_mcp_servers_user_id` ON `mcp_servers`(`user_id`);
CREATE INDEX `idx_mcp_servers_is_template` ON `mcp_servers`(`is_template`);
CREATE INDEX `idx_mcp_servers_user_template` ON `mcp_servers`(`user_id`, `is_template`);

-- -----------------------------------------------------------------------------
-- Step 3: 验证数据
-- -----------------------------------------------------------------------------
-- 检查现有数据（所有模板的 user_id 应该为 NULL）
-- SELECT * FROM mcp_servers WHERE user_id IS NULL AND is_template = 1;
--
-- 预期结果：所有内置模板（7 个）

-- =============================================================================
-- Migration Complete
-- =============================================================================
