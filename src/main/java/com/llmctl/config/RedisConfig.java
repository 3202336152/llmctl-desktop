package com.llmctl.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 配置类
 * 配置 RedisTemplate 和序列化策略
 *
 * 序列化策略说明：
 * - Key: 使用 StringRedisSerializer，存储为可读字符串
 * - Value: 使用 Jackson2JsonRedisSerializer，存储为 JSON 格式
 * - Hash Key: 使用 StringRedisSerializer
 * - Hash Value: 使用 Jackson2JsonRedisSerializer
 *
 * @author Liu Yifan
 * @since 2025-01-24
 */
@Configuration
@EnableCaching  // 启用 Spring Cache 注解支持（可选）
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
}
