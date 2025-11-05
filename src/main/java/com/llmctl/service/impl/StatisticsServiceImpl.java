package com.llmctl.service.impl;

import com.llmctl.dto.ProviderUsageStatDTO;
import com.llmctl.dto.SessionDurationTrendDTO;
import com.llmctl.mapper.StatisticsMapper;
import com.llmctl.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 统计服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final StatisticsMapper statisticsMapper;

    @Override
    public List<SessionDurationTrendDTO> getSessionDurationTrend(Long userId, Integer days) {
        log.info("[统计] 查询会话时长趋势, userId={}, days={}", userId, days);
        return statisticsMapper.getSessionDurationTrend(userId, days);
    }

    @Override
    public List<ProviderUsageStatDTO> getProviderUsageStats(Long userId, Integer days) {
        log.info("[统计] 查询Provider使用统计, userId={}, days={}", userId, days);
        return statisticsMapper.getProviderUsageStats(userId, days);
    }
}
