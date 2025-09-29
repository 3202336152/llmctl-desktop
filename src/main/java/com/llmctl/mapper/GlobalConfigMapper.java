package com.llmctl.mapper;

import com.llmctl.entity.GlobalConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

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
    GlobalConfig findById(@Param("id") Integer id);

    /**
     * 根据配置键查询全局配置
     *
     * @param configKey 配置键
     * @return GlobalConfig对象，如果不存在则返回null
     */
    GlobalConfig findByConfigKey(@Param("configKey") String configKey);

    /**
     * 查询所有全局配置
     *
     * @return GlobalConfig列表
     */
    List<GlobalConfig> findAll();

    /**
     * 根据配置键模糊查询全局配置
     *
     * @param keyPattern 配置键模式（支持%通配符）
     * @return GlobalConfig列表
     */
    List<GlobalConfig> findByConfigKeyLike(@Param("keyPattern") String keyPattern);

    /**
     * 插入全局配置
     *
     * @param globalConfig GlobalConfig对象
     * @return 影响的行数
     */
    int insert(GlobalConfig globalConfig);

    /**
     * 更新全局配置
     *
     * @param globalConfig GlobalConfig对象
     * @return 影响的行数
     */
    int update(GlobalConfig globalConfig);

    /**
     * 根据配置键更新配置值
     *
     * @param configKey 配置键
     * @param configValue 配置值
     * @return 影响的行数
     */
    int updateValueByKey(@Param("configKey") String configKey, @Param("configValue") String configValue);

    /**
     * 插入或更新全局配置（如果配置键已存在则更新，否则插入）
     *
     * @param configKey 配置键
     * @param configValue 配置值
     * @param description 配置描述
     * @return 影响的行数
     */
    int insertOrUpdate(@Param("configKey") String configKey,
                      @Param("configValue") String configValue,
                      @Param("description") String description);

    /**
     * 根据ID删除全局配置
     *
     * @param id 配置ID
     * @return 影响的行数
     */
    int deleteById(@Param("id") Integer id);

    /**
     * 根据配置键删除全局配置
     *
     * @param configKey 配置键
     * @return 影响的行数
     */
    int deleteByConfigKey(@Param("configKey") String configKey);

    /**
     * 检查配置键是否已存在
     *
     * @param configKey 配置键
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByConfigKey(@Param("configKey") String configKey);

    /**
     * 检查配置键是否已存在（排除指定ID）
     *
     * @param configKey 配置键
     * @param excludeId 排除的配置ID
     * @return 如果存在返回true，否则返回false
     */
    boolean existsByConfigKeyAndIdNot(@Param("configKey") String configKey, @Param("excludeId") Integer excludeId);

    /**
     * 统计全局配置总数
     *
     * @return 全局配置总数
     */
    long count();

    /**
     * 获取当前活跃的Provider ID
     *
     * @return 活跃的Provider ID，如果未设置则返回null
     */
    String getActiveProviderId();

    /**
     * 设置当前活跃的Provider ID
     *
     * @param providerId Provider ID
     * @return 影响的行数
     */
    int setActiveProviderId(@Param("providerId") String providerId);

    /**
     * 获取应用版本号
     *
     * @return 应用版本号
     */
    String getAppVersion();

    /**
     * 设置应用版本号
     *
     * @param version 版本号
     * @return 影响的行数
     */
    int setAppVersion(@Param("version") String version);

    /**
     * 获取Token错误阈值
     *
     * @return Token错误阈值
     */
    String getTokenErrorThreshold();

    /**
     * 获取Token冷却时间（秒）
     *
     * @return Token冷却时间
     */
    String getTokenCooldownPeriod();

    /**
     * 获取会话最大空闲时间（秒）
     *
     * @return 会话最大空闲时间
     */
    String getMaxSessionIdleTime();
}