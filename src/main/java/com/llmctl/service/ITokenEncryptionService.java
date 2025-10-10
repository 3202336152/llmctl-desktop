package com.llmctl.service;

/**
 * Token加密服务接口
 *
 * 提供Token值的加密和解密功能
 *
 * @author Liu Yifan
 * @version 2.0.4
 * @since 2025-10-10
 */
public interface ITokenEncryptionService {

    /**
     * 加密Token值
     *
     * @param plaintext 明文Token
     * @return 加密后的Token，格式：AES-256-GCM$v1$<base64(IV)>$<base64(密文+Tag)>
     * @throws RuntimeException 加密失败时抛出
     */
    String encrypt(String plaintext);

    /**
     * 解密Token值
     *
     * @param encrypted 加密的Token
     * @return 明文Token
     * @throws RuntimeException 解密失败时抛出
     */
    String decrypt(String encrypted);

    /**
     * 检查Token是否已加密
     *
     * @param value Token值
     * @return true表示已加密，false表示明文
     */
    boolean isEncrypted(String value);
}
