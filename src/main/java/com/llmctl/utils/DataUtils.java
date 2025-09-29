package com.llmctl.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * 数据转换工具类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
public class DataUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 将对象转换为JSON字符串
     *
     * @param obj 要转换的对象
     * @return JSON字符串，转换失败时返回null
     */
    public static String toJson(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.error("对象转JSON失败: ", e);
            return null;
        }
    }

    /**
     * 将JSON字符串转换为对象
     *
     * @param json JSON字符串
     * @param clazz 目标类型
     * @param <T> 目标类型
     * @return 转换后的对象，转换失败时返回null
     */
    public static <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            log.error("JSON转对象失败: ", e);
            return null;
        }
    }

    /**
     * 将JSON字符串转换为Map
     *
     * @param json JSON字符串
     * @return Map对象，转换失败时返回null
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> jsonToMap(String json) {
        return fromJson(json, Map.class);
    }

    /**
     * 检查字符串是否为有效的JSON格式
     *
     * @param json 要检查的字符串
     * @return true如果是有效JSON
     */
    public static boolean isValidJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            return false;
        }

        try {
            objectMapper.readTree(json);
            return true;
        } catch (JsonProcessingException e) {
            return false;
        }
    }

    /**
     * 格式化LocalDateTime为字符串
     *
     * @param dateTime LocalDateTime对象
     * @return 格式化后的字符串
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DATE_TIME_FORMATTER);
    }

    /**
     * 解析日期时间字符串
     *
     * @param dateTimeStr 日期时间字符串
     * @return LocalDateTime对象
     */
    public static LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
            return null;
        }

        try {
            return LocalDateTime.parse(dateTimeStr, DATE_TIME_FORMATTER);
        } catch (Exception e) {
            log.error("日期时间解析失败: {}", dateTimeStr, e);
            return null;
        }
    }

    /**
     * 安全获取字符串值
     *
     * @param value 原始值
     * @param defaultValue 默认值
     * @return 字符串值
     */
    public static String safeString(String value, String defaultValue) {
        return value != null && !value.trim().isEmpty() ? value : defaultValue;
    }

    /**
     * 安全获取整数值
     *
     * @param value 原始值
     * @param defaultValue 默认值
     * @return 整数值
     */
    public static Integer safeInteger(Integer value, Integer defaultValue) {
        return value != null ? value : defaultValue;
    }

    /**
     * 安全获取布尔值
     *
     * @param value 原始值
     * @param defaultValue 默认值
     * @return 布尔值
     */
    public static Boolean safeBoolean(Boolean value, Boolean defaultValue) {
        return value != null ? value : defaultValue;
    }

    /**
     * 遮掩敏感信息（如Token）
     *
     * @param sensitive 敏感信息
     * @param prefixLength 保留前缀长度
     * @param suffixLength 保留后缀长度
     * @param maskChar 遮掩字符
     * @return 遮掩后的字符串
     */
    public static String maskSensitiveInfo(String sensitive, int prefixLength, int suffixLength, char maskChar) {
        if (sensitive == null || sensitive.length() <= prefixLength + suffixLength) {
            return "****";
        }

        String prefix = sensitive.substring(0, prefixLength);
        String suffix = sensitive.substring(sensitive.length() - suffixLength);
        int maskLength = sensitive.length() - prefixLength - suffixLength;

        StringBuilder sb = new StringBuilder();
        sb.append(prefix);
        for (int i = 0; i < maskLength; i++) {
            sb.append(maskChar);
        }
        sb.append(suffix);

        return sb.toString();
    }

    /**
     * 遮掩Token值（保留前4位和后4位）
     *
     * @param token Token值
     * @return 遮掩后的Token
     */
    public static String maskToken(String token) {
        return maskSensitiveInfo(token, 4, 4, '*');
    }

    /**
     * 检查字符串是否为空或仅包含空白字符
     *
     * @param str 要检查的字符串
     * @return true如果字符串为空或仅包含空白字符
     */
    public static boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * 检查字符串是否不为空且不仅包含空白字符
     *
     * @param str 要检查的字符串
     * @return true如果字符串不为空且不仅包含空白字符
     */
    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }

    /**
     * 获取对象的类型名称
     *
     * @param obj 对象
     * @return 类型名称
     */
    public static String getTypeName(Object obj) {
        return obj != null ? obj.getClass().getSimpleName() : "null";
    }

    /**
     * 安全的字符串比较（忽略大小写）
     *
     * @param str1 字符串1
     * @param str2 字符串2
     * @return true如果两个字符串相等（忽略大小写）
     */
    public static boolean equalsIgnoreCase(String str1, String str2) {
        if (str1 == null && str2 == null) {
            return true;
        }
        if (str1 == null || str2 == null) {
            return false;
        }
        return str1.equalsIgnoreCase(str2);
    }

    /**
     * 限制字符串长度
     *
     * @param str 原始字符串
     * @param maxLength 最大长度
     * @return 限制长度后的字符串
     */
    public static String limitLength(String str, int maxLength) {
        if (str == null) {
            return null;
        }
        if (str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - 3) + "...";
    }
}