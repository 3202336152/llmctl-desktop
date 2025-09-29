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
     * 根据ID查询Provider
     *
     * @param id Provider ID
     * @return Provider对象，如果不存在则返回null
     */
    Provider findById(@Param("id") String id);

    /**
     * 查询所有Provider
     *
     * @return Provider列表
     */
    List<Provider> findAll();

    /**
     * 根据类型查询Provider列表
     *
     * @param type Provider类型
     * @return Provider列表
     */
    List<Provider> findByType(@Param("type") String type);

    /**
     * 根据名称查询Provider
     *
     * @param name Provider名称
     * @return Provider对象，如果不存在则返回null
     */
    Provider findByName(@Param("name") String name);

    /**
     * 插入Provider
     *
     * @param provider Provider对象
     * @return 影响的行数
     */
    int insert(Provider provider);

    /**
     * 更新Provider
     *
     * @param provider Provider对象
     * @return 影响的行数
     */
    int update(Provider provider);

    /**
     * 根据ID删除Provider
     *
     * @param id Provider ID
     * @return 影响的行数
     */
    int deleteById(@Param("id") String id);

    /**
     * 检查Provider名称是否已存在
     *
     * @param name Provider名称
     * @param excludeId 排除的Provider ID（用于更新时检查）
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("excludeId") String excludeId);

    /**
     * 检查Provider名称是否已存在
     *
     * @param name Provider名称
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByName(@Param("name") String name);

    /**
     * 统计Provider总数
     *
     * @return Provider总数
     */
    long count();

    /**
     * 根据类型统计Provider数量
     *
     * @param type Provider类型
     * @return 指定类型的Provider数量
     */
    long countByType(@Param("type") String type);
}