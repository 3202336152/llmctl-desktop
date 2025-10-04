package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 全局配置实体类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class GlobalConfig {

    /**
     * 配置ID
     */
    private Integer id;

    /**
     * 配置键
     */
    private String configKey;

    /**
     * 配置值
     */
    private String configValue;

    /**
     * 配置描述
     */
    private String description;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 常用配置键常量
     */
    public static class ConfigKeys {
        /**
         * 当前活跃的Provider ID
         */
        public static final String ACTIVE_PROVIDER_ID = "active_provider_id";

        /**
         * 应用版本号
         */
        public static final String APP_VERSION = "app_version";

        /**
         * 最后备份时间
         */
        public static final String LAST_BACKUP_TIME = "last_backup_time";

        /**
         * 是否启用自动备份
         */
        public static final String AUTO_BACKUP_ENABLED = "auto_backup_enabled";

        /**
         * 会话最大空闲时间（秒）
         */
        public static final String MAX_SESSION_IDLE_TIME = "max_session_idle_time";

        /**
         * Token错误阈值
         */
        public static final String TOKEN_ERROR_THRESHOLD = "token_error_threshold";

        /**
         * Token冷却时间（秒）
         */
        public static final String TOKEN_COOLDOWN_PERIOD = "token_cooldown_period";

        // ==================== 应用设置相关配置 ====================

        /**
         * 是否开机自启动
         */
        public static final String AUTO_START = "app.auto_start";

        /**
         * 是否最小化到系统托盘
         */
        public static final String MINIMIZE_TO_TRAY = "app.minimize_to_tray";

        /**
         * 是否显示通知
         */
        public static final String SHOW_NOTIFICATIONS = "app.show_notifications";

        /**
         * 主题设置 (light/dark/auto)
         */
        public static final String THEME = "app.theme";

        /**
         * 语言设置 (zh/en)
         */
        public static final String LANGUAGE = "app.language";
    }

    /**
     * 获取配置值作为字符串
     *
     * @return 配置值，如果为null则返回空字符串
     */
    public String getValueAsString() {
        return this.configValue != null ? this.configValue : "";
    }

    /**
     * 获取配置值作为整数
     *
     * @return 配置值转换为整数
     * @throws NumberFormatException 如果配置值无法转换为整数
     */
    public Integer getValueAsInteger() {
        if (this.configValue == null || this.configValue.trim().isEmpty()) {
            return null;
        }
        return Integer.valueOf(this.configValue);
    }

    /**
     * 获取配置值作为长整数
     *
     * @return 配置值转换为长整数
     * @throws NumberFormatException 如果配置值无法转换为长整数
     */
    public Long getValueAsLong() {
        if (this.configValue == null || this.configValue.trim().isEmpty()) {
            return null;
        }
        return Long.valueOf(this.configValue);
    }

    /**
     * 获取配置值作为布尔值
     *
     * @return 配置值转换为布尔值
     */
    public Boolean getValueAsBoolean() {
        if (this.configValue == null || this.configValue.trim().isEmpty()) {
            return false;
        }
        return Boolean.valueOf(this.configValue);
    }

    /**
     * 设置配置值（从Object）
     *
     * @param value 配置值对象
     */
    public void setValue(Object value) {
        this.configValue = value != null ? value.toString() : null;
    }
}