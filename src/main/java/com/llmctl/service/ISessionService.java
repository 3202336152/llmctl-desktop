package com.llmctl.service;

import com.llmctl.dto.SessionDTO;
import com.llmctl.dto.StartSessionRequest;

import java.util.List;
import java.util.Map;

/**
 * Session服务接口
 *
 * 职责：管理会话元数据（记录、查询、更新）
 * 注意：进程管理由Electron层负责
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public interface ISessionService {

    /**
     * 获取所有活跃会话
     *
     * @return 活跃会话列表
     */
    List<SessionDTO> getActiveSessions();

    /**
     * 获取所有会话
     *
     * @return 会话列表
     */
    List<SessionDTO> getAllSessions();

    /**
     * 根据ID获取会话详情
     *
     * @param sessionId 会话ID
     * @return 会话详情
     * @throws IllegalArgumentException 如果会话不存在
     */
    SessionDTO getSessionById(String sessionId);

    /**
     * 启动新的CLI会话（仅创建元数据记录）
     *
     * @param request 启动会话请求
     * @return 创建的会话
     * @throws IllegalArgumentException 如果Provider不存在或Token不可用
     */
    SessionDTO startSession(StartSessionRequest request);

    /**
     * 更新会话状态
     *
     * @param sessionId 会话ID
     * @param status 新状态
     * @return 更新后的会话
     * @throws IllegalArgumentException 如果会话不存在
     */
    SessionDTO updateSessionStatus(String sessionId, String status);

    /**
     * 终止会话（仅更新元数据）
     *
     * @param sessionId 会话ID
     * @throws IllegalArgumentException 如果会话不存在
     */
    void terminateSession(String sessionId);

    /**
     * 重新激活会话（将inactive状态改为active）
     *
     * @param sessionId 会话ID
     * @return 重新激活后的会话
     * @throws IllegalArgumentException 如果会话不存在或状态不是inactive
     */
    SessionDTO reactivateSession(String sessionId);

    /**
     * 删除会话记录（从数据库中永久删除）
     *
     * @param sessionId 会话ID
     * @throws IllegalArgumentException 如果会话不存在
     */
    void deleteSession(String sessionId);

    /**
     * 更新会话最后活动时间
     *
     * @param sessionId 会话ID
     */
    void updateLastActivity(String sessionId);


    /**
     * 获取会话的环境变量（用于Electron终端）
     *
     * @param sessionId 会话ID
     * @return 环境变量Map
     * @throws IllegalArgumentException 如果会话不存在
     */
    Map<String, String> getSessionEnvironmentVariables(String sessionId);

    /**
     * Electron应用退出时调用：将所有活跃会话设置为非活跃状态
     * 原因：Electron应用关闭后，所有终端进程已全部终止
     *
     * @return 影响的行数
     */
    int deactivateAllActiveSessions();

    /**
     * 用户登出时调用：将指定用户的所有活跃会话设置为非活跃状态
     * 原因：用户登出后,其会话应被清理，避免资源泄漏和状态混乱
     *
     * @param userId 用户ID
     * @return 影响的行数
     */
    int deactivateUserActiveSessions(Long userId);

    /**
     * 批量删除当前用户的所有非活跃会话（一键清除功能）
     * 原因：清理冗余的非活跃会话记录，释放存储空间
     *
     * @param userId 用户ID
     * @return 删除的会话数量
     */
    int deleteInactiveSessions(Long userId);

    /**
     * 会话统计信息
     */
    class SessionStatistics {
        private long activeCount;
        private long inactiveCount;
        private long terminatedCount;
        private long totalCount;

        // Getters and Setters
        public long getActiveCount() { return activeCount; }
        public void setActiveCount(long activeCount) { this.activeCount = activeCount; }

        public long getInactiveCount() { return inactiveCount; }
        public void setInactiveCount(long inactiveCount) { this.inactiveCount = inactiveCount; }

        public long getTerminatedCount() { return terminatedCount; }
        public void setTerminatedCount(long terminatedCount) { this.terminatedCount = terminatedCount; }

        public long getTotalCount() { return totalCount; }
        public void setTotalCount(long totalCount) { this.totalCount = totalCount; }
    }
}