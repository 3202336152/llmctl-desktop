package com.llmctl.utils;

import java.util.UUID;

/**
 * ID生成工具类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
public class IdGenerator {

    /**
     * 生成Provider ID
     *
     * @return Provider ID (格式: provider_xxxxx)
     */
    public static String generateProviderId() {
        return "provider_" + generateShortId();
    }

    /**
     * 生成Token ID
     *
     * @return Token ID (格式: token_xxxxx)
     */
    public static String generateTokenId() {
        return "token_" + generateShortId();
    }

    /**
     * 生成Session ID
     *
     * @return Session ID (格式: session_xxxxx)
     */
    public static String generateSessionId() {
        return "session_" + generateShortId();
    }

    /**
     * 生成Template ID
     *
     * @return Template ID (格式: template_xxxxx)
     */
    public static String generateTemplateId() {
        return "template_" + generateShortId();
    }

    /**
     * 生成短ID
     *
     * @return 不带连字符的UUID字符串
     */
    public static String generateShortId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * 生成完整UUID
     *
     * @return 完整的UUID字符串
     */
    public static String generateUuid() {
        return UUID.randomUUID().toString();
    }

    /**
     * 生成指定长度的随机字符串
     *
     * @param length 字符串长度
     * @return 随机字符串
     */
    public static String generateRandomString(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }

        return sb.toString();
    }

    /**
     * 检查ID格式是否有效
     *
     * @param id ID字符串
     * @param prefix 预期前缀
     * @return true如果格式有效
     */
    public static boolean isValidId(String id, String prefix) {
        if (id == null || id.trim().isEmpty()) {
            return false;
        }

        if (!id.startsWith(prefix + "_")) {
            return false;
        }

        String uuidPart = id.substring(prefix.length() + 1);
        return uuidPart.length() == 32 && uuidPart.matches("[a-f0-9]+");
    }

    /**
     * 检查Provider ID格式是否有效
     *
     * @param providerId Provider ID
     * @return true如果格式有效
     */
    public static boolean isValidProviderId(String providerId) {
        return isValidId(providerId, "provider");
    }

    /**
     * 检查Token ID格式是否有效
     *
     * @param tokenId Token ID
     * @return true如果格式有效
     */
    public static boolean isValidTokenId(String tokenId) {
        return isValidId(tokenId, "token");
    }

    /**
     * 检查Session ID格式是否有效
     *
     * @param sessionId Session ID
     * @return true如果格式有效
     */
    public static boolean isValidSessionId(String sessionId) {
        return isValidId(sessionId, "session");
    }
}