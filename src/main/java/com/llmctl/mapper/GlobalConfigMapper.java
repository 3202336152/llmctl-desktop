package com.llmctl.mapper;

import com.llmctl.entity.GlobalConfig;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 全局配置数据访问接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Mapper
public interface GlobalConfigMapper {

    /**
     * 根据ID查询全局配置
     *
     * @param id 配置ID
     * @return GlobalConfig对象，如果不存在则返回null
     */
    @Select("SELECT * FROM global_config WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "configKey", column = "config_key"),
        @Result(property = "configValue", column = "config_value"),
        @Result(property = "description", column = "description"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    GlobalConfig findById(@Param("id") Integer id);

    /**
     * 根据配置键查询全局配置
     *
     * @param configKey 配置键
     * @return GlobalConfig对象，如果不存在则返回null
     */
    @Select("SELECT * FROM global_config WHERE config_key = #{configKey}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "configKey", column = "config_key"),
        @Result(property = "configValue", column = "config_value"),
        @Result(property = "description", column = "description"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    GlobalConfig findByConfigKey(@Param("configKey") String configKey);

    /**
     * 查询所有全局配置
     *
     * @return GlobalConfig列表
     */
    @Select("SELECT * FROM global_config ORDER BY config_key")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "configKey", column = "config_key"),
        @Result(property = "configValue", column = "config_value"),
        @Result(property = "description", column = "description"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<GlobalConfig> findAll();

    /**
     * 根据配置键模糊查询全局配置
     *
     * @param keyPattern 配置键模式（支持%通配符）
     * @return GlobalConfig列表
     */
    @Select("SELECT * FROM global_config WHERE config_key LIKE #{keyPattern} ORDER BY config_key")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "configKey", column = "config_key"),
        @Result(property = "configValue", column = "config_value"),
        @Result(property = "description", column = "description"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<GlobalConfig> findByConfigKeyLike(@Param("keyPattern") String keyPattern);

    /**
     * 插入全局配置
     *
     * @param globalConfig GlobalConfig对象
     * @return 影响的行数
     */
    @Insert("INSERT INTO global_config (config_key, config_value, description, created_at, updated_at) " +
            "VALUES (#{configKey}, #{configValue}, #{description}, #{createdAt}, #{updatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(GlobalConfig globalConfig);

    /**
     * 更新全局配置
     *
     * @param globalConfig GlobalConfig对象
     * @return 影响的行数
     */
    @Update("UPDATE global_config SET " +
            "config_value = #{configValue}, " +
            "description = #{description}, " +
            "updated_at = #{updatedAt} " +
            "WHERE id = #{id}")
    int update(GlobalConfig globalConfig);

    /**
     * 根据配置键更新配置值
     *
     * @param configKey 配置键
     * @param configValue 配置值
     * @return 影响的行数
     */
    @Update("UPDATE global_config SET config_value = #{configValue}, updated_at = NOW() " +
            "WHERE config_key = #{configKey}")
    int updateValueByKey(@Param("configKey") String configKey, @Param("configValue") String configValue);

    /**
     * 插入或更新全局配置（如果配置键已存在则更新，否则插入）
     *
     * @param configKey 配置键
     * @param configValue 配置值
     * @param description 配置描述
     * @return 影响的行数
     */
    @Insert("INSERT INTO global_config (config_key, config_value, description, created_at, updated_at) " +
            "VALUES (#{configKey}, #{configValue}, #{description}, NOW(), NOW()) " +
            "ON DUPLICATE KEY UPDATE " +
            "config_value = VALUES(config_value), " +
            "description = VALUES(description), " +
            "updated_at = NOW()")
    int insertOrUpdate(@Param("configKey") String configKey,
                      @Param("configValue") String configValue,
                      @Param("description") String description);

    /**
     * 根据ID删除全局配置
     *
     * @param id 配置ID
     * @return 影响的行数
     */
    @Delete("DELETE FROM global_config WHERE id = #{id}")
    int deleteById(@Param("id") Integer id);

    /**
     * 根据配置键删除全局配置
     *
     * @param configKey 配置键
     * @return 影响的行数
     */
    @Delete("DELETE FROM global_config WHERE config_key = #{configKey}")
    int deleteByConfigKey(@Param("configKey") String configKey);

    /**
     * 检查配置键是否已存在
     *
     * @param configKey 配置键
     * @return 如果存在返回true，否则返回false
     */
    @Select("SELECT COUNT(*) > 0 FROM global_config WHERE config_key = #{configKey}")
    boolean existsByConfigKey(@Param("configKey") String configKey);

    /**
     * 检查配置键是否已存在（排除指定ID）
     *
     * @param configKey 配置键
     * @param excludeId 排除的配置ID
     * @return 如果存在返回true，否则返回false
     */
    @Select("SELECT COUNT(*) > 0 FROM global_config WHERE config_key = #{configKey} AND id != #{excludeId}")
    boolean existsByConfigKeyAndIdNot(@Param("configKey") String configKey, @Param("excludeId") Integer excludeId);

    /**
     * 统计全局配置总数
     *
     * @return 全局配置总数
     */
    @Select("SELECT COUNT(*) FROM global_config")
    long count();

    /**
     * 获取当前活跃的Provider ID
     *
     * @return 活跃的Provider ID，如果未设置则返回null
     */
    @Select("SELECT config_value FROM global_config WHERE config_key = 'active_provider_id'")
    String getActiveProviderId();

    /**
     * 设置当前活跃的Provider ID
     *
     * @param providerId Provider ID
     * @return 影响的行数
     */
    @Insert("INSERT INTO global_config (config_key, config_value, description, created_at, updated_at) " +
            "VALUES ('active_provider_id', #{providerId}, '当前活跃的Provider ID', NOW(), NOW()) " +
            "ON DUPLICATE KEY UPDATE " +
            "config_value = VALUES(config_value), " +
            "updated_at = NOW()")
    int setActiveProviderId(@Param("providerId") String providerId);

    /**
     * 获取应用版本号
     *
     * @return 应用版本号
     */
    @Select("SELECT config_value FROM global_config WHERE config_key = 'app_version'")
    String getAppVersion();

    /**
     * 设置应用版本号
     *
     * @param version 版本号
     * @return 影响的行数
     */
    @Insert("INSERT INTO global_config (config_key, config_value, description, created_at, updated_at) " +
            "VALUES ('app_version', #{version}, '应用版本号', NOW(), NOW()) " +
            "ON DUPLICATE KEY UPDATE " +
            "config_value = VALUES(config_value), " +
            "updated_at = NOW()")
    int setAppVersion(@Param("version") String version);

    /**
     * 获取Token错误阈值
     *
     * @return Token错误阈值
     */
    @Select("SELECT config_value FROM global_config WHERE config_key = 'token_error_threshold'")
    String getTokenErrorThreshold();

    /**
     * 获取Token冷却时间（秒）
     *
     * @return Token冷却时间
     */
    @Select("SELECT config_value FROM global_config WHERE config_key = 'token_cooldown_period'")
    String getTokenCooldownPeriod();

    /**
     * 获取会话最大空闲时间（秒）
     *
     * @return 会话最大空闲时间
     */
    @Select("SELECT config_value FROM global_config WHERE config_key = 'max_session_idle_time'")
    String getMaxSessionIdleTime();
}