-- LLMctl 数据库初始化脚本
-- 作者: Liu Yifan
-- 版本: 2.0.0
-- 日期: 2025-09-28

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `llmctl`
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- 使用数据库
USE `llmctl`;

-- 1. 创建 providers 表
CREATE TABLE `providers` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Provider唯一标识',
    `name` VARCHAR(100) NOT NULL COMMENT 'Provider名称',
    `description` TEXT COMMENT 'Provider描述',
    `type` VARCHAR(20) NOT NULL COMMENT 'Provider类型',
    `base_url` VARCHAR(500) COMMENT 'API基础URL',
    `model_name` VARCHAR(100) COMMENT '模型名称',
    `max_tokens` INT DEFAULT 4096 COMMENT '最大Token数',
    `max_output_tokens` INT COMMENT '最大输出Token数',
    `temperature` DECIMAL(3,2) DEFAULT 0.7 COMMENT '温度参数',
    `extra_headers` JSON COMMENT '额外HTTP头',
    `token_strategy_type` ENUM('round-robin', 'weighted', 'random', 'least-used') DEFAULT 'round-robin' COMMENT 'Token轮询策略',
    `token_fallback_on_error` BOOLEAN DEFAULT TRUE COMMENT '错误时是否故障切换',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='LLM Provider配置表';

-- 2. 创建 tokens 表
CREATE TABLE `tokens` (
    `id` VARCHAR(50) NOT NULL COMMENT 'Token唯一标识',
    `provider_id` VARCHAR(50) NOT NULL COMMENT '关联的Provider ID',
    `value` VARCHAR(500) NOT NULL COMMENT 'Token值',
    `alias` VARCHAR(100) COMMENT 'Token别名',
    `weight` INT DEFAULT 1 COMMENT '权重',
    `enabled` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    `healthy` BOOLEAN DEFAULT TRUE COMMENT '健康状态',
    `last_used` TIMESTAMP NULL COMMENT '最后使用时间',
    `error_count` INT DEFAULT 0 COMMENT '错误次数',
    `last_error_time` TIMESTAMP NULL COMMENT '最后错误时间',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_provider_id` (`provider_id`),
    INDEX `idx_enabled` (`enabled`),
    INDEX `idx_last_used` (`last_used`),
    INDEX `idx_healthy` (`healthy`),
    CONSTRAINT `fk_tokens_provider_id` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Token管理表';

-- 3. 创建 sessions 表
CREATE TABLE `sessions` (
    `id` VARCHAR(50) NOT NULL COMMENT '会话唯一标识',
    `provider_id` VARCHAR(50) NOT NULL COMMENT '关联的Provider ID',
    `pid` INT COMMENT '进程ID',
    `working_directory` VARCHAR(1000) COMMENT '工作目录',
    `command` VARCHAR(200) COMMENT '启动命令',
    `status` ENUM('active', 'inactive', 'terminated') DEFAULT 'active' COMMENT '会话状态',
    `start_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '启动时间',
    `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活动时间',
    `end_time` TIMESTAMP NULL COMMENT '结束时间',
    PRIMARY KEY (`id`),
    INDEX `idx_provider_id` (`provider_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_pid` (`pid`),
    INDEX `idx_start_time` (`start_time`),
    CONSTRAINT `fk_sessions_provider_id` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='CLI会话管理表';

-- 4. 创建 global_config 表
CREATE TABLE `global_config` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `config_value` TEXT COMMENT '配置值',
    `description` VARCHAR(500) COMMENT '配置描述',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_config_key` (`config_key`),
    INDEX `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='全局配置表';

-- 5. 创建 provider_templates 表
CREATE TABLE `provider_templates` (
    `id` VARCHAR(50) NOT NULL COMMENT '模板唯一标识',
    `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
    `description` TEXT COMMENT '模板描述',
    `type` VARCHAR(20) NOT NULL COMMENT 'Provider类型',
    `default_base_url` VARCHAR(500) COMMENT '默认基础URL',
    `default_model_name` VARCHAR(100) COMMENT '默认模型名称',
    `env_vars_template` JSON COMMENT '环境变量模板',
    `setup_prompts` JSON COMMENT '设置提示配置',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Provider模板表';

-- 6. 创建 usage_statistics 表
CREATE TABLE `usage_statistics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '统计记录ID',
    `provider_id` VARCHAR(50) NOT NULL COMMENT '关联的Provider ID',
    `token_id` VARCHAR(50) COMMENT '关联的Token ID',
    `request_count` INT DEFAULT 1 COMMENT '请求次数',
    `success_count` INT DEFAULT 0 COMMENT '成功次数',
    `error_count` INT DEFAULT 0 COMMENT '错误次数',
    `total_tokens` INT DEFAULT 0 COMMENT '总Token消耗',
    `date` DATE NOT NULL COMMENT '统计日期',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_daily_stats` (`provider_id`, `token_id`, `date`),
    INDEX `idx_date` (`date`),
    INDEX `idx_provider_date` (`provider_id`, `date`),
    CONSTRAINT `fk_usage_provider_id` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_usage_token_id` FOREIGN KEY (`token_id`) REFERENCES `tokens`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='使用统计表';

-- 插入默认全局配置
INSERT INTO `global_config` (`config_key`, `config_value`, `description`) VALUES
('active_provider_id', NULL, '当前活跃的Provider ID'),
('app_version', '2.0.0', '应用版本号'),
('last_backup_time', NULL, '最后备份时间'),
('auto_backup_enabled', 'true', '是否启用自动备份'),
('max_session_idle_time', '3600', '会话最大空闲时间（秒）'),
('token_error_threshold', '3', 'Token错误阈值'),
('token_cooldown_period', '60', 'Token冷却时间（秒）');

-- 插入默认Provider模板
INSERT INTO `provider_templates` (`id`, `name`, `description`, `type`, `default_base_url`, `default_model_name`, `env_vars_template`, `setup_prompts`) VALUES
('anthropic', 'Claude (Anthropic)', 'Claude AI模型配置模板', 'anthropic', 'https://api.anthropic.com', 'claude-sonnet-4-5-20250929-20241022',
 JSON_OBJECT('ANTHROPIC_AUTH_TOKEN', '{token}', 'ANTHROPIC_BASE_URL', '{baseUrl}', 'ANTHROPIC_MODEL', '{modelName}'),
 JSON_ARRAY(JSON_OBJECT('type', 'input', 'name', 'name', 'message', 'Provider名称', 'required', true), JSON_OBJECT('type', 'password', 'name', 'token', 'message', 'API Key', 'required', true))),

('openai', 'OpenAI GPT', 'OpenAI GPT模型配置模板', 'openai', 'https://api.openai.com', 'gpt-4',
 JSON_OBJECT('OPENAI_API_KEY', '{token}', 'OPENAI_BASE_URL', '{baseUrl}', 'OPENAI_MODEL', '{modelName}'),
 JSON_ARRAY(JSON_OBJECT('type', 'input', 'name', 'name', 'message', 'Provider名称', 'required', true), JSON_OBJECT('type', 'password', 'name', 'token', 'message', 'API Key', 'required', true))),

('qwen', 'Qwen (阿里云)', 'Qwen模型配置模板', 'qwen', 'https://dashscope.aliyuncs.com', 'qwen-max',
 JSON_OBJECT('DASHSCOPE_API_KEY', '{token}', 'DASHSCOPE_BASE_URL', '{baseUrl}', 'QWEN_MODEL', '{modelName}'),
 JSON_ARRAY(JSON_OBJECT('type', 'input', 'name', 'name', 'message', 'Provider名称', 'required', true), JSON_OBJECT('type', 'password', 'name', 'token', 'message', 'API Key', 'required', true))),

('gemini', 'Gemini (Google)', 'Gemini模型配置模板', 'gemini', 'https://generativelanguage.googleapis.com', 'gemini-pro',
 JSON_OBJECT('GOOGLE_API_KEY', '{token}', 'GOOGLE_BASE_URL', '{baseUrl}', 'GEMINI_MODEL', '{modelName}'),
 JSON_ARRAY(JSON_OBJECT('type', 'input', 'name', 'name', 'message', 'Provider名称', 'required', true), JSON_OBJECT('type', 'password', 'name', 'token', 'message', 'API Key', 'required', true)));

-- 脚本执行完成
SELECT '数据库初始化完成！' AS message;