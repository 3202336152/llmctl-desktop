package com.llmctl.service;

import com.llmctl.dto.LoginRequest;
import com.llmctl.dto.LoginResponse;
import com.llmctl.dto.RegisterRequest;

/**
 * 认证服务接口
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
public interface IAuthService {

    /**
     * 用户登录
     *
     * @param request 登录请求
     * @return 登录响应（包含Token）
     */
    LoginResponse login(LoginRequest request);

    /**
     * 用户注册
     *
     * @param request 注册请求
     */
    void register(RegisterRequest request);

    /**
     * 刷新Token
     *
     * @param refreshToken Refresh Token
     * @return 新的登录响应
     */
    LoginResponse refreshToken(String refreshToken);

    /**
     * 用户登出
     *
     * @param userId 用户ID
     */
    void logout(Long userId);
}
