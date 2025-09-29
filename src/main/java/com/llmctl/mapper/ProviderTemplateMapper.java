package com.llmctl.mapper;

import com.llmctl.entity.ProviderTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * Provider模板数据访问接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Mapper
public interface ProviderTemplateMapper {

    /**
     * 根据ID查询Provider模板
     */
    ProviderTemplate findById(@Param("id") String id);

    /**
     * 查询所有模板
     */
    List<ProviderTemplate> findAll();

    /**
     * 根据类型查询模板
     */
    List<ProviderTemplate> findByType(@Param("type") String type);

    /**
     * 查询活跃的模板
     */
    List<ProviderTemplate> findActive();

    /**
     * 插入模板
     */
    int insert(ProviderTemplate template);

    /**
     * 更新模板
     */
    int update(ProviderTemplate template);

    /**
     * 删除模板
     */
    int deleteById(@Param("id") String id);
}