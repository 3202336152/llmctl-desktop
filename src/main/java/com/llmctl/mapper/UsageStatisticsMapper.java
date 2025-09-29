package com.llmctl.mapper;

import com.llmctl.entity.UsageStatistics;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * 使用统计数据访问接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Mapper
public interface UsageStatisticsMapper {

    /**
     * 根据ID查询使用统计
     */
    UsageStatistics findById(@Param("id") Long id);

    /**
     * 根据Provider ID和日期查询统计
     */
    List<UsageStatistics> findByProviderIdAndDate(@Param("providerId") String providerId, @Param("date") LocalDate date);

    /**
     * 根据日期范围查询统计
     */
    List<UsageStatistics> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 获取每日统计汇总
     */
    List<UsageStatistics> getDailySummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 获取Provider统计汇总
     */
    List<UsageStatistics> getProviderSummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 插入或更新统计记录
     */
    int insertOrUpdate(UsageStatistics statistics);

    /**
     * 插入统计记录
     */
    int insert(UsageStatistics statistics);

    /**
     * 更新统计记录
     */
    int update(UsageStatistics statistics);

    /**
     * 删除指定日期之前的统计记录
     */
    int deleteBefore(@Param("beforeDate") LocalDate beforeDate);

    /**
     * 根据Provider ID删除统计记录
     */
    int deleteByProviderId(@Param("providerId") String providerId);

    /**
     * 根据Token ID删除统计记录
     */
    int deleteByTokenId(@Param("tokenId") String tokenId);

    /**
     * 统计总请求数
     */
    long getTotalRequests(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 统计总成功数
     */
    long getTotalSuccesses(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 统计总Token消耗
     */
    long getTotalTokensUsed(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}