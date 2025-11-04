package com.llmctl.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis 配置类
 * 配置 RedisTemplate、序列化策略和缓存管理器
 *
 * 序列化策略说明：
 * - Key: 使用 StringRedisSerializer，存储为可读字符串
 * - Value: 使用 Jackson2JsonRedisSerializer，存储为 JSON 格式
 * - Hash Key: 使用 StringRedisSerializer
 * - Hash Value: 使用 Jackson2JsonRedisSerializer
 *
 * 缓存策略说明（企业级优化）：
 * - provider:tokens - 5分钟 TTL，Token 列表缓存
 * - provider:config - 30分钟 TTL，Provider 配置缓存
 * - mcp:config - 15分钟 TTL，MCP 配置缓存
 *
 * @author Liu Yifan
 * @since 2025-01-24
 * @version 2.3.0
 */
@Configuration
@EnableCaching  // 启用 Spring Cache 注解支持
public class RedisConfig {

    /**
     * 配置 RedisTemplate<String, Object>
     * 适用于存储复杂对象的场景
     *
     * @param connectionFactory Redis连接工厂（Spring Boot 自动注入）
     * @return RedisTemplate<String, Object>
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 创建 ObjectMapper 并进行增强配置
        ObjectMapper mapper = new ObjectMapper();

        // 1. 设置可见性：所有字段都可以被序列化
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);

        // 2. 启用默认类型信息：支持多态类型反序列化
        mapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL
        );

        // 3. 支持 Java 8 时间类型（LocalDateTime, LocalDate 等）
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // 创建 JSON 序列化器（使用新的构造函数，避免废弃 API）
        Jackson2JsonRedisSerializer<Object> jsonSerializer =
            new Jackson2JsonRedisSerializer<>(mapper, Object.class);

        // 创建 String 序列化器
        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        // 设置各种序列化器
        template.setKeySerializer(stringSerializer);           // Key: String
        template.setHashKeySerializer(stringSerializer);       // Hash Key: String
        template.setValueSerializer(jsonSerializer);           // Value: JSON
        template.setHashValueSerializer(jsonSerializer);       // Hash Value: JSON

        // 初始化 RedisTemplate
        template.afterPropertiesSet();
        return template;
    }

    /**
     * 配置 StringRedisTemplate
     * 适用于简单字符串存储的场景（可选，Spring Boot 会自动配置）
     *
     * @param connectionFactory Redis连接工厂
     * @return StringRedisTemplate
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(connectionFactory);
        return template;
    }

    /**
     * 配置 RedisCacheManager（企业级缓存管理器）
     * 为不同的缓存空间设置不同的 TTL 策略
     *
     * @param connectionFactory Redis连接工厂
     * @return CacheManager
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 创建 ObjectMapper（与 RedisTemplate 保持一致）
        ObjectMapper mapper = new ObjectMapper();
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        mapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL
        );
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // 创建 JSON 序列化器
        Jackson2JsonRedisSerializer<Object> jsonSerializer =
            new Jackson2JsonRedisSerializer<>(mapper, Object.class);

        // 默认缓存配置：10分钟 TTL
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))  // 默认 TTL：10分钟
            .computePrefixWith(cacheName -> cacheName + ":")  // ✅ 修改分隔符：:: → :
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer)
            )
            .disableCachingNullValues();  // 不缓存 null 值

        // ✅ 为不同的缓存空间设置不同的 TTL（根据前端实际调用的接口配置）
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // 1. Provider 列表缓存：5分钟 TTL（前端主要调用 getAllProviders 获取列表）
        cacheConfigurations.put("provider:list",
            defaultConfig.entryTtl(Duration.ofMinutes(5))
        );

        // 2. Provider 配置缓存：30分钟 TTL（会话启动时调用，配置变更频率低）
        cacheConfigurations.put("provider:config",
            defaultConfig.entryTtl(Duration.ofMinutes(30))
        );

        // 3. Token 列表缓存：5分钟 TTL（前端主要调用 getTokensByProviderId 获取列表）
        cacheConfigurations.put("provider:tokens",
            defaultConfig.entryTtl(Duration.ofMinutes(5))
        );

        // 4. Token 可用列表缓存：15分钟 TTL（会话启动时调用，Token 状态变更频率中等）
        cacheConfigurations.put("token:available",
            defaultConfig.entryTtl(Duration.ofMinutes(15))
        );

        // 5. MCP 配置缓存：15分钟 TTL（会话启动时调用，中等频率）
        cacheConfigurations.put("mcp:config",
            defaultConfig.entryTtl(Duration.ofMinutes(15))
        );

        // 构建 RedisCacheManager
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)  // 默认配置
            .withInitialCacheConfigurations(cacheConfigurations)  // 自定义配置
            .transactionAware()  // 支持事务
            .build();
    }
}
