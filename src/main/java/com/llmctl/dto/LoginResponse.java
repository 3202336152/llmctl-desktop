package com.llmctl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应DTO
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    /**
     * Access Token
     */
    private String accessToken;

    /**
     * Refresh Token
     */
    private String refreshToken;

    /**
     * Token类型（固定为"Bearer"）
     */
    private String tokenType;

    /**
     * Access Token过期时间（秒）
     */
    private Long expiresIn;

    /**
     * 用户ID
     */
    private Long userId;

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
     * 头像URL
     */
    private String avatarUrl;
}
