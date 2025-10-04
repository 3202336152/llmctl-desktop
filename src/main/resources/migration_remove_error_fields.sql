-- 迁移脚本：删除tokens表的error_count和last_error_time字段
-- 作者: Liu Yifan
-- 日期: 2025-10-04
-- 说明: 从tokens表中移除不再使用的error_count和last_error_time字段

USE `llmctl`;

-- 删除error_count列（如果存在）
ALTER TABLE `tokens` DROP COLUMN IF EXISTS `error_count`;

-- 删除last_error_time列（如果存在）
ALTER TABLE `tokens` DROP COLUMN IF EXISTS `last_error_time`;

-- 验证修改
DESCRIBE `tokens`;

SELECT '迁移完成：已删除tokens表的error_count和last_error_time字段' AS message;
