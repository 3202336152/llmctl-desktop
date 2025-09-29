package com.llmctl.service;

import com.llmctl.entity.GlobalConfig;

import java.util.List;

/**
 * 全局配置服务接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public interface IGlobalConfigService {

    /**
     * 获取所有配置
     *
     * @return 配置列表
     */
    List<GlobalConfig> getAllConfigs();

    /**
     * 根据配置键获取配置值
     *
     * @param configKey 配置键
     * @return 配置值，如果不存在返回null
     */
    String getConfigValue(String configKey);

    /**
     * 根据配置键获取配置值，带默认值
     *
     * @param configKey 配置键
     * @param defaultValue 默认值
     * @return 配置值，如果不存在返回默认值
     */
    String getConfigValue(String configKey, String defaultValue);

    /**
     * 根据配置键获取整型配置值
     *
     * @param configKey 配置键
     * @param defaultValue 默认值
     * @return 整型配置值
     */
    Integer getIntConfigValue(String configKey, Integer defaultValue);

    /**
     * 根据配置键获取布尔型配置值
     *
     * @param configKey 配置键
     * @param defaultValue 默认值
     * @return 布尔型配置值
     */
    Boolean getBooleanConfigValue(String configKey, Boolean defaultValue);

    /**
     * 设置配置值
     *
     * @param configKey 配置键
     * @param configValue 配置值
     */
    void setConfig(String configKey, String configValue);

    /**
     * 设置配置值（带类型转换）
     *
     * @param configKey 配置键
     * @param configValue 配置值
     */
    void setConfig(String configKey, Object configValue);

    /**
     * 删除配置
     *
     * @param configKey 配置键
     */
    void deleteConfig(String configKey);

    /**
     * 检查配置是否存在
     *
     * @param configKey 配置键
     * @return true如果存在，false如果不存在
     */
    boolean configExists(String configKey);

    /**
     * 获取活跃Provider ID
     *
     * @return 活跃Provider ID
     */
    String getActiveProviderId();

    /**
     * 设置活跃Provider ID
     *
     * @param providerId Provider ID
     */
    void setActiveProviderId(String providerId);

    /**
     * 获取应用版本
     *
     * @return 应用版本
     */
    String getAppVersion();

    /**
     * 初始化默认配置
     */
    void initializeDefaultConfigs();
}