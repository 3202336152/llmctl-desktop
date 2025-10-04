package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * CLI会话管理实体类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class Session {

    /**
     * 会话唯一标识
     */
    private String id;

    /**
     * 关联的Provider ID
     */
    private String providerId;

    /**
     * 关联的Token ID
     */
    private String tokenId;

    /**
     * 进程ID
     */
    private Integer pid;

    /**
     * 工作目录
     */
    private String workingDirectory;

    /**
     * 启动命令
     */
    private String command;

    /**
     * 会话状态
     */
    private SessionStatus status;

    /**
     * 启动时间
     */
    private LocalDateTime startTime;

    /**
     * 最后活动时间
     */
    private LocalDateTime lastActivity;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 关联的Provider对象 (多对一关系)
     */
    private Provider provider;

    /**
     * 会话状态枚举
     */
    public enum SessionStatus {
        /**
         * 活跃状态
         */
        ACTIVE("active"),

        /**
         * 非活跃状态（已终止但可重新启动）
         */
        INACTIVE("inactive"),

        /**
         * 已终止状态
         * @deprecated 该状态已废弃，不再使用。终止会话现在使用 INACTIVE 状态。
         *             保留此枚举值仅为数据库兼容性考虑。
         */
        @Deprecated
        TERMINATED("terminated");

        private final String value;

        SessionStatus(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        /**
         * 根据字符串值获取枚举
         */
        public static SessionStatus fromValue(String value) {
            for (SessionStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Invalid SessionStatus: " + value);
        }
    }

    /**
     * 检查会话是否活跃
     *
     * @return true如果会话状态为ACTIVE
     */
    public boolean isActive() {
        return SessionStatus.ACTIVE.equals(this.status);
    }

    /**
     * 更新最后活动时间
     */
    public void updateLastActivity() {
        this.lastActivity = LocalDateTime.now();
    }

    /**
     * 终止会话（设置为非活跃状态）
     */
    public void terminate() {
        this.status = SessionStatus.INACTIVE;
        this.endTime = LocalDateTime.now();
    }

    /**
     * 计算会话持续时间（分钟）
     *
     * @return 会话持续时间，如果会话未结束则返回到当前时间的持续时间
     */
    public long getDurationMinutes() {
        LocalDateTime endTimeToUse = this.endTime != null ? this.endTime : LocalDateTime.now();
        return java.time.Duration.between(this.startTime, endTimeToUse).toMinutes();
    }
}