package com.llmctl.controller;

import com.llmctl.dto.*;
import com.llmctl.service.IAuthService;
import com.llmctl.service.IVerificationCodeService;
import com.llmctl.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final IAuthService authService;
    private final IVerificationCodeService verificationCodeService;
    private final JwtUtil jwtUtil;

    /**
     * 用户登录
     *
     * POST /auth/login
     * {
     *   "username": "alice",
     *   "password": "password123"
     * }
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        // 获取客户端IP
        String ipAddress = getClientIP(httpRequest);
        request.setIpAddress(ipAddress);

        // 获取User Agent
        String userAgent = httpRequest.getHeader("User-Agent");
        request.setUserAgent(userAgent);

        LoginResponse response = authService.login(request);

        return ResponseEntity.ok(ApiResponse.success(response, "登录成功"));
    }

    /**
     * 用户注册
     *
     * POST /auth/register
     * {
     *   "username": "alice",
     *   "password": "password123",
     *   "displayName": "Alice Wang",
     *   "email": "alice@example.com"
     * }
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("用户注册请求: {}", request.getUsername());

        authService.register(request);

        return ResponseEntity.ok(ApiResponse.success(null, "注册成功"));
    }

    /**
     * 刷新Token
     *
     * POST /auth/refresh
     * {
     *   "refreshToken": "eyJhbGci..."
     * }
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        log.info("刷新Token请求");

        LoginResponse response = authService.refreshToken(request.getRefreshToken());

        return ResponseEntity.ok(ApiResponse.success(response, "Token刷新成功"));
    }

    /**
     * 登出
     *
     * POST /auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("用户登出请求");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // 从Token中提取用户ID
            String token = authHeader.substring(7); // 去掉"Bearer "
            Long userId = jwtUtil.getUserIdFromToken(token);
            authService.logout(userId);
        } else {
            // 如果没有token，执行清理操作（比如清理所有会话）
            authService.logout(null);
        }

        return ResponseEntity.ok(ApiResponse.success(null, "登出成功"));
    }

    /**
     * 发送验证码
     *
     * POST /auth/send-verification-code
     * {
     *   "email": "user@qq.com",
     *   "purpose": "REGISTER"
     * }
     */
    @PostMapping("/send-verification-code")
    public ResponseEntity<ApiResponse<Void>> sendVerificationCode(
            @Valid @RequestBody SendVerificationCodeRequest request) {
        log.info("发送验证码请求: email={}, purpose={}", request.getEmail(), request.getPurpose());

        verificationCodeService.sendVerificationCode(request.getEmail(), request.getPurpose());

        return ResponseEntity.ok(ApiResponse.success(null, "验证码已发送"));
    }

    /**
     * 验证验证码
     *
     * POST /auth/verify-code
     * {
     *   "email": "user@qq.com",
     *   "code": "123456",
     *   "purpose": "REGISTER"
     * }
     */
    @PostMapping("/verify-code")
    public ResponseEntity<ApiResponse<Boolean>> verifyCode(
            @Valid @RequestBody VerifyCodeRequest request) {
        log.info("验证验证码请求: email={}, purpose={}", request.getEmail(), request.getPurpose());

        boolean valid = verificationCodeService.verifyCode(
            request.getEmail(),
            request.getCode(),
            request.getPurpose()
        );

        return ResponseEntity.ok(ApiResponse.success(valid, valid ? "验证码正确" : "验证码无效"));
    }

    /**
     * 更新个人信息
     *
     * PUT /auth/profile
     * {
     *   "displayName": "新名称",
     *   "email": "new@example.com"
     * }
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserInfoDTO>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @RequestHeader("Authorization") String authHeader) {
        log.info("更新个人信息请求");

        // 从Token中提取用户ID
        String token = authHeader.substring(7); // 去掉"Bearer "
        Long userId = jwtUtil.getUserIdFromToken(token);

        UserInfoDTO updatedUser = authService.updateProfile(userId, request);

        return ResponseEntity.ok(ApiResponse.success(updatedUser, "个人信息更新成功"));
    }

    /**
     * 修改密码（需要邮箱验证码）
     *
     * PUT /auth/change-password
     * {
     *   "email": "user@qq.com",
     *   "verificationCode": "123456",
     *   "newPassword": "newPass123"
     * }
     */
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @RequestHeader("Authorization") String authHeader) {
        log.info("修改密码请求: email={}", request.getEmail());

        // 从Token中提取用户ID
        String token = authHeader.substring(7); // 去掉"Bearer "
        Long userId = jwtUtil.getUserIdFromToken(token);

        authService.changePassword(userId, request);

        return ResponseEntity.ok(ApiResponse.success(null, "密码修改成功"));
    }

    /**
     * 重置密码（忘记密码功能，不需要登录）
     *
     * POST /auth/reset-password
     * {
     *   "email": "user@qq.com",
     *   "verificationCode": "123456",
     *   "newPassword": "newPass123"
     * }
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        log.info("重置密码请求: email={}", request.getEmail());

        authService.resetPassword(request);

        return ResponseEntity.ok(ApiResponse.success(null, "密码重置成功，请使用新密码登录"));
    }

    /**
     * 上传头像
     *
     * POST /auth/upload-avatar
     * 支持multipart/form-data文件上传
     */
    @PostMapping("/upload-avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestHeader("Authorization") String authHeader) throws java.io.IOException {
        log.info("上传头像请求: filename={}, size={}", file.getOriginalFilename(), file.getSize());

        // 从Token中提取用户ID
        String token = authHeader.substring(7); // 去掉"Bearer "
        Long userId = jwtUtil.getUserIdFromToken(token);

        String avatarUrl = authService.uploadAvatar(userId, file);

        return ResponseEntity.ok(ApiResponse.success(avatarUrl, "头像上传成功"));
    }

    /**
     * 获取客户端IP地址
     */
    private String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
