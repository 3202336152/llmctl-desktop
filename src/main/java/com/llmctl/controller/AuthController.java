package com.llmctl.controller;

import com.llmctl.dto.*;
import com.llmctl.service.IAuthService;
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
            @RequestHeader("Authorization") String authHeader) {
        log.info("用户登出请求");

        // 从Token中提取用户ID
        String token = authHeader.substring(7); // 去掉"Bearer "
        Long userId = jwtUtil.getUserIdFromToken(token);

        authService.logout(userId);

        return ResponseEntity.ok(ApiResponse.success(null, "登出成功"));
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
