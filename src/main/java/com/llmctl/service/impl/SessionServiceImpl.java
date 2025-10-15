package com.llmctl.service.impl;

import com.llmctl.context.UserContext;
import com.llmctl.dto.SessionDTO;
import com.llmctl.dto.StartSessionRequest;
import com.llmctl.entity.Provider;
import com.llmctl.entity.Session;
import com.llmctl.entity.Token;
import com.llmctl.exception.BusinessException;
import com.llmctl.exception.ResourceNotFoundException;
import com.llmctl.exception.ServiceException;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.SessionMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.IGlobalConfigService;
import com.llmctl.service.ISessionService;
import com.llmctl.service.ITokenEncryptionService;
import com.llmctl.service.TokenService;
import com.llmctl.utils.IdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Session业务服务实现类
 *
 * 职责：管理会话元数据（记录、查询、更新）
 * 注意：进程管理由Electron层负责，本服务不再处理进程启动、I/O等操作
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements ISessionService {

    private final SessionMapper sessionMapper;
    private final ProviderMapper providerMapper;
    private final TokenMapper tokenMapper;
    private final TokenService tokenService;
    private final IGlobalConfigService globalConfigService;
    private final ITokenEncryptionService encryptionService;

    @Override
    public List<SessionDTO> getActiveSessions() {
        Long userId = UserContext.getUserId();
        log.debug("获取所有活跃会话, 用户ID: {}", userId);

        // 使用优化的JOIN查询，避免N+1查询问题
        List<Session> sessions = sessionMapper.findActiveSessionsByUserIdWithProvider(userId);
        return sessions.stream()
                .map(this::convertToDTOOptimized)
                .collect(Collectors.toList());
    }

    @Override
    public List<SessionDTO> getAllSessions() {
        Long userId = UserContext.getUserId();
        log.debug("获取所有会话, 用户ID: {}", userId);

        // 使用优化的JOIN查询，避免N+1查询问题
        List<Session> sessions = sessionMapper.findAllByUserIdWithProvider(userId);
        return sessions.stream()
                .map(this::convertToDTOOptimized)
                .collect(Collectors.toList());
    }

    @Override
    public SessionDTO getSessionById(String sessionId) {
        Long userId = UserContext.getUserId();
        log.debug("根据ID获取会话详情: {}, 用户ID: {}", sessionId, userId);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        // 验证会话关联的Provider是否属于当前用户
        Provider provider = providerMapper.findById(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        return convertToDTO(session);
    }

    @Override
    public SessionDTO startSession(StartSessionRequest request) {
        Long userId = UserContext.getUserId();
        log.info("创建新的会话记录: Provider: {}, WorkingDir: {}, 用户ID: {}", request.getProviderId(), request.getWorkingDirectory(), userId);

        // 检查Provider是否存在且属于当前用户
        Provider provider = providerMapper.findById(request.getProviderId(), userId);
        if (provider == null) {
            throw new ResourceNotFoundException("Provider不存在或无权访问", request.getProviderId());
        }

        // 选择可用的Token并保存Token ID
        Token selectedToken = tokenService.selectToken(request.getProviderId());
        if (selectedToken == null) {
            throw new BusinessException("没有可用的Token: " + request.getProviderId());
        }

        // 更新Token的最后使用时间
        tokenMapper.updateLastUsed(selectedToken.getId());
        log.debug("更新Token[{}]的最后使用时间", selectedToken.getId());

        // 创建Session实体（仅记录元数据，进程由Electron管理）
        Session session = new Session();
        session.setId(IdGenerator.generateSessionId());
        session.setUserId(userId);
        session.setProviderId(request.getProviderId());
        session.setTokenId(selectedToken.getId()); // 保存选中的Token ID
        session.setWorkingDirectory(request.getWorkingDirectory());
        session.setCommand(request.getCommand());
        session.setStatus(Session.SessionStatus.ACTIVE);

        LocalDateTime now = LocalDateTime.now();
        session.setStartTime(now);
        session.setLastActivity(now);

        // 保存Session到数据库
        int result = sessionMapper.insert(session);
        if (result <= 0) {
            throw new ServiceException("创建会话", "数据库插入失败");
        }

        log.info("成功创建会话记录: {} (ID: {})", session.getCommand(), session.getId());
        return convertToDTO(session);
    }

    @Override
    public SessionDTO updateSessionStatus(String sessionId, String status) {
        Long userId = UserContext.getUserId();
        log.info("更新会话状态: {} -> {}, 用户ID: {}", sessionId, status, userId);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        // 验证会话关联的Provider是否属于当前用户
        Provider provider = providerMapper.findById(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        Session.SessionStatus newStatus = Session.SessionStatus.fromValue(status);
        session.setStatus(newStatus);
        session.setLastActivity(LocalDateTime.now());

        // 兼容废弃的TERMINATED状态（仅为向后兼容保留）
        if (newStatus == Session.SessionStatus.TERMINATED) {
            session.setEndTime(LocalDateTime.now());
        }

        int result = sessionMapper.update(session);
        if (result <= 0) {
            throw new ServiceException("更新会话状态", "数据库更新失败");
        }

        log.info("成功更新会话状态: {} -> {}", sessionId, status);
        return convertToDTO(session);
    }

    @Override
    public void terminateSession(String sessionId) {
        Long userId = UserContext.getUserId();
        log.info("终止会话: {}, 用户ID: {}", sessionId, userId);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        // 验证会话关联的Provider是否属于当前用户
        Provider provider = providerMapper.findById(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        // 更新数据库状态为inactive（进程由Electron管理和终止）
        int result = sessionMapper.terminate(sessionId);
        if (result <= 0) {
            throw new ServiceException("终止会话", "数据库更新失败");
        }

        log.info("成功终止会话: {}", sessionId);
    }

    @Override
    public SessionDTO reactivateSession(String sessionId) {
        Long userId = UserContext.getUserId();
        log.info("重新激活会话: {}, 用户ID: {}", sessionId, userId);

        // 使用优化的JOIN查询，同时获取Session和验证Provider权限
        Session session = sessionMapper.findByIdWithPermissionCheck(sessionId, userId);
        if (session == null) {
            // Session不存在或Provider无权访问
            throw new ResourceNotFoundException("会话不存在或无权访问", sessionId);
        }

        if (session.getStatus() != Session.SessionStatus.INACTIVE) {
            throw new BusinessException("只能重新激活非活跃状态的会话，当前状态: " + session.getStatus().getValue());
        }

        // 重新激活会话
        int result = sessionMapper.reactivate(sessionId);
        if (result <= 0) {
            throw new ServiceException("重新激活会话", "数据库更新失败");
        }

        // 重新查询更新后的会话（使用优化查询）
        Session reactivatedSession = sessionMapper.findByIdWithPermissionCheck(sessionId, userId);
        log.info("成功重新激活会话: {}", sessionId);

        return convertToDTOOptimized(reactivatedSession);
    }

    @Override
    public void deleteSession(String sessionId) {
        Long userId = UserContext.getUserId();
        log.info("删除会话记录: {}, 用户ID: {}", sessionId, userId);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        // 验证会话关联的Provider是否属于当前用户
        Provider provider = providerMapper.findById(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        // 从数据库中永久删除会话记录
        int result = sessionMapper.deleteById(sessionId);
        if (result <= 0) {
            throw new ServiceException("删除会话记录", "数据库删除失败");
        }

        log.info("成功删除会话记录: {}", sessionId);
    }

    @Override
    public void updateLastActivity(String sessionId) {
        Long userId = UserContext.getUserId();
        log.debug("更新会话最后活动时间: {}, 用户ID: {}", sessionId, userId);

        // 验证会话是否属于当前用户
        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        Provider provider = providerMapper.findById(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        sessionMapper.updateLastActivity(sessionId);
    }

    /**
     * Electron应用退出时调用：将所有活跃会话设置为非活跃状态
     * 原因：Electron应用关闭后，所有终端进程已全部终止
     */
    public int deactivateAllActiveSessions() {
        log.info("Electron应用退出，开始批量更新活跃会话状态...");
        int affectedRows = sessionMapper.deactivateAllActiveSessions();
        if (affectedRows > 0) {
            log.info("成功将 {} 个活跃会话设置为非活跃状态（Electron应用已退出）", affectedRows);
        } else {
            log.info("无需处理，当前没有活跃会话");
        }
        return affectedRows;
    }

    /**
     * 用户登出时调用：将指定用户的所有活跃会话设置为非活跃状态
     * 原因：用户登出后，其会话应被清理，避免资源泄漏和状态混乱
     */
    @Override
    public int deactivateUserActiveSessions(Long userId) {
        log.info("用户登出，开始批量更新用户活跃会话状态，用户ID: {}", userId);
        int affectedRows = sessionMapper.deactivateUserActiveSessions(userId);
        if (affectedRows > 0) {
            log.info("成功将用户 {} 的 {} 个活跃会话设置为非活跃状态（用户已登出）", userId, affectedRows);
        } else {
            log.info("用户 {} 无活跃会话需要处理", userId);
        }
        return affectedRows;
    }

    /**
     * 获取会话对应的环境变量（供Electron前端使用）
     *
     * @param sessionId 会话ID
     * @return 环境变量Map
     */
    public Map<String, String> getSessionEnvironmentVariables(String sessionId) {
        Long userId = UserContext.getUserId();

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        // 验证会话关联的Provider是否属于当前用户
        Provider provider = providerMapper.findById(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        // 直接使用保存的Token ID，避免重复选择
        if (session.getTokenId() == null) {
            throw new BusinessException("会话未关联Token: " + sessionId);
        }

        Token selectedToken = tokenMapper.findById(session.getTokenId());
        if (selectedToken == null) {
            throw new BusinessException("Token不存在: " + session.getTokenId());
        }

        return buildEnvironmentVariables(provider, selectedToken);
    }

    /**
     * 构建环境变量（用于启动进程）
     */
    private Map<String, String> buildEnvironmentVariables(Provider provider, Token selectedToken) {
        Map<String, String> envVars = new HashMap<>();

        // 解密Token值
        String tokenValue = encryptionService.decrypt(selectedToken.getValue());

        log.debug("为Provider {} 构建环境变量，Token ID: {}", provider.getId(), selectedToken.getId());

        // ✅ Windows 编码设置：强制使用 UTF-8 避免终端乱码
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            envVars.put("CHCP", "65001"); // UTF-8 code page
            log.debug("检测到 Windows 系统，已添加 UTF-8 编码设置 (CHCP=65001)");
        }

        switch (provider.getType().toLowerCase()) {
            case "anthropic":
                envVars.put("ANTHROPIC_AUTH_TOKEN", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("ANTHROPIC_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("ANTHROPIC_MODEL", provider.getModelName());
                }
                if (provider.getMaxTokens() != null) {
                    envVars.put("CLAUDE_CODE_MAX_OUTPUT_TOKENS", String.valueOf(provider.getMaxTokens()));
                }
                if (provider.getTemperature() != null) {
                    envVars.put("CLAUDE_CODE_TEMPERATURE", provider.getTemperature().toString());
                }
                break;

            case "openai":
                envVars.put("OPENAI_API_KEY", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("OPENAI_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("OPENAI_MODEL", provider.getModelName());
                }
                if (provider.getMaxTokens() != null) {
                    envVars.put("OPENAI_MAX_TOKENS", String.valueOf(provider.getMaxTokens()));
                }
                if (provider.getTemperature() != null) {
                    envVars.put("OPENAI_TEMPERATURE", provider.getTemperature().toString());
                }
                break;

            case "qwen":
                envVars.put("DASHSCOPE_API_KEY", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("DASHSCOPE_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("QWEN_MODEL", provider.getModelName());
                }
                if (provider.getMaxTokens() != null) {
                    envVars.put("QWEN_MAX_TOKENS", String.valueOf(provider.getMaxTokens()));
                }
                if (provider.getTemperature() != null) {
                    envVars.put("QWEN_TEMPERATURE", provider.getTemperature().toString());
                }
                break;

            case "gemini":
                envVars.put("GOOGLE_API_KEY", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("GOOGLE_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("GEMINI_MODEL", provider.getModelName());
                }
                if (provider.getMaxTokens() != null) {
                    envVars.put("GEMINI_MAX_TOKENS", String.valueOf(provider.getMaxTokens()));
                }
                if (provider.getTemperature() != null) {
                    envVars.put("GEMINI_TEMPERATURE", provider.getTemperature().toString());
                }
                break;

            default:
                log.warn("未知的Provider类型: {}", provider.getType());
        }

        return envVars;
    }

    /**
     * 将Session实体转换为DTO
     */
    private SessionDTO convertToDTO(Session session) {
        if (session == null) {
            return null;
        }

        SessionDTO dto = new SessionDTO();
        dto.setId(session.getId());
        dto.setProviderId(session.getProviderId());
        dto.setTokenId(session.getTokenId());
        dto.setPid(session.getPid());
        dto.setWorkingDirectory(session.getWorkingDirectory());
        dto.setCommand(session.getCommand());
        dto.setStatus(session.getStatus() != null ? session.getStatus().getValue() : null);
        dto.setStartTime(session.getStartTime());
        dto.setLastActivity(session.getLastActivity());
        dto.setEndTime(session.getEndTime());

        // 计算持续时间
        if (session.getStartTime() != null) {
            dto.setDurationMinutes(session.getDurationMinutes());
        }

        // 获取Provider名称
        try {
            Long userId = UserContext.getUserId();
            Provider provider = providerMapper.findById(session.getProviderId(), userId);
            if (provider != null) {
                dto.setProviderName(provider.getName());
            }
        } catch (Exception e) {
            log.warn("获取Provider名称失败: {}", session.getProviderId(), e);
        }

        return dto;
    }

    /**
     * 将Session实体转换为DTO（优化版本：使用已查询的providerName）
     * 用于JOIN查询结果，避免N+1查询问题
     */
    private SessionDTO convertToDTOOptimized(Session session) {
        if (session == null) {
            return null;
        }

        SessionDTO dto = new SessionDTO();
        dto.setId(session.getId());
        dto.setProviderId(session.getProviderId());
        dto.setTokenId(session.getTokenId());
        dto.setPid(session.getPid());
        dto.setWorkingDirectory(session.getWorkingDirectory());
        dto.setCommand(session.getCommand());
        dto.setStatus(session.getStatus() != null ? session.getStatus().getValue() : null);
        dto.setStartTime(session.getStartTime());
        dto.setLastActivity(session.getLastActivity());
        dto.setEndTime(session.getEndTime());

        // 计算持续时间
        if (session.getStartTime() != null) {
            dto.setDurationMinutes(session.getDurationMinutes());
        }

        // 直接使用JOIN查询时已获取的providerName，避免额外查询
        dto.setProviderName(session.getProviderName());

        return dto;
    }
}