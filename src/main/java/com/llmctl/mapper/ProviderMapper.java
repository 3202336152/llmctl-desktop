package com.llmctl.mapper;

import com.llmctl.entity.Provider;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * Provider数据访问接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Mapper
public interface ProviderMapper {

    /**
     * 根据ID和用户ID查询Provider
     *
     * @param id Provider ID
     * @param userId 用户ID
     * @return Provider对象，如果不存在则返回null
     */
    Provider findById(@Param("id") String id, @Param("userId") Long userId);

    /**
     * 查询指定用户的所有Provider
     *
     * @param userId 用户ID
     * @return Provider列表
     */
    List<Provider> findAll(@Param("userId") Long userId);

    /**
     * 根据类型和用户ID查询Provider列表
     *
     * @param type Provider类型
     * @param userId 用户ID
     * @return Provider列表
     */
    List<Provider> findByType(@Param("type") String type, @Param("userId") Long userId);

    /**
     * 根据名称和用户ID查询Provider
     *
     * @param name Provider名称
     * @param userId 用户ID
     * @return Provider对象，如果不存在则返回null
     */
    Provider findByName(@Param("name") String name, @Param("userId") Long userId);

    /**
     * 插入Provider
     *
     * @param provider Provider对象
     * @return 影响的行数
     */
    int insert(Provider provider);

    /**
     * 更新Provider（需要验证用户权限）
     *
     * @param provider Provider对象
     * @return 影响的行数
     */
    int update(Provider provider);

    /**
     * 根据ID和用户ID删除Provider
     *
     * @param id Provider ID
     * @param userId 用户ID
     * @return 影响的行数
     */
    int deleteById(@Param("id") String id, @Param("userId") Long userId);

    /**
     * 检查Provider名称是否已存在（同一用户下）
     *
     * @param name Provider名称
     * @param excludeId 排除的Provider ID（用于更新时检查）
     * @param userId 用户ID
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("excludeId") String excludeId, @Param("userId") Long userId);

    /**
     * 检查Provider名称是否已存在（同一用户下）
     *
     * @param name Provider名称
     * @param userId 用户ID
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByName(@Param("name") String name, @Param("userId") Long userId);

    /**
     * 统计指定用户的Provider总数
     *
     * @param userId 用户ID
     * @return Provider总数
     */
    long count(@Param("userId") Long userId);

    /**
     * 根据类型统计指定用户的Provider数量
     *
     * @param type Provider类型
     * @param userId 用户ID
     * @return 指定类型的Provider数量
     */
    long countByType(@Param("type") String type, @Param("userId") Long userId);
}