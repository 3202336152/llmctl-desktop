package com.llmctl.service.impl;

import com.llmctl.dto.*;
import com.llmctl.entity.LoginLog;
import com.llmctl.entity.User;
import com.llmctl.exception.AuthenticationException;
import com.llmctl.exception.BusinessException;
import com.llmctl.mapper.LoginLogMapper;
import com.llmctl.mapper.UserMapper;
import com.llmctl.service.IAuthService;
import com.llmctl.service.IVerificationCodeService;
import com.llmctl.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

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
    private final IVerificationCodeService verificationCodeService;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${avatar.upload.path:/downloads/llmctl/images/avatar/}")
    private String avatarUploadPath;

    @Value("${avatar.base.url:http://117.72.200.2/downloads/llmctl/images/avatar/}")
    private String avatarBaseUrl;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 30;
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String usernameOrEmail = request.getUsername();
        String password = request.getPassword();

        log.info("用户尝试登录: {}", usernameOrEmail);

        // 1. 查询用户（支持用户名或邮箱登录）
        User user = findUserByUsernameOrEmail(usernameOrEmail);
        if (user == null) {
            recordLoginFailure(null, usernameOrEmail, "用户不存在", request.getIpAddress());
            throw new AuthenticationException("用户名或密码错误");
        }

        // 2. 检查账户状态
        if (!user.getIsActive()) {
            recordLoginFailure(user.getId(), usernameOrEmail, "账户未激活", request.getIpAddress());
            throw new AuthenticationException("账户未激活");
        }

        // 3. 检查账户是否被锁定
        if (user.getIsLocked()) {
            if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                long remainingMinutes = java.time.Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes();
                recordLoginFailure(user.getId(), usernameOrEmail, "账户已锁定", request.getIpAddress());
                throw new AuthenticationException("账户已锁定，请在 " + remainingMinutes + " 分钟后重试");
            } else {
                // 锁定时间已过，解锁账户
                userMapper.unlockUser(user.getId());
            }
        }

        // 4. 验证密码
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            handleLoginFailure(user, usernameOrEmail, request.getIpAddress());
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

        log.info("用户登录成功: userId={}, username={}", user.getId(), user.getUsername());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getAccessTokenExpiration())
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
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
                    .email(user.getEmail())
                    .avatarUrl(user.getAvatarUrl())
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

    /**
     * 根据用户名或邮箱查找用户
     * 支持同时使用用户名或邮箱登录
     *
     * @param usernameOrEmail 用户名或邮箱
     * @return User对象，如果不存在则返回null
     */
    private User findUserByUsernameOrEmail(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
            return null;
        }

        // 判断输入是否为邮箱格式（包含@符号）
        if (usernameOrEmail.contains("@")) {
            // 尝试通过邮箱查找
            User user = userMapper.findByEmail(usernameOrEmail);
            if (user != null) {
                log.debug("通过邮箱找到用户: {}", usernameOrEmail);
                return user;
            }
        }

        // 通过用户名查找
        User user = userMapper.findByUsername(usernameOrEmail);
        if (user != null) {
            log.debug("通过用户名找到用户: {}", usernameOrEmail);
        }
        return user;
    }

    @Override
    @Transactional
    public UserInfoDTO updateProfile(Long userId, UpdateProfileRequest request) {
        log.info("更新个人信息: userId={}", userId);

        // 1. 查询用户
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 2. 如果邮箱有变化，检查新邮箱是否已被使用
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            User existingUser = userMapper.findByEmail(request.getEmail());
            if (existingUser != null && !existingUser.getId().equals(userId)) {
                throw new BusinessException("邮箱已被其他用户使用");
            }
        }

        // 3. 更新用户信息
        user.setDisplayName(request.getDisplayName());
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        userMapper.update(user);

        log.info("个人信息更新成功: userId={}", userId);

        // 4. 返回更新后的用户信息
        return UserInfoDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .status(getUserStatus(user))
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        log.info("修改密码: userId={}, email={}", userId, request.getEmail());

        // 1. 查询用户
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        // 2. 验证用户是否绑定了邮箱
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new BusinessException("您尚未绑定邮箱，请先在个人信息中绑定邮箱后再修改密码");
        }

        // 3. 验证用户输入的邮箱是否与绑定的邮箱一致
        if (!user.getEmail().equals(request.getEmail())) {
            throw new BusinessException("输入的邮箱与账户绑定的邮箱不一致");
        }

        // 4. 验证邮箱验证码
        boolean codeValid = verificationCodeService.verifyCode(
                request.getEmail(),
                request.getVerificationCode(),
                "CHANGE_PASSWORD"
        );
        if (!codeValid) {
            throw new BusinessException("验证码无效或已过期");
        }

        // 5. 更新密码
        String newPasswordHash = passwordEncoder.encode(request.getNewPassword());
        userMapper.updatePassword(userId, newPasswordHash);

        // 6. 清除所有Refresh Token（强制重新登录）
        userMapper.clearRefreshToken(userId);

        log.info("密码修改成功: userId={}", userId);
    }

    @Override
    @Transactional
    public String uploadAvatar(Long userId, MultipartFile file) throws IOException {
        log.info("上传头像: userId={}, filename={}, size={}", userId, file.getOriginalFilename(), file.getSize());

        // 1. 验证文件是否为空
        if (file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }

        // 2. 验证文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("文件大小不能超过10MB");
        }

        // 3. 验证文件类型
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new BusinessException("无效的文件名");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new BusinessException("只支持图片格式：jpg, jpeg, png, gif, webp");
        }

        // 4. 生成唯一文件名：{timestamp}_{userId}.{extension}
        long timestamp = System.currentTimeMillis();
        String filename = timestamp + "_" + userId + "." + extension;

        // 5. 确保上传目录存在（使用绝对路径）
        // 如果是相对路径，转换为绝对路径
        File uploadDirFile = new File(avatarUploadPath);
        if (!uploadDirFile.isAbsolute()) {
            // 如果是相对路径，转换为项目根目录下的绝对路径
            uploadDirFile = new File(System.getProperty("user.dir"), avatarUploadPath);
        }

        if (!uploadDirFile.exists()) {
            boolean created = uploadDirFile.mkdirs();
            if (!created) {
                throw new BusinessException("无法创建上传目录: " + uploadDirFile.getAbsolutePath());
            }
            log.info("创建头像上传目录: {}", uploadDirFile.getAbsolutePath());
        }

        // 6. 保存文件（使用输入流方式，兼容性更好）
        File targetFile = new File(uploadDirFile, filename);
        try (var inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetFile.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        }
        log.info("头像文件已保存: {}", targetFile.getAbsolutePath());

        // 7. 生成访问URL
        String avatarUrl = avatarBaseUrl + filename;

        // 8. 更新数据库
        userMapper.updateAvatarUrl(userId, avatarUrl);

        log.info("头像上传成功: userId={}, url={}", userId, avatarUrl);
        return avatarUrl;
    }

    /**
     * 获取用户状态
     */
    private String getUserStatus(User user) {
        if (user.getIsLocked()) {
            return "LOCKED";
        } else if (!user.getIsActive()) {
            return "DISABLED";
        } else {
            return "ACTIVE";
        }
    }
}
