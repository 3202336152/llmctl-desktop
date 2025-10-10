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

-- jfdev_db.global_config definition

CREATE TABLE `global_config` (
                                 `id` int NOT NULL AUTO_INCREMENT COMMENT '配置ID',
                                 `config_key` varchar(100) NOT NULL COMMENT '配置键',
                                 `config_value` text COMMENT '配置值',
                                 `description` varchar(500) DEFAULT NULL COMMENT '配置描述',
                                 `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                 PRIMARY KEY (`id`),
                                 UNIQUE KEY `uk_config_key` (`config_key`),
                                 KEY `idx_config_key` (`config_key`) COMMENT '配置键索引'
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='全局配置表';


-- jfdev_db.provider_templates definition

CREATE TABLE `provider_templates` (
                                      `id` varchar(50) NOT NULL COMMENT '模板唯一标识',
                                      `name` varchar(100) NOT NULL COMMENT '模板名称',
                                      `description` text COMMENT '模板描述',
                                      `type` varchar(20) NOT NULL COMMENT 'Provider类型',
                                      `default_base_url` varchar(500) DEFAULT NULL COMMENT '默认基础URL',
                                      `default_model_name` varchar(100) DEFAULT NULL COMMENT '默认模型名称',
                                      `env_vars_template` json DEFAULT NULL COMMENT '环境变量模板',
                                      `setup_prompts` json DEFAULT NULL COMMENT '设置提示配置',
                                      `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
                                      `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                      `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                      PRIMARY KEY (`id`),
                                      KEY `idx_type` (`type`) COMMENT 'Provider类型索引',
                                      KEY `idx_active` (`is_active`) COMMENT '启用状态索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Provider模板表';


-- jfdev_db.providers definition

CREATE TABLE `providers` (
                             `id` varchar(50) NOT NULL COMMENT 'Provider唯一标识',
                             `name` varchar(100) NOT NULL COMMENT 'Provider名称',
                             `description` text COMMENT 'Provider描述',
                             `type` varchar(20) NOT NULL COMMENT 'Provider类型: anthropic, openai, qwen, gemini',
                             `base_url` varchar(500) DEFAULT NULL COMMENT 'API基础URL',
                             `model_name` varchar(100) DEFAULT NULL COMMENT '模型名称',
                             `max_tokens` int DEFAULT '4096' COMMENT '最大Token数',
                             `max_output_tokens` int DEFAULT NULL COMMENT '最大输出Token数',
                             `temperature` decimal(3,2) DEFAULT '0.70' COMMENT '温度参数',
                             `extra_headers` json DEFAULT NULL COMMENT '额外HTTP头',
                             `token_strategy_type` enum('round-robin','weighted','random','least-used') DEFAULT 'round-robin' COMMENT 'Token轮询策略',
                             `token_fallback_on_error` tinyint(1) DEFAULT '1' COMMENT '错误时是否故障切换',
                             `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
                             `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                             `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                             PRIMARY KEY (`id`),
                             KEY `idx_type` (`type`) COMMENT 'Provider类型索引',
                             KEY `idx_created_at` (`created_at`) COMMENT '创建时间索引',
                             KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='LLM Provider配置表';


-- jfdev_db.sessions definition

CREATE TABLE `sessions` (
                            `id` varchar(50) NOT NULL COMMENT '会话唯一标识',
                            `provider_id` varchar(50) NOT NULL COMMENT '关联的Provider ID',
                            `pid` int DEFAULT NULL COMMENT '进程ID',
                            `working_directory` varchar(1000) DEFAULT NULL COMMENT '工作目录',
                            `command` varchar(200) DEFAULT NULL COMMENT '启动命令',
                            `status` enum('active','inactive','terminated') DEFAULT 'active' COMMENT '会话状态',
                            `start_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '启动时间',
                            `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后活动时间',
                            `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
                            `token_id` varchar(64) DEFAULT NULL,
                            PRIMARY KEY (`id`),
                            KEY `idx_provider_id` (`provider_id`) COMMENT 'Provider关联索引',
                            KEY `idx_status` (`status`) COMMENT '状态索引',
                            KEY `idx_pid` (`pid`) COMMENT '进程ID索引',
                            KEY `idx_start_time` (`start_time`) COMMENT '启动时间索引',
                            KEY `idx_token_id` (`token_id`),
                            CONSTRAINT `fk_sessions_provider_id` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='CLI会话管理表';


-- jfdev_db.tokens definition

CREATE TABLE `tokens` (
                          `id` varchar(50) NOT NULL COMMENT 'Token唯一标识',
                          `provider_id` varchar(50) NOT NULL COMMENT '关联的Provider ID',
                          `value` varchar(500) NOT NULL COMMENT 'Token值（加密存储）',
                          `alias` varchar(100) DEFAULT NULL COMMENT 'Token别名',
                          `weight` int DEFAULT '1' COMMENT '权重（用于加权轮询）',
                          `enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用',
                          `healthy` tinyint(1) DEFAULT '1' COMMENT '健康状态',
                          `last_used` timestamp NULL DEFAULT NULL COMMENT '最后使用时间',
                          `encryption_version` varchar(20) DEFAULT NULL COMMENT '加密版本：null/plaintext=明文，v1=AES-256-GCM',
                          `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                          `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                          PRIMARY KEY (`id`),
                          KEY `idx_provider_id` (`provider_id`) COMMENT 'Provider关联索引',
                          KEY `idx_enabled` (`enabled`) COMMENT '启用状态索引',
                          KEY `idx_last_used` (`last_used`) COMMENT '最后使用时间索引',
                          KEY `idx_healthy` (`healthy`) COMMENT '健康状态索引',
                          KEY `idx_encryption_version` (`encryption_version`) COMMENT '加密版本索引',
                          CONSTRAINT `fk_tokens_provider_id` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Token管理表';


-- jfdev_db.usage_statistics definition

CREATE TABLE `usage_statistics` (
                                    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '统计记录ID',
                                    `provider_id` varchar(50) NOT NULL COMMENT '关联的Provider ID',
                                    `token_id` varchar(50) DEFAULT NULL COMMENT '关联的Token ID',
                                    `request_count` int DEFAULT '1' COMMENT '请求次数',
                                    `success_count` int DEFAULT '0' COMMENT '成功次数',
                                    `error_count` int DEFAULT '0' COMMENT '错误次数',
                                    `total_tokens` int DEFAULT '0' COMMENT '总Token消耗',
                                    `date` date NOT NULL COMMENT '统计日期',
                                    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                    PRIMARY KEY (`id`),
                                    UNIQUE KEY `uk_daily_stats` (`provider_id`,`token_id`,`date`) COMMENT '每日统计唯一约束',
                                    KEY `idx_date` (`date`) COMMENT '日期索引',
                                    KEY `idx_provider_date` (`provider_id`,`date`) COMMENT 'Provider日期联合索引',
                                    KEY `fk_usage_token_id` (`token_id`),
                                    CONSTRAINT `fk_usage_provider_id` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
                                    CONSTRAINT `fk_usage_token_id` FOREIGN KEY (`token_id`) REFERENCES `tokens` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='使用统计表';