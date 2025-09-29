package com.llmctl.mapper;

import com.llmctl.entity.Token;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * Token数据访问接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Mapper
public interface TokenMapper {

    /**
     * 根据ID查询Token
     *
     * @param id Token ID
     * @return Token对象，如果不存在则返回null
     */
    @Select("SELECT * FROM tokens WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "value", column = "value"),
        @Result(property = "alias", column = "alias"),
        @Result(property = "weight", column = "weight"),
        @Result(property = "enabled", column = "enabled"),
        @Result(property = "healthy", column = "healthy"),
        @Result(property = "lastUsed", column = "last_used"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "lastErrorTime", column = "last_error_time"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    Token findById(@Param("id") String id);

    /**
     * 根据Provider ID查询Token列表
     *
     * @param providerId Provider ID
     * @return Token列表
     */
    @Select("SELECT * FROM tokens WHERE provider_id = #{providerId} ORDER BY weight DESC, created_at ASC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "value", column = "value"),
        @Result(property = "alias", column = "alias"),
        @Result(property = "weight", column = "weight"),
        @Result(property = "enabled", column = "enabled"),
        @Result(property = "healthy", column = "healthy"),
        @Result(property = "lastUsed", column = "last_used"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "lastErrorTime", column = "last_error_time"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<Token> findByProviderId(@Param("providerId") String providerId);

    /**
     * 根据Provider ID查询可用的Token列表（启用且健康）
     *
     * @param providerId Provider ID
     * @return 可用的Token列表
     */
    @Select("SELECT * FROM tokens WHERE provider_id = #{providerId} AND enabled = 1 AND healthy = 1 " +
            "ORDER BY weight DESC, last_used ASC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "value", column = "value"),
        @Result(property = "alias", column = "alias"),
        @Result(property = "weight", column = "weight"),
        @Result(property = "enabled", column = "enabled"),
        @Result(property = "healthy", column = "healthy"),
        @Result(property = "lastUsed", column = "last_used"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "lastErrorTime", column = "last_error_time"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<Token> findAvailableByProviderId(@Param("providerId") String providerId);

    /**
     * 查询所有Token
     *
     * @return Token列表
     */
    @Select("SELECT * FROM tokens ORDER BY provider_id, weight DESC, created_at ASC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "value", column = "value"),
        @Result(property = "alias", column = "alias"),
        @Result(property = "weight", column = "weight"),
        @Result(property = "enabled", column = "enabled"),
        @Result(property = "healthy", column = "healthy"),
        @Result(property = "lastUsed", column = "last_used"),
        @Result(property = "errorCount", column = "error_count"),
        @Result(property = "lastErrorTime", column = "last_error_time"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<Token> findAll();

    /**
     * 插入Token
     *
     * @param token Token对象
     * @return 影响的行数
     */
    @Insert("INSERT INTO tokens (id, provider_id, value, alias, weight, enabled, healthy, " +
            "last_used, error_count, last_error_time, created_at, updated_at) " +
            "VALUES (#{id}, #{providerId}, #{value}, #{alias}, #{weight}, #{enabled}, #{healthy}, " +
            "#{lastUsed}, #{errorCount}, #{lastErrorTime}, #{createdAt}, #{updatedAt})")
    int insert(Token token);

    /**
     * 更新Token
     *
     * @param token Token对象
     * @return 影响的行数
     */
    @Update("UPDATE tokens SET " +
            "value = #{value}, " +
            "alias = #{alias}, " +
            "weight = #{weight}, " +
            "enabled = #{enabled}, " +
            "healthy = #{healthy}, " +
            "last_used = #{lastUsed}, " +
            "error_count = #{errorCount}, " +
            "last_error_time = #{lastErrorTime}, " +
            "updated_at = #{updatedAt} " +
            "WHERE id = #{id}")
    int update(Token token);

    /**
     * 更新Token健康状态
     *
     * @param id Token ID
     * @param healthy 健康状态
     * @return 影响的行数
     */
    @Update("UPDATE tokens SET healthy = #{healthy}, updated_at = NOW() WHERE id = #{id}")
    int updateHealthStatus(@Param("id") String id, @Param("healthy") Boolean healthy);

    /**
     * 更新Token最后使用时间
     *
     * @param id Token ID
     * @return 影响的行数
     */
    @Update("UPDATE tokens SET last_used = NOW(), updated_at = NOW() WHERE id = #{id}")
    int updateLastUsed(@Param("id") String id);

    /**
     * 增加Token错误计数
     *
     * @param id Token ID
     * @return 影响的行数
     */
    @Update("UPDATE tokens SET " +
            "error_count = error_count + 1, " +
            "last_error_time = NOW(), " +
            "updated_at = NOW() " +
            "WHERE id = #{id}")
    int incrementErrorCount(@Param("id") String id);

    /**
     * 重置Token错误计数
     *
     * @param id Token ID
     * @return 影响的行数
     */
    @Update("UPDATE tokens SET " +
            "error_count = 0, " +
            "last_error_time = NULL, " +
            "healthy = 1, " +
            "updated_at = NOW() " +
            "WHERE id = #{id}")
    int resetErrorCount(@Param("id") String id);

    /**
     * 根据ID删除Token
     *
     * @param id Token ID
     * @return 影响的行数
     */
    @Delete("DELETE FROM tokens WHERE id = #{id}")
    int deleteById(@Param("id") String id);

    /**
     * 根据Provider ID删除所有Token
     *
     * @param providerId Provider ID
     * @return 影响的行数
     */
    @Delete("DELETE FROM tokens WHERE provider_id = #{providerId}")
    int deleteByProviderId(@Param("providerId") String providerId);

    /**
     * 统计指定Provider的Token数量
     *
     * @param providerId Provider ID
     * @return Token数量
     */
    @Select("SELECT COUNT(*) FROM tokens WHERE provider_id = #{providerId}")
    long countByProviderId(@Param("providerId") String providerId);

    /**
     * 统计指定Provider的可用Token数量
     *
     * @param providerId Provider ID
     * @return 可用Token数量
     */
    @Select("SELECT COUNT(*) FROM tokens WHERE provider_id = #{providerId} AND enabled = 1 AND healthy = 1")
    long countAvailableByProviderId(@Param("providerId") String providerId);

    /**
     * 检查Token别名在指定Provider下是否已存在
     *
     * @param providerId Provider ID
     * @param alias Token别名
     * @param excludeId 排除的Token ID（用于更新时检查）
     * @return 如果存在返回true，否则返回false
     */
    @Select("SELECT COUNT(*) > 0 FROM tokens WHERE provider_id = #{providerId} AND alias = #{alias} AND id != #{excludeId}")
    boolean existsByProviderIdAndAliasAndIdNot(@Param("providerId") String providerId,
                                               @Param("alias") String alias,
                                               @Param("excludeId") String excludeId);

    /**
     * 检查Token别名在指定Provider下是否已存在
     *
     * @param providerId Provider ID
     * @param alias Token别名
     * @return 如果存在返回true，否则返回false
     */
    @Select("SELECT COUNT(*) > 0 FROM tokens WHERE provider_id = #{providerId} AND alias = #{alias}")
    boolean existsByProviderIdAndAlias(@Param("providerId") String providerId, @Param("alias") String alias);
}