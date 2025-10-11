package com.llmctl.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;



/**
 * 登录请求DTO
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Data
public class LoginRequest {

    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    private String username;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    private String password;

    /**
     * IP地址（由Controller设置）
     */
    private String ipAddress;

    /**
     * User Agent（由Controller设置）
     */
    private String userAgent;
}
