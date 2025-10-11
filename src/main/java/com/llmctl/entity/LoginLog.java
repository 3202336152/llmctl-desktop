package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 登录日志实体类
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class LoginLog {

    /**
     * 日志ID（主键）
     */
    private Long id;

    /**
     * 用户ID（登录成功时才有）
     */
    private Long userId;

    /**
     * 尝试登录的用户名
     */
    private String username;

    /**
     * 登录结果：SUCCESS/FAILED/LOCKED
     */
    private LoginResult loginResult;

    /**
     * 失败原因
     */
    private String failureReason;

    /**
     * IP地址
     */
    private String ipAddress;

    /**
     * 客户端信息（User Agent）
     */
    private String userAgent;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 登录结果枚举
     */
    public enum LoginResult {
        /**
         * 登录成功
         */
        SUCCESS("SUCCESS"),

        /**
         * 登录失败
         */
        FAILED("FAILED"),

        /**
         * 账户已锁定
         */
        LOCKED("LOCKED");

        private final String value;

        LoginResult(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        /**
         * 根据字符串值获取枚举
         */
        public static LoginResult fromValue(String value) {
            for (LoginResult result : values()) {
                if (result.value.equals(value)) {
                    return result;
                }
            }
            throw new IllegalArgumentException("Invalid LoginResult: " + value);
        }
    }
}
