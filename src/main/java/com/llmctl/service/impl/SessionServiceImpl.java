package com.llmctl.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.llmctl.context.UserContext;
import com.llmctl.dto.SessionDTO;
import com.llmctl.dto.StartSessionRequest;
import com.llmctl.entity.Provider;
import com.llmctl.entity.ProviderConfig;
import com.llmctl.entity.Session;
import com.llmctl.entity.Token;
import com.llmctl.exception.BusinessException;
import com.llmctl.exception.ResourceNotFoundException;
import com.llmctl.exception.ServiceException;
import com.llmctl.mapper.ProviderConfigMapper;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.SessionMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.IGlobalConfigService;
import com.llmctl.service.ISessionService;
import com.llmctl.service.ITokenEncryptionService;
import com.llmctl.service.McpServerService;
import com.llmctl.service.TokenService;
import com.llmctl.utils.IdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    private final ProviderConfigMapper providerConfigMapper;
    private final TokenMapper tokenMapper;
    private final TokenService tokenService;
    private final IGlobalConfigService globalConfigService;
    private final ITokenEncryptionService encryptionService;
    private final McpServerService mcpServerService;
    private final ObjectMapper objectMapper;

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
        Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        return convertToDTO(session);
    }

    @Override
    public SessionDTO startSession(StartSessionRequest request) {
        Long userId = UserContext.getUserId();
        log.info("创建新的会话记录: Provider: {}, WorkingDir: {}, 用户ID: {}", request.getProviderId(), request.getWorkingDirectory(), userId);

        // 检查Provider是否存在且属于当前用户（使用带配置的查询）
        Provider provider = providerMapper.findByIdWithConfigs(request.getProviderId(), userId);
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
        session.setType(request.getType()); // 设置CLI类型
        session.setStatus(Session.SessionStatus.ACTIVE);

        LocalDateTime now = LocalDateTime.now();
        session.setStartTime(now);
        session.setLastActivity(now);

        // 保存Session到数据库
        int result = sessionMapper.insert(session);
        if (result <= 0) {
            throw new ServiceException("创建会话", "数据库插入失败");
        }

        // 注入 MCP 配置
        if (provider != null) {
            try {
                injectMcpConfig(session, provider, request.getType());
            } catch (Exception e) {
                log.error("注入 MCP 配置失败，会话ID: {}", session.getId(), e);
                // MCP 配置注入失败不影响会话创建，记录错误后继续
            }
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
        Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
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
        Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
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
        Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
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

        Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
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
     * 批量删除当前用户的所有非活跃会话（一键清除功能）
     * 原因：清理冗余的非活跃会话记录，释放存储空间
     */
    @Override
    public int deleteInactiveSessions(Long userId) {
        log.info("一键清除非活跃会话，用户ID: {}", userId);
        int count = sessionMapper.deleteInactiveSessionsByUserId(userId);
        if (count > 0) {
            log.info("成功删除用户 {} 的 {} 个非活跃会话", userId, count);
        } else {
            log.info("用户 {} 无非活跃会话需要清除", userId);
        }
        return count;
    }

    /**
     * 刷新会话的 MCP 配置
     * 重新生成并写入 .mcp.json 配置文件，但不重启 CLI 进程
     *
     * @param sessionId 会话ID
     */
    @Override
    public void refreshMcpConfig(String sessionId) {
        Long userId = UserContext.getUserId();
        log.info("刷新会话 MCP 配置: {}, 用户ID: {}", sessionId, userId);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        // 验证会话关联的Provider是否属于当前用户
        Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        // 重新注入 MCP 配置
        try {
            injectMcpConfig(session, provider, session.getType());
            log.info("成功刷新会话 {} 的 MCP 配置", sessionId);
        } catch (Exception e) {
            log.error("刷新 MCP 配置失败，会话ID: {}", sessionId, e);
            throw new RuntimeException("刷新 MCP 配置失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取会话的 MCP 配置内容（供前端写入文件）
     * 新增方法：解决跨平台文件路径问题，由前端负责写入本地文件
     *
     * @param sessionId 会话ID
     * @return MCP 配置内容（包含 mcpServers 配置的完整 JSON 对象）
     */
    @Override
    public Map<String, Object> getMcpConfigContent(String sessionId) {
        Long userId = UserContext.getUserId();
        log.info("获取会话 MCP 配置内容: {}, 用户ID: {}", sessionId, userId);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        // 验证会话关联的Provider是否属于当前用户
        Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该会话");
        }

        // 生成 MCP 配置
        Map<String, Object> mcpConfig = mcpServerService.generateMcpConfig(
            provider.getId(),
            session.getType()
        );

        // 构建完整的配置对象（与文件格式一致）
        Map<String, Object> fullConfig = new HashMap<>();
        fullConfig.put("mcpServers", mcpConfig);

        log.info("成功生成会话 {} 的 MCP 配置内容，包含 {} 个服务器", sessionId, mcpConfig.size());
        return fullConfig;
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

        // 验证会话关联的Provider是否属于当前用户
        Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
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

        return buildEnvironmentVariables(provider, selectedToken, session.getWorkingDirectory(), sessionId);
    }

    /**
     * 构建环境变量（用于启动进程）
     * 说明：由于一个Provider可以支持多个CLI类型，需要为所有支持的类型设置对应的环境变量
     *
     * @param provider Provider对象
     * @param selectedToken 选中的Token
     * @param workingDirectory 工作目录路径
     * @param sessionId 会话ID（用于创建独立的配置目录）
     * @return 环境变量Map
     */
    private Map<String, String> buildEnvironmentVariables(Provider provider, Token selectedToken, String workingDirectory, String sessionId) {
        Map<String, String> envVars = new HashMap<>();

        // 解密Token值
        String tokenValue = encryptionService.decrypt(selectedToken.getValue());

        log.debug("为Provider {} 构建环境变量，Token ID: {}, 支持的类型: {}",
                  provider.getId(), selectedToken.getId(), provider.getTypes());

        // ✅ Windows 编码设置：强制使用 UTF-8 避免终端乱码
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            envVars.put("CHCP", "65001"); // UTF-8 code page
            log.debug("检测到 Windows 系统，已添加 UTF-8 编码设置 (CHCP=65001)");
        }

        // 为所有支持的CLI类型设置环境变量
        for (String type : provider.getTypes()) {
            // 查找对应的配置
            ProviderConfig config = findConfigByType(provider, type);
            if (config == null) {
                log.warn("Provider {} 的类型 {} 没有配置数据，跳过环境变量设置", provider.getId(), type);
                continue;
            }

            Map<String, Object> configData = parseConfigData(config.getConfigData());

            switch (type.toLowerCase()) {
                case "claude code":
                    envVars.put("ANTHROPIC_AUTH_TOKEN", tokenValue);
                    if (configData.get("baseUrl") != null) {
                        envVars.put("ANTHROPIC_BASE_URL", configData.get("baseUrl").toString());
                    }
                    if (configData.get("modelName") != null) {
                        envVars.put("ANTHROPIC_MODEL", configData.get("modelName").toString());
                    }
                    if (configData.get("maxTokens") != null) {
                        envVars.put("CLAUDE_CODE_MAX_OUTPUT_TOKENS", configData.get("maxTokens").toString());
                    }
                    break;

                case "codex":
                    // ✅ 使用会话独立的配置目录，避免多个会话相互覆盖
                    // 目录结构: 工作目录/.codex-sessions/{sessionId}/
                    String codexHome = workingDirectory + "/.codex-sessions/" + sessionId;
                    envVars.put("CODEX_HOME", codexHome);
                    log.debug("设置 CODEX_HOME 环境变量: {} (会话: {})", codexHome, sessionId);

                    // 前端 Electron 会直接从数据库读取配置并创建文件
                    // 只传递必要的配置数据供前端使用
                    if (configData.get("configToml") != null) {
                        envVars.put("CODEX_CONFIG_TOML", configData.get("configToml").toString());
                    }
                    if (configData.get("authJson") != null) {
                        envVars.put("CODEX_AUTH_JSON", configData.get("authJson").toString());
                    }
                    // Token 传递给前端用于替换 auth.json 中的占位符
                    envVars.put("CODEX_API_KEY", tokenValue);
                    break;

                case "gemini":
                    envVars.put("GOOGLE_API_KEY", tokenValue);
                    if (configData.get("baseUrl") != null) {
                        envVars.put("GOOGLE_BASE_URL", configData.get("baseUrl").toString());
                    }
                    if (configData.get("modelName") != null) {
                        envVars.put("GEMINI_MODEL", configData.get("modelName").toString());
                    }
                    if (configData.get("maxTokens") != null) {
                        envVars.put("GEMINI_MAX_TOKENS", configData.get("maxTokens").toString());
                    }
                    if (configData.get("temperature") != null) {
                        envVars.put("GEMINI_TEMPERATURE", configData.get("temperature").toString());
                    }
                    break;

                case "qoder":
                    envVars.put("QODER_API_KEY", tokenValue);
                    if (configData.get("baseUrl") != null) {
                        envVars.put("QODER_BASE_URL", configData.get("baseUrl").toString());
                    }
                    if (configData.get("modelName") != null) {
                        envVars.put("QODER_MODEL", configData.get("modelName").toString());
                    }
                    if (configData.get("maxTokens") != null) {
                        envVars.put("QODER_MAX_TOKENS", configData.get("maxTokens").toString());
                    }
                    if (configData.get("temperature") != null) {
                        envVars.put("QODER_TEMPERATURE", configData.get("temperature").toString());
                    }
                    break;

                default:
                    log.warn("未知的Provider类型: {}", type);
            }
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
        dto.setType(session.getType()); // 映射type字段
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
            Provider provider = providerMapper.findByIdWithConfigs(session.getProviderId(), userId);
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
        dto.setType(session.getType()); // 映射type字段
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

    /**
     * 从Provider的configs中查找指定类型的配置
     *
     * @param provider Provider对象
     * @param type CLI类型名称
     * @return ProviderConfig对象，如果找不到则返回null
     */
    private ProviderConfig findConfigByType(Provider provider, String type) {
        if (provider.getConfigs() == null || provider.getConfigs().isEmpty()) {
            // 如果 Provider 对象中没有加载 configs，尝试从数据库查询
            List<ProviderConfig> configs = providerConfigMapper.selectByProviderId(provider.getId());
            if (configs == null || configs.isEmpty()) {
                return null;
            }
            provider.setConfigs(configs);
        }

        // 根据类型名称查找对应的配置
        // 注意：不再去掉空格，因为数据库中的枚举值可能包含空格
        return provider.getConfigs().stream()
                .filter(config -> {
                    String configType = config.getCliType().getValue();
                    return configType.equalsIgnoreCase(type);
                })
                .findFirst()
                .orElse(null);
    }

    /**
     * 注入 MCP 配置到会话工作目录
     *
     * @param session 会话对象
     * @param provider Provider对象
     * @param cliType CLI类型
     */
    private void injectMcpConfig(Session session, Provider provider, String cliType) {
        log.info("开始注入 MCP 配置，Provider: {}, CLI类型: {}", provider.getName(), cliType);

        String workingDir = session.getWorkingDirectory();

        // ✅ 跨平台路径检测：如果是 Windows 路径但运行在非 Windows 系统，跳过文件写入
        // 由前端 Electron 负责写入本地文件
        if (isWindowsPath(workingDir) && !isRunningOnWindows()) {
            log.info("🔄 检测到跨平台场景（Windows 路径但运行在非 Windows 系统），跳过后端文件写入，由前端处理");
            log.info("💡 前端应调用 GET /sessions/{sessionId}/mcp-config 获取配置内容并写入本地文件");
            return;
        }

        // 生成 MCP 配置
        Map<String, Object> mcpConfig = mcpServerService.generateMcpConfig(
            provider.getId(),
            cliType
        );

        if (mcpConfig.isEmpty()) {
            log.info("无需注入 MCP 配置（无关联的服务器）");
            return;
        }

        // 根据不同 CLI 类型进行配置注入
        if ("claude code".equalsIgnoreCase(cliType)) {
            injectClaudeCodeMcpConfig(workingDir, mcpConfig);
        } else if ("codex".equalsIgnoreCase(cliType)) {
            injectCodexMcpConfig(workingDir, mcpConfig);
        } else if ("gemini".equalsIgnoreCase(cliType)) {
            injectGeminiMcpConfig(workingDir, mcpConfig);
        } else if ("qoder".equalsIgnoreCase(cliType)) {
            injectQoderMcpConfig(workingDir, mcpConfig);
        } else {
            log.warn("不支持的 CLI 类型: {}, 跳过 MCP 配置注入", cliType);
        }
    }

    /**
     * 检测是否为 Windows 路径
     * Windows 路径特征：以盘符开头，如 C:\、D:\ 等
     *
     * @param path 路径
     * @return 是否为 Windows 路径
     */
    private boolean isWindowsPath(String path) {
        if (path == null || path.isEmpty()) {
            return false;
        }
        // 匹配 Windows 绝对路径：X:\ 或 X:/
        return path.matches("^[A-Za-z]:[/\\\\].*");
    }

    /**
     * 检测当前系统是否为 Windows
     *
     * @return 是否为 Windows 系统
     */
    private boolean isRunningOnWindows() {
        String os = System.getProperty("os.name");
        return os != null && os.toLowerCase().contains("windows");
    }

    /**
     * 注入 Claude Code MCP 配置
     * 创建 .mcp.json 文件并写入 MCP 服务器配置（项目级配置）
     *
     * @param workingDir 工作目录
     * @param mcpConfig MCP 配置
     */
    private void injectClaudeCodeMcpConfig(String workingDir, Map<String, Object> mcpConfig) {
        try {
            // ✅ 修复：使用 .mcp.json（项目级配置）而不是 .claude/config.json
            Path configPath = Paths.get(workingDir, ".mcp.json");

            // ✅ 修复：确保父目录存在
            Files.createDirectories(configPath.getParent());

            // 读取现有配置（如果存在）
            Map<String, Object> existingConfig = new HashMap<>();
            if (Files.exists(configPath)) {
                String content = Files.readString(configPath);
                existingConfig = objectMapper.readValue(content, new TypeReference<>() {});
            }

            // 添加 MCP 服务器配置
            existingConfig.put("mcpServers", mcpConfig);

            // 写入配置文件
            String configJson = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(existingConfig);
            Files.writeString(configPath, configJson);

            log.info("Claude Code MCP 配置注入成功: {} ({} 个服务器)",
                configPath, mcpConfig.size());
        } catch (Exception e) {
            log.error("Claude Code MCP 配置注入失败", e);
            throw new RuntimeException("MCP 配置注入失败", e);
        }
    }

    /**
     * 注入 Codex MCP 配置
     * 创建 .codex/mcp.json 文件用于 MCP 服务器配置
     *
     * @param workingDir 工作目录
     * @param mcpConfig MCP 配置
     */
    private void injectCodexMcpConfig(String workingDir, Map<String, Object> mcpConfig) {
        try {
            Path configPath = Paths.get(workingDir, ".codex", "mcp.json");
            Files.createDirectories(configPath.getParent());

            // 写入 MCP 配置文件
            String configJson = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(mcpConfig);
            Files.writeString(configPath, configJson);

            log.info("Codex MCP 配置注入成功: {} ({} 个服务器)",
                configPath, mcpConfig.size());
        } catch (Exception e) {
            log.error("Codex MCP 配置注入失败", e);
            throw new RuntimeException("MCP 配置注入失败", e);
        }
    }

    /**
     * 注入 Gemini MCP 配置
     * 创建 .gemini/mcp.json 文件用于 MCP 服务器配置
     *
     * @param workingDir 工作目录
     * @param mcpConfig MCP 配置
     */
    private void injectGeminiMcpConfig(String workingDir, Map<String, Object> mcpConfig) {
        try {
            Path configPath = Paths.get(workingDir, ".gemini", "mcp.json");
            Files.createDirectories(configPath.getParent());

            // 写入 MCP 配置文件
            String configJson = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(mcpConfig);
            Files.writeString(configPath, configJson);

            log.info("Gemini MCP 配置注入成功: {} ({} 个服务器)",
                configPath, mcpConfig.size());
        } catch (Exception e) {
            log.error("Gemini MCP 配置注入失败", e);
            throw new RuntimeException("MCP 配置注入失败", e);
        }
    }

    /**
     * 注入 Qoder MCP 配置
     * 创建 .qoder/mcp.json 文件用于 MCP 服务器配置
     *
     * @param workingDir 工作目录
     * @param mcpConfig MCP 配置
     */
    private void injectQoderMcpConfig(String workingDir, Map<String, Object> mcpConfig) {
        try {
            Path configPath = Paths.get(workingDir, ".qoder", "mcp.json");
            Files.createDirectories(configPath.getParent());

            // 写入 MCP 配置文件
            String configJson = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(mcpConfig);
            Files.writeString(configPath, configJson);

            log.info("Qoder MCP 配置注入成功: {} ({} 个服务器)",
                configPath, mcpConfig.size());
        } catch (Exception e) {
            log.error("Qoder MCP 配置注入失败", e);
            throw new RuntimeException("MCP 配置注入失败", e);
        }
    }

    /**
     * 解析配置数据JSON字符串为Map
     *
     * @param configDataJson JSON字符串
     * @return 配置数据Map
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseConfigData(String configDataJson) {
        if (configDataJson == null || configDataJson.trim().isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(configDataJson, Map.class);
        } catch (Exception e) {
            log.error("解析配置数据失败: {}", configDataJson, e);
            return new HashMap<>();
        }
    }
}