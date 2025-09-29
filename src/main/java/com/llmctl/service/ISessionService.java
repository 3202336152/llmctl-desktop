package com.llmctl.service;

import com.llmctl.dto.SessionDTO;
import com.llmctl.dto.StartSessionRequest;

import java.util.List;

/**
 * Session服务接口
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
     * 启动新的CLI会话
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
     * 终止会话
     *
     * @param sessionId 会话ID
     * @throws IllegalArgumentException 如果会话不存在
     */
    void terminateSession(String sessionId);

    /**
     * 更新会话最后活动时间
     *
     * @param sessionId 会话ID
     */
    void updateLastActivity(String sessionId);

    /**
     * 获取会话统计信息
     *
     * @return 会话统计信息
     */
    SessionStatistics getSessionStatistics();

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