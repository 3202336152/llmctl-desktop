package com.llmctl.mapper;

import com.llmctl.entity.UsageStatistics;
import org.apache.ibatis.annotations.*;

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
    @Select("SELECT * FROM usage_statistics WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "tokenId", column = "token_id"),
        @Result(property = "requestCount", column = "request_count"),
        @Result(property = "successCount", column = "success_count"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "totalTokens", column = "total_tokens"),
        @Result(property = "date", column = "date"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    UsageStatistics findById(@Param("id") Long id);

    /**
     * 根据Provider ID和日期查询统计
     */
    @Select("SELECT * FROM usage_statistics WHERE provider_id = #{providerId} AND date = #{date}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "tokenId", column = "token_id"),
        @Result(property = "requestCount", column = "request_count"),
        @Result(property = "successCount", column = "success_count"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "totalTokens", column = "total_tokens"),
        @Result(property = "date", column = "date"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<UsageStatistics> findByProviderIdAndDate(@Param("providerId") String providerId, @Param("date") LocalDate date);

    /**
     * 根据日期范围查询统计
     */
    @Select("SELECT * FROM usage_statistics WHERE date BETWEEN #{startDate} AND #{endDate} ORDER BY date DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "tokenId", column = "token_id"),
        @Result(property = "requestCount", column = "request_count"),
        @Result(property = "successCount", column = "success_count"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "totalTokens", column = "total_tokens"),
        @Result(property = "date", column = "date"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<UsageStatistics> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 获取每日统计汇总
     */
    @Select("SELECT date, " +
            "SUM(request_count) as request_count, " +
            "SUM(success_count) as success_count, " +
            "SUM(error_count) as error_count, " +
            "SUM(total_tokens) as total_tokens " +
            "FROM usage_statistics " +
            "WHERE date BETWEEN #{startDate} AND #{endDate} " +
            "GROUP BY date ORDER BY date DESC")
    @Results({
        @Result(property = "date", column = "date"),
        @Result(property = "requestCount", column = "request_count"),
        @Result(property = "successCount", column = "success_count"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "totalTokens", column = "total_tokens")
    })
    List<UsageStatistics> getDailySummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 获取Provider统计汇总
     */
    @Select("SELECT provider_id, " +
            "SUM(request_count) as request_count, " +
            "SUM(success_count) as success_count, " +
            "SUM(error_count) as error_count, " +
            "SUM(total_tokens) as total_tokens " +
            "FROM usage_statistics " +
            "WHERE date BETWEEN #{startDate} AND #{endDate} " +
            "GROUP BY provider_id ORDER BY request_count DESC")
    @Results({
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "requestCount", column = "request_count"),
        @Result(property = "successCount", column = "success_count"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "totalTokens", column = "total_tokens")
    })
    List<UsageStatistics> getProviderSummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 插入或更新统计记录
     */
    @Insert("INSERT INTO usage_statistics (provider_id, token_id, request_count, success_count, " +
            "error_count, total_tokens, date, created_at, updated_at) " +
            "VALUES (#{providerId}, #{tokenId}, #{requestCount}, #{successCount}, " +
            "#{errorCount}, #{totalTokens}, #{date}, #{createdAt}, #{updatedAt}) " +
            "ON DUPLICATE KEY UPDATE " +
            "request_count = request_count + VALUES(request_count), " +
            "success_count = success_count + VALUES(success_count), " +
            "error_count = error_count + VALUES(error_count), " +
            "total_tokens = total_tokens + VALUES(total_tokens), " +
            "updated_at = VALUES(updated_at)")
    int insertOrUpdate(UsageStatistics statistics);

    /**
     * 插入统计记录
     */
    @Insert("INSERT INTO usage_statistics (provider_id, token_id, request_count, success_count, " +
            "error_count, total_tokens, date, created_at, updated_at) " +
            "VALUES (#{providerId}, #{tokenId}, #{requestCount}, #{successCount}, " +
            "#{errorCount}, #{totalTokens}, #{date}, #{createdAt}, #{updatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(UsageStatistics statistics);

    /**
     * 更新统计记录
     */
    @Update("UPDATE usage_statistics SET " +
            "request_count = #{requestCount}, " +
            "success_count = #{successCount}, " +
            "error_count = #{errorCount}, " +
            "total_tokens = #{totalTokens}, " +
            "updated_at = #{updatedAt} " +
            "WHERE id = #{id}")
    int update(UsageStatistics statistics);

    /**
     * 删除指定日期之前的统计记录
     */
    @Delete("DELETE FROM usage_statistics WHERE date < #{beforeDate}")
    int deleteBefore(@Param("beforeDate") LocalDate beforeDate);

    /**
     * 根据Provider ID删除统计记录
     */
    @Delete("DELETE FROM usage_statistics WHERE provider_id = #{providerId}")
    int deleteByProviderId(@Param("providerId") String providerId);

    /**
     * 根据Token ID删除统计记录
     */
    @Delete("DELETE FROM usage_statistics WHERE token_id = #{tokenId}")
    int deleteByTokenId(@Param("tokenId") String tokenId);

    /**
     * 统计总请求数
     */
    @Select("SELECT COALESCE(SUM(request_count), 0) FROM usage_statistics " +
            "WHERE date BETWEEN #{startDate} AND #{endDate}")
    long getTotalRequests(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 统计总成功数
     */
    @Select("SELECT COALESCE(SUM(success_count), 0) FROM usage_statistics " +
            "WHERE date BETWEEN #{startDate} AND #{endDate}")
    long getTotalSuccesses(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 统计总Token消耗
     */
    @Select("SELECT COALESCE(SUM(total_tokens), 0) FROM usage_statistics " +
            "WHERE date BETWEEN #{startDate} AND #{endDate}")
    long getTotalTokensUsed(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}