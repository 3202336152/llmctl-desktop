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

-- llmctl.global_config definition

CREATE TABLE `global_config` (
                                 `id` int NOT NULL,
                                 `config_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT '配置键',
                                 `config_value` text COLLATE utf8mb4_general_ci COMMENT '配置值',
                                 `description` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '配置描述',
                                 `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='全局配置表';


-- llmctl.provider_templates definition

CREATE TABLE `provider_templates` (
                                      `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '模板唯一标识',
                                      `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT '模板名称',
                                      `description` text COLLATE utf8mb4_general_ci COMMENT '模板描述',
                                      `type` varchar(20) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Provider类型',
                                      `default_base_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '默认基础URL',
                                      `default_model_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '默认模型名称',
                                      `env_vars_template` json DEFAULT NULL COMMENT '环境变量模板',
                                      `setup_prompts` json DEFAULT NULL COMMENT '设置提示配置',
                                      `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
                                      `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                      `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Provider模板表';


-- llmctl.usage_statistics definition

CREATE TABLE `usage_statistics` (
                                    `id` bigint NOT NULL,
                                    `provider_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
                                    `token_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
                                    `request_count` int DEFAULT NULL,
                                    `success_count` int DEFAULT NULL,
                                    `error_count` int DEFAULT NULL,
                                    `total_tokens` int DEFAULT NULL,
                                    `date` date NOT NULL,
                                    `created_at` timestamp NULL DEFAULT NULL,
                                    `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='使用统计表';


-- llmctl.users definition

CREATE TABLE `users` (
                         `id` bigint NOT NULL AUTO_INCREMENT,
                         `username` varchar(50) NOT NULL COMMENT '用户名（登录用）',
                         `password_hash` varchar(255) NOT NULL COMMENT '密码哈希（BCrypt）',
                         `display_name` varchar(100) DEFAULT NULL COMMENT '昵称',
                         `email` varchar(100) DEFAULT NULL COMMENT '邮箱（可选）',
                         `avatar_url` varchar(255) DEFAULT NULL COMMENT '头像URL（可选）',
                         `is_active` tinyint(1) DEFAULT '1' COMMENT '账户是否激活',
                         `is_locked` tinyint(1) DEFAULT '0' COMMENT '账户是否锁定',
                         `failed_login_attempts` int DEFAULT '0' COMMENT '失败登录次数',
                         `locked_until` timestamp NULL DEFAULT NULL COMMENT '锁定到期时间',
                         `refresh_token_hash` varchar(255) DEFAULT NULL COMMENT 'Refresh Token哈希',
                         `refresh_token_expires_at` timestamp NULL DEFAULT NULL COMMENT 'Refresh Token过期时间',
                         `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
                         `last_login_ip` varchar(45) DEFAULT NULL COMMENT '最后登录IP',
                         `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                         `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                         PRIMARY KEY (`id`),
                         UNIQUE KEY `username` (`username`),
                         UNIQUE KEY `email` (`email`),
                         KEY `idx_username` (`username`),
                         KEY `idx_email` (`email`),
                         KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户表';


-- llmctl.login_logs definition

CREATE TABLE `login_logs` (
                              `id` bigint NOT NULL AUTO_INCREMENT,
                              `user_id` bigint DEFAULT NULL COMMENT '用户ID（登录成功时才有）',
                              `username` varchar(50) NOT NULL COMMENT '尝试登录的用户名',
                              `login_result` enum('SUCCESS','FAILED','LOCKED') NOT NULL COMMENT '登录结果',
                              `failure_reason` varchar(255) DEFAULT NULL COMMENT '失败原因',
                              `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
                              `user_agent` varchar(500) DEFAULT NULL COMMENT '客户端信息',
                              `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                              PRIMARY KEY (`id`),
                              KEY `idx_user_id` (`user_id`),
                              KEY `idx_username` (`username`),
                              KEY `idx_created_at` (`created_at`),
                              CONSTRAINT `fk_login_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='登录日志表';


-- llmctl.providers definition

CREATE TABLE `providers` (
                             `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Provider唯一标识',
                             `user_id` bigint NOT NULL,
                             `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Provider名称',
                             `description` text COLLATE utf8mb4_general_ci COMMENT 'Provider描述',
                             `type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Provider类型: claude code, codex, gemini, qoder',
                             `base_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'API基础URL',
                             `model_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '模型名称',
                             `max_tokens` int DEFAULT '4096' COMMENT '最大Token数',
                             `temperature` decimal(3,2) DEFAULT '0.70' COMMENT '温度参数',
                             `extra_headers` json DEFAULT NULL COMMENT '额外HTTP头',
                             `token_strategy_type` enum('round-robin','weighted','random','least-used') COLLATE utf8mb4_general_ci DEFAULT 'round-robin' COMMENT 'Token轮询策略',
                             `token_fallback_on_error` tinyint(1) DEFAULT '1' COMMENT '错误时是否故障切换',
                             `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
                             `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                             `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                             KEY `idx_user_id` (`user_id`),
                             CONSTRAINT `fk_provider_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='LLM Provider配置表';


-- llmctl.sessions definition

CREATE TABLE `sessions` (
                            `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '会话唯一标识',
                            `user_id` bigint NOT NULL,
                            `provider_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '关联的Provider ID',
                            `pid` int DEFAULT NULL COMMENT '进程ID',
                            `working_directory` varchar(1000) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '工作目录',
                            `command` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '启动命令',
                            `status` enum('active','inactive','terminated') COLLATE utf8mb4_general_ci DEFAULT 'active' COMMENT '会话状态',
                            `start_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '启动时间',
                            `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后活动时间',
                            `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
                            `token_id` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Token标识',
                            KEY `idx_user_id` (`user_id`),
                            CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='会话管理表';


-- llmctl.tokens definition

CREATE TABLE `tokens` (
                          `id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Token唯一标识',
                          `user_id` bigint NOT NULL,
                          `provider_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '关联的Provider ID',
                          `value` varchar(500) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Token值（加密存储）',
                          `alias` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Token别名',
                          `weight` int DEFAULT '1' COMMENT '权重（用于加权轮询）',
                          `enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用',
                          `healthy` tinyint(1) DEFAULT '1' COMMENT '健康状态',
                          `last_used` timestamp NULL DEFAULT NULL COMMENT '最后使用时间',
                          `encryption_version` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '加密版本：null/plaintext=明文，v1=AES-256-GCM',
                          `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                          `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                          `value_hash` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Token明文值的SHA-256 Hash，用于唯一性检查',
                          UNIQUE KEY `uk_user_token_value` (`user_id`,`value`),
                          KEY `idx_encryption_version` (`encryption_version`) COMMENT '加密版本索引',
                          KEY `idx_user_id` (`user_id`),
                          CONSTRAINT `fk_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Token管理表';


-- llmctl.notifications definition

CREATE TABLE `notifications` (
                                     `id` bigint NOT NULL AUTO_INCREMENT,
                                     `user_id` bigint NOT NULL COMMENT '用户ID',
                                     `type` enum('SYSTEM','SESSION','STATISTICS','WARNING','SUCCESS','ERROR') COLLATE utf8mb4_general_ci NOT NULL COMMENT '通知类型',
                                     `title` varchar(200) COLLATE utf8mb4_general_ci NOT NULL COMMENT '通知标题',
                                     `content` text COLLATE utf8mb4_general_ci COMMENT '通知内容（支持Markdown）',
                                     `data` json DEFAULT NULL COMMENT '额外数据（如会话ID、Provider ID等）',
                                     `is_read` tinyint(1) DEFAULT '0' COMMENT '是否已读',
                                     `priority` enum('LOW','NORMAL','HIGH','URGENT') COLLATE utf8mb4_general_ci DEFAULT 'NORMAL' COMMENT '优先级',
                                     `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                     `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                                     `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
                                     `action_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '点击后跳转的URL',
                                     `action_text` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '按钮文字',
                                     PRIMARY KEY (`id`),
                                     KEY `idx_user_id` (`user_id`),
                                     KEY `idx_type` (`type`),
                                     KEY `idx_is_read` (`is_read`),
                                     KEY `idx_created_at` (`created_at`),
                                     KEY `idx_user_read` (`user_id`, `is_read`),
                                     KEY `idx_expires_at` (`expires_at`),
                                     CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='通知消息表';


-- llmctl.email_verification_codes definition

CREATE TABLE `email_verification_codes` (
    `id` varchar(36) NOT NULL COMMENT '验证码ID',
    `email` varchar(255) NOT NULL COMMENT '邮箱地址',
    `code` varchar(6) NOT NULL COMMENT '验证码(6位数字)',
    `purpose` enum('REGISTER','LOGIN','RESET_PASSWORD','CHANGE_PASSWORD') NOT NULL COMMENT '验证码用途',
    `used` tinyint(1) DEFAULT '0' COMMENT '是否已使用',
    `expire_time` datetime NOT NULL COMMENT '过期时间',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_email_purpose` (`email`,`purpose`),
    KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表';