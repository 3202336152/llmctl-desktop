package com.llmctl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户信息DTO（用于列表展示）
 *
 * @author Liu Yifan
 * @version 2.1.4
 * @since 2025-10-15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDTO {

    /**
     * 用户ID
     */
    private Long id;

    /**
     * 用户名
     */
    private String username;

    /**
     * 昵称
     */
    private String displayName;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 账户状态（ACTIVE, LOCKED, DISABLED）
     */
    private String status;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginAt;

    /**
     * 头像URL
     */
    private String avatarUrl;
}
