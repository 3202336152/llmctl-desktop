package com.llmctl.service.impl;

import com.llmctl.dto.LoginRequest;
import com.llmctl.dto.LoginResponse;
import com.llmctl.dto.RegisterRequest;
import com.llmctl.entity.LoginLog;
import com.llmctl.entity.User;
import com.llmctl.exception.AuthenticationException;
import com.llmctl.exception.BusinessException;
import com.llmctl.mapper.LoginLogMapper;
import com.llmctl.mapper.UserMapper;
import com.llmctl.service.IAuthService;
import com.llmctl.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 认证服务实现
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final UserMapper userMapper;
    private final LoginLogMapper loginLogMapper;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 30;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        log.info("用户尝试登录: {}", username);

        // 1. 查询用户
        User user = userMapper.findByUsername(username);
        if (user == null) {
            recordLoginFailure(null, username, "用户不存在", request.getIpAddress());
            throw new AuthenticationException("用户名或密码错误");
        }

        // 2. 检查账户状态
        if (!user.getIsActive()) {
            recordLoginFailure(user.getId(), username, "账户未激活", request.getIpAddress());
            throw new AuthenticationException("账户未激活");
        }

        // 3. 检查账户是否被锁定
        if (user.getIsLocked()) {
            if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                long remainingMinutes = java.time.Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes();
                recordLoginFailure(user.getId(), username, "账户已锁定", request.getIpAddress());
                throw new AuthenticationException("账户已锁定，请在 " + remainingMinutes + " 分钟后重试");
            } else {
                // 锁定时间已过，解锁账户
                userMapper.unlockUser(user.getId());
            }
        }

        // 4. 验证密码
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            handleLoginFailure(user, username, request.getIpAddress());
            throw new AuthenticationException("用户名或密码错误");
        }

        // 5. 登录成功
        handleLoginSuccess(user, request.getIpAddress());

        // 6. 生成Token
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getUsername());

        // 7. 保存Refresh Token哈希
        String refreshTokenHash = passwordEncoder.encode(refreshToken);
        userMapper.updateRefreshToken(user.getId(), refreshTokenHash,
                LocalDateTime.now().plusDays(7)); // 7天

        log.info("用户登录成功: userId={}, username={}", user.getId(), username);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getAccessTokenExpiration())
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .build();
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        String username = request.getUsername();
        String password = request.getPassword();

        log.info("用户尝试注册: {}", username);

        // 1. 检查用户名是否已存在
        if (userMapper.findByUsername(username) != null) {
            throw new BusinessException("用户名已存在");
        }

        // 2. 检查邮箱是否已存在（如果提供了）
        if (request.getEmail() != null && userMapper.findByEmail(request.getEmail()) != null) {
            throw new BusinessException("邮箱已被使用");
        }

        // 3. 密码强度校验
        if (password.length() < 6) {
            throw new BusinessException("密码长度不能少于6个字符");
        }

        // 4. 创建用户
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(request.getDisplayName() != null ? request.getDisplayName() : username);
        user.setEmail(request.getEmail());
        user.setIsActive(true);
        user.setIsLocked(false);
        user.setFailedLoginAttempts(0);

        userMapper.insert(user);

        log.info("用户注册成功: userId={}, username={}", user.getId(), username);
    }

    @Override
    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        try {
            // 1. 验证Refresh Token格式
            Long userId = jwtUtil.getUserIdFromToken(refreshToken);
            String username = jwtUtil.getUsernameFromToken(refreshToken);

            // 2. 查询用户
            User user = userMapper.selectById(userId);
            if (user == null || !user.getIsActive()) {
                throw new AuthenticationException("无效的Refresh Token");
            }

            // 3. 检查Refresh Token是否过期
            if (user.getRefreshTokenExpiresAt() != null &&
                user.getRefreshTokenExpiresAt().isBefore(LocalDateTime.now())) {
                throw new AuthenticationException("Refresh Token已过期");
            }

            // 4. 生成新的Access Token
            String newAccessToken = jwtUtil.generateAccessToken(userId, username);

            log.info("Token刷新成功: userId={}, username={}", userId, username);

            return LoginResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(refreshToken) // Refresh Token保持不变
                    .tokenType("Bearer")
                    .expiresIn(jwtUtil.getAccessTokenExpiration())
                    .userId(userId)
                    .username(username)
                    .displayName(user.getDisplayName())
                    .build();

        } catch (Exception e) {
            log.error("Token刷新失败", e);
            throw new AuthenticationException("Token刷新失败");
        }
    }

    @Override
    @Transactional
    public void logout(Long userId) {
        if (userId != null) {
            // 清除指定用户的Refresh Token
            userMapper.clearRefreshToken(userId);
            log.info("用户登出: userId={}", userId);
        } else {
            // 如果没有用户ID，执行全局清理操作
            log.info("执行全局登出清理操作");
            // 这里可以添加其他全局清理逻辑，比如清理过期token等
        }
    }

    /**
     * 处理登录失败
     */
    private void handleLoginFailure(User user, String username, String ipAddress) {
        int failedAttempts = user.getFailedLoginAttempts() + 1;
        userMapper.incrementFailedAttempts(user.getId());

        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            // 锁定账户
            LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES);
            userMapper.lockUser(user.getId(), lockUntil);
            recordLoginFailure(user.getId(), username, "密码错误，账户已锁定", ipAddress);
            log.warn("用户账户已锁定: userId={}, username={}", user.getId(), username);
        } else {
            recordLoginFailure(user.getId(), username, "密码错误", ipAddress);
        }
    }

    /**
     * 处理登录成功
     */
    private void handleLoginSuccess(User user, String ipAddress) {
        // 重置失败次数
        userMapper.resetFailedAttempts(user.getId());

        // 更新最后登录时间和IP
        userMapper.updateLastLogin(user.getId(), ipAddress);

        // 记录登录日志
        recordLoginSuccess(user.getId(), user.getUsername(), ipAddress);
    }

    /**
     * 记录登录成功日志
     */
    private void recordLoginSuccess(Long userId, String username, String ipAddress) {
        LoginLog log = new LoginLog();
        log.setUserId(userId);
        log.setUsername(username);
        log.setLoginResult(LoginLog.LoginResult.SUCCESS);
        log.setIpAddress(ipAddress);
        loginLogMapper.insert(log);
    }

    /**
     * 记录登录失败日志
     */
    private void recordLoginFailure(Long userId, String username, String reason, String ipAddress) {
        LoginLog log = new LoginLog();
        log.setUserId(userId);
        log.setUsername(username);
        log.setLoginResult(LoginLog.LoginResult.FAILED);
        log.setFailureReason(reason);
        log.setIpAddress(ipAddress);
        loginLogMapper.insert(log);
    }
}
