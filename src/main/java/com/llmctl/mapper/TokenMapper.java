package com.llmctl.mapper;

import com.llmctl.entity.Token;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

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
    Token findById(@Param("id") String id);

    /**
     * 根据Provider ID查询Token列表
     *
     * @param providerId Provider ID
     * @return Token列表
     */
    List<Token> findByProviderId(@Param("providerId") String providerId);

    /**
     * 根据Provider ID查询可用的Token列表（启用且健康）
     *
     * @param providerId Provider ID
     * @return 可用的Token列表
     */
    List<Token> findAvailableByProviderId(@Param("providerId") String providerId);

    /**
     * 查询所有Token
     *
     * @return Token列表
     */
    List<Token> findAll();

    /**
     * 插入Token
     *
     * @param token Token对象
     * @return 影响的行数
     */
    int insert(Token token);

    /**
     * 更新Token
     *
     * @param token Token对象
     * @return 影响的行数
     */
    int update(Token token);

    /**
     * 更新Token健康状态
     *
     * @param id Token ID
     * @param healthy 健康状态
     * @return 影响的行数
     */
    int updateHealthStatus(@Param("id") String id, @Param("healthy") Boolean healthy);

    /**
     * 更新Token最后使用时间
     *
     * @param id Token ID
     * @return 影响的行数
     */
    int updateLastUsed(@Param("id") String id);

    /**
     * 根据ID删除Token
     *
     * @param id Token ID
     * @return 影响的行数
     */
    int deleteById(@Param("id") String id);

    /**
     * 根据Provider ID删除所有Token
     *
     * @param providerId Provider ID
     * @return 影响的行数
     */
    int deleteByProviderId(@Param("providerId") String providerId);

    /**
     * 统计指定Provider的Token数量
     *
     * @param providerId Provider ID
     * @return Token数量
     */
    long countByProviderId(@Param("providerId") String providerId);

    /**
     * 统计指定Provider的可用Token数量
     *
     * @param providerId Provider ID
     * @return 可用Token数量
     */
    long countAvailableByProviderId(@Param("providerId") String providerId);

    /**
     * 检查Token别名在指定Provider下是否已存在
     *
     * @param providerId Provider ID
     * @param alias Token别名
     * @param excludeId 排除的Token ID（用于更新时检查）
     * @return 如果存在返回true，否则返回false
     */
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
    boolean existsByProviderIdAndAlias(@Param("providerId") String providerId,
                                       @Param("alias") String alias);

    /**
     * 查询需要迁移的明文Token（用于数据迁移）
     * 查询条件：encryption_version 为 NULL 或 'plaintext'
     *
     * @return 明文Token列表
     */
    List<Token> findPlaintextTokens();

    /**
     * 批量恢复指定Provider下所有不健康Token的健康状态
     *
     * @param providerId Provider ID
     * @return 影响的行数
     */
    int recoverAllUnhealthyTokens(@Param("providerId") String providerId);

    /**
     * 检查指定用户下是否存在相同的Token值（基于Hash）
     *
     * @param userId 用户ID
     * @param tokenValueHash Token值的SHA-256 Hash
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByUserIdAndValueHash(@Param("userId") Long userId, @Param("tokenValueHash") String tokenValueHash);

    /**
     * 检查指定用户下是否存在相同的Token值（排除指定Token）
     * 用于更新时检查（基于Hash）
     *
     * @param userId 用户ID
     * @param tokenValueHash Token值的SHA-256 Hash
     * @param excludeId 排除的Token ID
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByUserIdAndValueHashAndIdNot(@Param("userId") Long userId,
                                             @Param("tokenValueHash") String tokenValueHash,
                                             @Param("excludeId") String excludeId);

    /**
     * 查询所有缺少Hash值的Token（用于数据迁移）
     *
     * @return 缺少Hash值的Token列表
     */
    List<Token> findTokensWithoutHash();

    /**
     * 更新Token的Hash值
     *
     * @param tokenId Token ID
     * @param tokenHash Hash值
     * @return 影响的行数
     */
    int updateTokenHash(@Param("id") String id, @Param("tokenHash") String tokenHash);
}