package com.llmctl.service;

import com.llmctl.dto.*;
import org.springframework.web.multipart.MultipartFile;

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

    /**
     * 更新个人信息
     *
     * @param userId 用户ID
     * @param request 更新请求
     * @return 更新后的用户信息
     */
    UserInfoDTO updateProfile(Long userId, UpdateProfileRequest request);

    /**
     * 修改密码（需要邮箱验证码）
     *
     * @param userId 用户ID
     * @param request 修改密码请求
     */
    void changePassword(Long userId, ChangePasswordRequest request);

    /**
     * 上传头像
     *
     * @param userId 用户ID
     * @param file 头像文件
     * @return 头像URL
     * @throws java.io.IOException 文件IO异常
     */
    String uploadAvatar(Long userId, MultipartFile file) throws java.io.IOException;
}
