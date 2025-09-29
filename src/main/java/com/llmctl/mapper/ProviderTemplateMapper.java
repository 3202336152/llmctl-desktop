package com.llmctl.mapper;

import com.llmctl.entity.ProviderTemplate;
import org.apache.ibatis.annotations.*;

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
    @Select("SELECT * FROM provider_templates WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "description", column = "description"),
        @Result(property = "type", column = "type"),
        @Result(property = "defaultBaseUrl", column = "default_base_url"),
        @Result(property = "defaultModelName", column = "default_model_name"),
        @Result(property = "envVarsTemplate", column = "env_vars_template"),
        @Result(property = "setupPrompts", column = "setup_prompts"),
        @Result(property = "isActive", column = "is_active"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    ProviderTemplate findById(@Param("id") String id);

    /**
     * 查询所有模板
     */
    @Select("SELECT * FROM provider_templates ORDER BY type, name")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "description", column = "description"),
        @Result(property = "type", column = "type"),
        @Result(property = "defaultBaseUrl", column = "default_base_url"),
        @Result(property = "defaultModelName", column = "default_model_name"),
        @Result(property = "envVarsTemplate", column = "env_vars_template"),
        @Result(property = "setupPrompts", column = "setup_prompts"),
        @Result(property = "isActive", column = "is_active"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<ProviderTemplate> findAll();

    /**
     * 根据类型查询模板
     */
    @Select("SELECT * FROM provider_templates WHERE type = #{type} AND is_active = 1 ORDER BY name")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "description", column = "description"),
        @Result(property = "type", column = "type"),
        @Result(property = "defaultBaseUrl", column = "default_base_url"),
        @Result(property = "defaultModelName", column = "default_model_name"),
        @Result(property = "envVarsTemplate", column = "env_vars_template"),
        @Result(property = "setupPrompts", column = "setup_prompts"),
        @Result(property = "isActive", column = "is_active"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<ProviderTemplate> findByType(@Param("type") String type);

    /**
     * 查询活跃的模板
     */
    @Select("SELECT * FROM provider_templates WHERE is_active = 1 ORDER BY type, name")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "description", column = "description"),
        @Result(property = "type", column = "type"),
        @Result(property = "defaultBaseUrl", column = "default_base_url"),
        @Result(property = "defaultModelName", column = "default_model_name"),
        @Result(property = "envVarsTemplate", column = "env_vars_template"),
        @Result(property = "setupPrompts", column = "setup_prompts"),
        @Result(property = "isActive", column = "is_active"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<ProviderTemplate> findActive();

    /**
     * 插入模板
     */
    @Insert("INSERT INTO provider_templates (id, name, description, type, default_base_url, " +
            "default_model_name, env_vars_template, setup_prompts, is_active, created_at, updated_at) " +
            "VALUES (#{id}, #{name}, #{description}, #{type}, #{defaultBaseUrl}, " +
            "#{defaultModelName}, #{envVarsTemplate}, #{setupPrompts}, #{isActive}, #{createdAt}, #{updatedAt})")
    int insert(ProviderTemplate template);

    /**
     * 更新模板
     */
    @Update("UPDATE provider_templates SET " +
            "name = #{name}, " +
            "description = #{description}, " +
            "default_base_url = #{defaultBaseUrl}, " +
            "default_model_name = #{defaultModelName}, " +
            "env_vars_template = #{envVarsTemplate}, " +
            "setup_prompts = #{setupPrompts}, " +
            "is_active = #{isActive}, " +
            "updated_at = #{updatedAt} " +
            "WHERE id = #{id}")
    int update(ProviderTemplate template);

    /**
     * 删除模板
     */
    @Delete("DELETE FROM provider_templates WHERE id = #{id}")
    int deleteById(@Param("id") String id);
}