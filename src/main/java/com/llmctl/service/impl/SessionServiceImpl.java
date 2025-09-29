package com.llmctl.service.impl;

import com.llmctl.dto.SessionDTO;
import com.llmctl.dto.StartSessionRequest;
import com.llmctl.entity.Provider;
import com.llmctl.entity.Session;
import com.llmctl.entity.Token;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.SessionMapper;
import com.llmctl.service.IGlobalConfigService;
import com.llmctl.service.ISessionService;
import com.llmctl.service.TokenService;
import com.llmctl.utils.IdGenerator;
import com.llmctl.exception.ResourceNotFoundException;
import com.llmctl.exception.ServiceException;
import com.llmctl.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Session业务服务实现类
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
    private final TokenService tokenService;
    private final IGlobalConfigService globalConfigService;

    /**
     * 存储活跃进程的引用
     */
    private final Map<String, Process> activeProcesses = new ConcurrentHashMap<>();

    @Override
    public List<SessionDTO> getActiveSessions() {
        log.debug("获取所有活跃会话");

        List<Session> sessions = sessionMapper.findActiveSessions();
        return sessions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<SessionDTO> getAllSessions() {
        log.debug("获取所有会话");

        List<Session> sessions = sessionMapper.findAll();
        return sessions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SessionDTO getSessionById(String sessionId) {
        log.debug("根据ID获取会话详情: {}", sessionId);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        return convertToDTO(session);
    }

    @Override
    @Transactional
    public SessionDTO startSession(StartSessionRequest request) {
        log.info("启动新的CLI会话: {} (Provider: {})", request.getCommand(), request.getProviderId());

        // 检查Provider是否存在
        Provider provider = providerMapper.findById(request.getProviderId());
        if (provider == null) {
            throw new ResourceNotFoundException("Provider", request.getProviderId());
        }

        // 选择可用的Token
        Token selectedToken = tokenService.selectToken(request.getProviderId());
        if (selectedToken == null) {
            throw new BusinessException("没有可用的Token: " + request.getProviderId());
        }

        // 构建环境变量
        Map<String, String> envVars = buildEnvironmentVariables(provider, selectedToken);

        // 验证工作目录
        File workingDir = new File(request.getWorkingDirectory());
        if (!workingDir.exists() || !workingDir.isDirectory()) {
            throw new BusinessException("工作目录不存在或不是有效目录: " + request.getWorkingDirectory());
        }

        // 创建Session实体
        Session session = new Session();
        session.setId(IdGenerator.generateSessionId());
        session.setProviderId(request.getProviderId());
        session.setWorkingDirectory(request.getWorkingDirectory());
        session.setCommand(request.getCommand());
        session.setStatus(Session.SessionStatus.ACTIVE);

        LocalDateTime now = LocalDateTime.now();
        session.setStartTime(now);
        session.setLastActivity(now);

        try {
            // 启动CLI进程
            ProcessBuilder processBuilder = new ProcessBuilder(request.getCommand().split("\\s+"));
            processBuilder.directory(workingDir);
            processBuilder.environment().putAll(envVars);

            Process process = processBuilder.start();
            session.setPid((int) process.pid());

            // 存储进程引用
            activeProcesses.put(session.getId(), process);

            // 保存Session到数据库
            int result = sessionMapper.insert(session);
            if (result <= 0) {
                // 如果数据库操作失败，需要清理进程
                process.destroyForcibly();
                activeProcesses.remove(session.getId());
                throw new ServiceException("创建会话", "数据库插入失败");
            }

            // 异步监控进程状态
            monitorProcessAsync(session.getId());

            log.info("成功启动CLI会话: {} (ID: {}, PID: {})", session.getCommand(), session.getId(), session.getPid());
            return convertToDTO(session);

        } catch (IOException e) {
            log.error("启动CLI进程失败: ", e);
            throw new ServiceException("启动CLI进程", e);
        }
    }

    @Override
    @Transactional
    public SessionDTO updateSessionStatus(String sessionId, String status) {
        log.info("更新会话状态: {} -> {}", sessionId, status);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        Session.SessionStatus newStatus = Session.SessionStatus.fromValue(status);
        session.setStatus(newStatus);
        session.setLastActivity(LocalDateTime.now());

        if (newStatus == Session.SessionStatus.TERMINATED) {
            session.setEndTime(LocalDateTime.now());
            // 终止关联的进程
            terminateProcess(sessionId);
        }

        int result = sessionMapper.update(session);
        if (result <= 0) {
            throw new ServiceException("更新会话状态", "数据库更新失败");
        }

        log.info("成功更新会话状态: {} -> {}", sessionId, status);
        return convertToDTO(session);
    }

    @Override
    @Transactional
    public void terminateSession(String sessionId) {
        log.info("终止会话: {}", sessionId);

        Session session = sessionMapper.findById(sessionId);
        if (session == null) {
            throw new ResourceNotFoundException("会话", sessionId);
        }

        // 终止进程
        terminateProcess(sessionId);

        // 更新数据库状态
        int result = sessionMapper.terminate(sessionId);
        if (result <= 0) {
            throw new ServiceException("终止会话", "数据库更新失败");
        }

        log.info("成功终止会话: {}", sessionId);
    }

    @Override
    public void updateLastActivity(String sessionId) {
        log.debug("更新会话最后活动时间: {}", sessionId);
        sessionMapper.updateLastActivity(sessionId);
    }

    @Override
    public SessionStatistics getSessionStatistics() {
        SessionStatistics statistics = new SessionStatistics();
        statistics.setActiveCount(sessionMapper.countByStatus("active"));
        statistics.setInactiveCount(sessionMapper.countByStatus("inactive"));
        statistics.setTerminatedCount(sessionMapper.countByStatus("terminated"));
        statistics.setTotalCount(sessionMapper.count());

        return statistics;
    }

    /**
     * 定时清理空闲会话
     */
    @Scheduled(fixedRate = 300000) // 每5分钟执行一次
    public void cleanupIdleSessions() {
        try {
            int idleTimeoutMinutes = getSessionIdleTimeout();
            List<Session> idleSessions = sessionMapper.findIdleTimeoutSessions(idleTimeoutMinutes);

            if (!idleSessions.isEmpty()) {
                log.info("发现{}个空闲超时会话，开始清理", idleSessions.size());

                for (Session session : idleSessions) {
                    try {
                        updateSessionStatus(session.getId(), "inactive");
                    } catch (Exception e) {
                        log.error("清理空闲会话失败: {}", session.getId(), e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("定时清理空闲会话失败: ", e);
        }
    }

    /**
     * 异步监控进程状态
     */
    @Async
    public void monitorProcessAsync(String sessionId) {
        Process process = activeProcesses.get(sessionId);
        if (process == null) {
            return;
        }

        try {
            // 等待进程结束
            int exitCode = process.waitFor();
            log.info("进程结束: {} (退出码: {})", sessionId, exitCode);

            // 更新会话状态
            updateSessionStatus(sessionId, "terminated");

        } catch (InterruptedException e) {
            log.warn("进程监控被中断: {}", sessionId);
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.error("进程监控异常: {}", sessionId, e);
        } finally {
            activeProcesses.remove(sessionId);
        }
    }

    /**
     * 构建环境变量
     */
    private Map<String, String> buildEnvironmentVariables(Provider provider, Token selectedToken) {
        Map<String, String> envVars = new HashMap<>();

        // 根据Provider类型设置相应的环境变量
        String tokenValue = selectedToken.getValue(); // 这里应该解密Token值

        switch (provider.getType().toLowerCase()) {
            case "anthropic":
                envVars.put("ANTHROPIC_API_KEY", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("ANTHROPIC_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("ANTHROPIC_MODEL", provider.getModelName());
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
                break;

            case "qwen":
                envVars.put("DASHSCOPE_API_KEY", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("DASHSCOPE_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("QWEN_MODEL", provider.getModelName());
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
                break;

            default:
                log.warn("未知的Provider类型: {}", provider.getType());
        }

        return envVars;
    }

    /**
     * 终止进程
     */
    private void terminateProcess(String sessionId) {
        Process process = activeProcesses.get(sessionId);
        if (process != null && process.isAlive()) {
            log.info("终止进程: {} (PID: {})", sessionId, process.pid());
            process.destroyForcibly();
            activeProcesses.remove(sessionId);
        }
    }

    /**
     * 获取会话空闲超时时间（分钟）
     */
    private int getSessionIdleTimeout() {
        try {
            String timeoutStr = globalConfigService.getConfigValue("max_session_idle_time", "3600");
            return Integer.parseInt(timeoutStr) / 60; // 转换为分钟
        } catch (Exception e) {
            log.warn("获取会话空闲超时时间失败，使用默认值: ", e);
            return 60; // 默认60分钟
        }
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
            Provider provider = providerMapper.findById(session.getProviderId());
            if (provider != null) {
                dto.setProviderName(provider.getName());
            }
        } catch (Exception e) {
            log.warn("获取Provider名称失败: {}", session.getProviderId(), e);
        }

        return dto;
    }
}