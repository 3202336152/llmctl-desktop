package com.llmctl.service.impl;

import com.llmctl.entity.GlobalConfig;
import com.llmctl.mapper.GlobalConfigMapper;
import com.llmctl.service.IGlobalConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 全局配置业务服务实现类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GlobalConfigServiceImpl implements IGlobalConfigService {

    private final GlobalConfigMapper globalConfigMapper;

    @Override
    public List<GlobalConfig> getAllConfigs() {
        log.debug("获取所有全局配置");
        return globalConfigMapper.findAll();
    }

    @Override
    public String getConfigValue(String configKey) {
        log.debug("获取配置值: {}", configKey);
        GlobalConfig config = globalConfigMapper.findByConfigKey(configKey);
        return config != null ? config.getConfigValue() : null;
    }

    @Override
    public String getConfigValue(String configKey, String defaultValue) {
        String value = getConfigValue(configKey);
        return value != null ? value : defaultValue;
    }

    @Override
    public Integer getIntConfigValue(String configKey, Integer defaultValue) {
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

    @Override
    public Boolean getBooleanConfigValue(String configKey, Boolean defaultValue) {
        String value = getConfigValue(configKey);
        if (value == null) {
            return defaultValue;
        }

        return Boolean.parseBoolean(value);
    }

    @Override
    @Transactional
    public void setConfig(String configKey, String configValue) {
        log.info("设置配置: {} = {}", configKey, configValue);
        globalConfigMapper.insertOrUpdate(configKey, configValue, "系统设置");
    }

    @Override
    @Transactional
    public void setConfig(String configKey, Object configValue) {
        setConfig(configKey, configValue != null ? configValue.toString() : null);
    }

    @Override
    @Transactional
    public void deleteConfig(String configKey) {
        log.info("删除配置: {}", configKey);
        globalConfigMapper.deleteByConfigKey(configKey);
    }

    @Override
    public boolean configExists(String configKey) {
        return globalConfigMapper.existsByConfigKey(configKey);
    }

    @Override
    public String getActiveProviderId() {
        return globalConfigMapper.getActiveProviderId();
    }

    @Override
    @Transactional
    public void setActiveProviderId(String providerId) {
        log.info("设置活跃Provider: {}", providerId);
        globalConfigMapper.setActiveProviderId(providerId);
    }

    @Override
    public String getAppVersion() {
        return globalConfigMapper.getAppVersion();
    }

    @Override
    @Transactional
    public void initializeDefaultConfigs() {
        log.info("初始化默认配置");

        // 检查并设置默认配置
        if (!configExists(GlobalConfig.ConfigKeys.APP_VERSION)) {
            setConfig(GlobalConfig.ConfigKeys.APP_VERSION, "2.0.0");
        }

        if (!configExists(GlobalConfig.ConfigKeys.AUTO_BACKUP_ENABLED)) {
            setConfig(GlobalConfig.ConfigKeys.AUTO_BACKUP_ENABLED, "true");
        }

        if (!configExists(GlobalConfig.ConfigKeys.MAX_SESSION_IDLE_TIME)) {
            setConfig(GlobalConfig.ConfigKeys.MAX_SESSION_IDLE_TIME, "3600");
        }

        if (!configExists(GlobalConfig.ConfigKeys.TOKEN_ERROR_THRESHOLD)) {
            setConfig(GlobalConfig.ConfigKeys.TOKEN_ERROR_THRESHOLD, "3");
        }

        if (!configExists(GlobalConfig.ConfigKeys.TOKEN_COOLDOWN_PERIOD)) {
            setConfig(GlobalConfig.ConfigKeys.TOKEN_COOLDOWN_PERIOD, "60");
        }

        log.info("默认配置初始化完成");
    }
}