package com.llmctl.mapper;

import com.llmctl.entity.Provider;
import org.apache.ibatis.annotations.*;

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
    @Select("SELECT * FROM providers WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "description", column = "description"),
        @Result(property = "type", column = "type"),
        @Result(property = "baseUrl", column = "base_url"),
        @Result(property = "modelName", column = "model_name"),
        @Result(property = "maxTokens", column = "max_tokens"),
        @Result(property = "maxOutputTokens", column = "max_output_tokens"),
        @Result(property = "temperature", column = "temperature"),
        @Result(property = "extraHeaders", column = "extra_headers"),
        @Result(property = "tokenStrategyType", column = "token_strategy_type"),
        @Result(property = "tokenFallbackOnError", column = "token_fallback_on_error"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    Provider findById(@Param("id") String id);

    /**
     * 查询所有Provider
     *
     * @return Provider列表
     */
    @Select("SELECT * FROM providers ORDER BY created_at DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "description", column = "description"),
        @Result(property = "type", column = "type"),
        @Result(property = "baseUrl", column = "base_url"),
        @Result(property = "modelName", column = "model_name"),
        @Result(property = "maxTokens", column = "max_tokens"),
        @Result(property = "maxOutputTokens", column = "max_output_tokens"),
        @Result(property = "temperature", column = "temperature"),
        @Result(property = "extraHeaders", column = "extra_headers"),
        @Result(property = "tokenStrategyType", column = "token_strategy_type"),
        @Result(property = "tokenFallbackOnError", column = "token_fallback_on_error"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<Provider> findAll();

    /**
     * 根据类型查询Provider列表
     *
     * @param type Provider类型
     * @return Provider列表
     */
    @Select("SELECT * FROM providers WHERE type = #{type} ORDER BY created_at DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "description", column = "description"),
        @Result(property = "type", column = "type"),
        @Result(property = "baseUrl", column = "base_url"),
        @Result(property = "modelName", column = "model_name"),
        @Result(property = "maxTokens", column = "max_tokens"),
        @Result(property = "maxOutputTokens", column = "max_output_tokens"),
        @Result(property = "temperature", column = "temperature"),
        @Result(property = "extraHeaders", column = "extra_headers"),
        @Result(property = "tokenStrategyType", column = "token_strategy_type"),
        @Result(property = "tokenFallbackOnError", column = "token_fallback_on_error"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<Provider> findByType(@Param("type") String type);

    /**
     * 根据名称查询Provider
     *
     * @param name Provider名称
     * @return Provider对象，如果不存在则返回null
     */
    @Select("SELECT * FROM providers WHERE name = #{name}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "description", column = "description"),
        @Result(property = "type", column = "type"),
        @Result(property = "baseUrl", column = "base_url"),
        @Result(property = "modelName", column = "model_name"),
        @Result(property = "maxTokens", column = "max_tokens"),
        @Result(property = "maxOutputTokens", column = "max_output_tokens"),
        @Result(property = "temperature", column = "temperature"),
        @Result(property = "extraHeaders", column = "extra_headers"),
        @Result(property = "tokenStrategyType", column = "token_strategy_type"),
        @Result(property = "tokenFallbackOnError", column = "token_fallback_on_error"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    Provider findByName(@Param("name") String name);

    /**
     * 插入Provider
     *
     * @param provider Provider对象
     * @return 影响的行数
     */
    @Insert("INSERT INTO providers (id, name, description, type, base_url, model_name, " +
            "max_tokens, max_output_tokens, temperature, extra_headers, " +
            "token_strategy_type, token_fallback_on_error, created_at, updated_at) " +
            "VALUES (#{id}, #{name}, #{description}, #{type}, #{baseUrl}, #{modelName}, " +
            "#{maxTokens}, #{maxOutputTokens}, #{temperature}, #{extraHeaders}, " +
            "#{tokenStrategyType}, #{tokenFallbackOnError}, #{createdAt}, #{updatedAt})")
    int insert(Provider provider);

    /**
     * 更新Provider
     *
     * @param provider Provider对象
     * @return 影响的行数
     */
    @Update("UPDATE providers SET " +
            "name = #{name}, " +
            "description = #{description}, " +
            "base_url = #{baseUrl}, " +
            "model_name = #{modelName}, " +
            "max_tokens = #{maxTokens}, " +
            "max_output_tokens = #{maxOutputTokens}, " +
            "temperature = #{temperature}, " +
            "extra_headers = #{extraHeaders}, " +
            "token_strategy_type = #{tokenStrategyType}, " +
            "token_fallback_on_error = #{tokenFallbackOnError}, " +
            "updated_at = #{updatedAt} " +
            "WHERE id = #{id}")
    int update(Provider provider);

    /**
     * 根据ID删除Provider
     *
     * @param id Provider ID
     * @return 影响的行数
     */
    @Delete("DELETE FROM providers WHERE id = #{id}")
    int deleteById(@Param("id") String id);

    /**
     * 检查Provider名称是否已存在
     *
     * @param name Provider名称
     * @param excludeId 排除的Provider ID（用于更新时检查）
     * @return 如果存在返回true，否则返回false
     */
    @Select("SELECT COUNT(*) > 0 FROM providers WHERE name = #{name} AND id != #{excludeId}")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("excludeId") String excludeId);

    /**
     * 检查Provider名称是否已存在
     *
     * @param name Provider名称
     * @return 如果存在返回true，否则返回false
     */
    @Select("SELECT COUNT(*) > 0 FROM providers WHERE name = #{name}")
    boolean existsByName(@Param("name") String name);

    /**
     * 统计Provider总数
     *
     * @return Provider总数
     */
    @Select("SELECT COUNT(*) FROM providers")
    long count();

    /**
     * 根据类型统计Provider数量
     *
     * @param type Provider类型
     * @return 指定类型的Provider数量
     */
    @Select("SELECT COUNT(*) FROM providers WHERE type = #{type}")
    long countByType(@Param("type") String type);
}