package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户实体类
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class User {

    /**
     * 用户ID（主键）
     */
    private Long id;

    /**
     * 用户名（登录用，唯一）
     */
    private String username;

    /**
     * 密码哈希（BCrypt加密）
     */
    private String passwordHash;

    /**
     * 昵称
     */
    private String displayName;

    /**
     * 邮箱（可选，唯一）
     */
    private String email;

    /**
     * 头像URL（可选）
     */
    private String avatarUrl;

    /**
     * 账户是否激活
     */
    private Boolean isActive;

    /**
     * 账户是否锁定
     */
    private Boolean isLocked;

    /**
     * 失败登录次数
     */
    private Integer failedLoginAttempts;

    /**
     * 锁定到期时间
     */
    private LocalDateTime lockedUntil;

    /**
     * Refresh Token哈希
     */
    private String refreshTokenHash;

    /**
     * Refresh Token过期时间
     */
    private LocalDateTime refreshTokenExpiresAt;

    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginAt;

    /**
     * 最后登录IP
     */
    private String lastLoginIp;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
