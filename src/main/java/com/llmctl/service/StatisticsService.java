package com.llmctl.service;

import com.llmctl.dto.ProviderUsageStatDTO;
import com.llmctl.dto.SessionDurationTrendDTO;

import java.util.List;

/**
 * 统计服务接口
 */
public interface StatisticsService {

    /**
     * 查询会话时长趋势（最近N天）
     *
     * @param userId 用户ID
     * @param days   天数
     * @return 每日会话时长趋势列表
     */
    List<SessionDurationTrendDTO> getSessionDurationTrend(Long userId, Integer days);

    /**
     * 查询Provider使用统计（最近N天）
     *
     * @param userId 用户ID
     * @param days   天数（传null表示全部）
     * @return Provider使用统计列表
     */
    List<ProviderUsageStatDTO> getProviderUsageStats(Long userId, Integer days);
}
