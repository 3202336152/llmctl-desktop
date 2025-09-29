package com.llmctl.service;

import com.llmctl.entity.GlobalConfig;
import com.llmctl.mapper.GlobalConfigMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 全局配置业务服务类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GlobalConfigService {

    private final GlobalConfigMapper globalConfigMapper;

    /**
     * 获取所有配置
     *
     * @return 配置列表
     */
    public List<GlobalConfig> getAllConfigs() {
        log.debug("获取所有全局配置");
        return globalConfigMapper.findAll();
    }

    /**
     * 根据配置键获取配置值
     *
     * @param configKey 配置键
     * @return 配置值，如果不存在则返回null
     */
    public String getConfigValue(String configKey) {
        log.debug("获取配置值: {}", configKey);
        GlobalConfig config = globalConfigMapper.findByConfigKey(configKey);
        return config != null ? config.getConfigValue() : null;
    }

    /**
     * 根据配置键获取配置值（带默认值）
     *
     * @param configKey 配置键
     * @param defaultValue 默认值
     * @return 配置值，如果不存在则返回默认值
     */
    public String getConfigValue(String configKey, String defaultValue) {
        String value = getConfigValue(configKey);
        return value != null ? value : defaultValue;
    }

    /**
     * 根据配置键获取配置对象
     *
     * @param configKey 配置键
     * @return 配置对象，如果不存在则返回null
     */
    public GlobalConfig getConfig(String configKey) {
        log.debug("获取配置对象: {}", configKey);
        return globalConfigMapper.findByConfigKey(configKey);
    }

    /**
     * 设置配置值
     *
     * @param configKey 配置键
     * @param configValue 配置值
     * @param description 配置描述
     */
    @Transactional
    public void setConfig(String configKey, String configValue, String description) {
        log.info("设置配置: {} = {}", configKey, configValue);
        globalConfigMapper.insertOrUpdate(configKey, configValue, description);
    }

    /**
     * 设置配置值（不更新描述）
     *
     * @param configKey 配置键
     * @param configValue 配置值
     */
    @Transactional
    public void setConfigValue(String configKey, String configValue) {
        log.info("设置配置值: {} = {}", configKey, configValue);
        globalConfigMapper.updateValueByKey(configKey, configValue);
    }

    /**
     * 删除配置
     *
     * @param configKey 配置键
     */
    @Transactional
    public void deleteConfig(String configKey) {
        log.info("删除配置: {}", configKey);
        globalConfigMapper.deleteByConfigKey(configKey);
    }

    /**
     * 获取当前活跃的Provider ID
     *
     * @return 活跃的Provider ID，如果未设置则返回null
     */
    public String getActiveProviderId() {
        return globalConfigMapper.getActiveProviderId();
    }

    /**
     * 设置当前活跃的Provider ID
     *
     * @param providerId Provider ID
     */
    @Transactional
    public void setActiveProviderId(String providerId) {
        log.info("设置活跃Provider: {}", providerId);
        globalConfigMapper.setActiveProviderId(providerId);
    }

    /**
     * 获取应用版本号
     *
     * @return 应用版本号
     */
    public String getAppVersion() {
        return globalConfigMapper.getAppVersion();
    }

    /**
     * 设置应用版本号
     *
     * @param version 版本号
     */
    @Transactional
    public void setAppVersion(String version) {
        log.info("设置应用版本: {}", version);
        globalConfigMapper.setAppVersion(version);
    }

    /**
     * 获取Token错误阈值
     *
     * @return Token错误阈值
     */
    public int getTokenErrorThreshold() {
        String threshold = globalConfigMapper.getTokenErrorThreshold();
        try {
            return threshold != null ? Integer.parseInt(threshold) : 3;
        } catch (NumberFormatException e) {
            log.warn("Token错误阈值配置无效: {}, 使用默认值3", threshold);
            return 3;
        }
    }

    /**
     * 获取Token冷却时间（秒）
     *
     * @return Token冷却时间
     */
    public int getTokenCooldownPeriod() {
        String period = globalConfigMapper.getTokenCooldownPeriod();
        try {
            return period != null ? Integer.parseInt(period) : 60;
        } catch (NumberFormatException e) {
            log.warn("Token冷却时间配置无效: {}, 使用默认值60", period);
            return 60;
        }
    }

    /**
     * 获取会话最大空闲时间（秒）
     *
     * @return 会话最大空闲时间
     */
    public int getMaxSessionIdleTime() {
        String idleTime = globalConfigMapper.getMaxSessionIdleTime();
        try {
            return idleTime != null ? Integer.parseInt(idleTime) : 3600;
        } catch (NumberFormatException e) {
            log.warn("会话空闲时间配置无效: {}, 使用默认值3600", idleTime);
            return 3600;
        }
    }

    /**
     * 检查配置键是否存在
     *
     * @param configKey 配置键
     * @return true如果配置存在
     */
    public boolean configExists(String configKey) {
        return globalConfigMapper.existsByConfigKey(configKey);
    }

    /**
     * 批量设置配置
     *
     * @param configs 配置Map
     */
    @Transactional
    public void batchSetConfigs(java.util.Map<String, String> configs) {
        log.info("批量设置配置，数量: {}", configs.size());

        for (java.util.Map.Entry<String, String> entry : configs.entrySet()) {
            try {
                setConfigValue(entry.getKey(), entry.getValue());
            } catch (Exception e) {
                log.error("设置配置失败: {} = {}", entry.getKey(), entry.getValue(), e);
            }
        }
    }

    /**
     * 获取配置的整数值
     *
     * @param configKey 配置键
     * @param defaultValue 默认值
     * @return 配置的整数值
     */
    public Integer getConfigIntValue(String configKey, Integer defaultValue) {
        String value = getConfigValue(configKey);
        if (value == null) {
            return defaultValue;
        }

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            log.warn("配置值无法转换为整数: {} = {}, 使用默认值: {}", configKey, value, defaultValue);
            return defaultValue;
        }
    }

    /**
     * 获取配置的布尔值
     *
     * @param configKey 配置键
     * @param defaultValue 默认值
     * @return 配置的布尔值
     */
    public Boolean getConfigBooleanValue(String configKey, Boolean defaultValue) {
        String value = getConfigValue(configKey);
        if (value == null) {
            return defaultValue;
        }

        return Boolean.parseBoolean(value);
    }

    /**
     * 初始化默认配置
     */
    @Transactional
    public void initializeDefaultConfigs() {
        log.info("初始化默认配置");

        // 检查并设置默认配置
        if (!configExists(GlobalConfig.ConfigKeys.APP_VERSION)) {
            setConfig(GlobalConfig.ConfigKeys.APP_VERSION, "2.0.0", "应用版本号");
        }

        if (!configExists(GlobalConfig.ConfigKeys.AUTO_BACKUP_ENABLED)) {
            setConfig(GlobalConfig.ConfigKeys.AUTO_BACKUP_ENABLED, "true", "是否启用自动备份");
        }

        if (!configExists(GlobalConfig.ConfigKeys.MAX_SESSION_IDLE_TIME)) {
            setConfig(GlobalConfig.ConfigKeys.MAX_SESSION_IDLE_TIME, "3600", "会话最大空闲时间（秒）");
        }

        if (!configExists(GlobalConfig.ConfigKeys.TOKEN_ERROR_THRESHOLD)) {
            setConfig(GlobalConfig.ConfigKeys.TOKEN_ERROR_THRESHOLD, "3", "Token错误阈值");
        }

        if (!configExists(GlobalConfig.ConfigKeys.TOKEN_COOLDOWN_PERIOD)) {
            setConfig(GlobalConfig.ConfigKeys.TOKEN_COOLDOWN_PERIOD, "60", "Token冷却时间（秒）");
        }

        log.info("默认配置初始化完成");
    }
}