package com.llmctl.mapper;

import com.llmctl.dto.ProviderUsageStatDTO;
import com.llmctl.dto.SessionDurationTrendDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 统计数据Mapper
 * 用于查询会话时长趋势和Provider使用统计
 */
@Mapper
public interface StatisticsMapper {

    /**
     * 查询会话时长趋势（最近N天）
     *
     * @param userId 用户ID
     * @param days   天数
     * @return 每日会话时长趋势列表
     */
    List<SessionDurationTrendDTO> getSessionDurationTrend(@Param("userId") Long userId, @Param("days") Integer days);

    /**
     * 查询Provider使用统计（最近N天）
     *
     * @param userId 用户ID
     * @param days   天数（传null表示全部）
     * @return Provider使用统计列表
     */
    List<ProviderUsageStatDTO> getProviderUsageStats(@Param("userId") Long userId, @Param("days") Integer days);
}
