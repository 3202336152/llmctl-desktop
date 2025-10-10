package com.llmctl.service.impl;

import com.llmctl.service.ITokenEncryptionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Token加密服务实现类
 *
 * 使用AES-256-GCM算法提供认证加密，确保Token的机密性和完整性
 *
 * 安全特性：
 * - AES-256加密（美国政府最高级别标准）
 * - GCM模式提供认证加密（AEAD）
 * - 每个Token使用独立的随机IV
 * - 自动生成并安全存储主密钥
 *
 * @author Liu Yifan
 * @version 2.0.4
 * @since 2025-10-10
 */
@Slf4j
@Service
public class TokenEncryptionServiceImpl implements ITokenEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128; // bits
    private static final int GCM_IV_LENGTH = 12; // bytes (recommended for GCM)
    private static final int AES_KEY_SIZE = 256; // bits

    private static final String VERSION_PREFIX = "AES-256-GCM$v1$";

    private final SecretKey masterKey;

    /**
     * 构造函数：初始化主密钥
     * 密钥获取优先级：
     * 1. 环境变量 LLMCTL_MASTER_KEY
     * 2. 配置文件 ~/.llmctl/master.key
     * 3. 首次启动自动生成
     */
    public TokenEncryptionServiceImpl() {
        try {
            this.masterKey = loadOrGenerateMasterKey();
            log.info("Token加密服务初始化成功，使用AES-256-GCM算法");
        } catch (Exception e) {
            log.error("初始化加密服务失败", e);
            throw new RuntimeException("Failed to initialize encryption service", e);
        }
    }

    @Override
    public String encrypt(String plaintext) {
        try {
            // 1. 生成随机IV（每次不同，确保安全性）
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // 2. 配置GCM参数
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            // 3. 初始化加密器
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, masterKey, gcmSpec);

            // 4. 加密数据
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // 5. 组合结果：IV + 密文（包含GCM Tag）
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            // 6. Base64编码并添加版本前缀
            String encoded = Base64.getEncoder().encodeToString(byteBuffer.array());
            return VERSION_PREFIX + encoded;

        } catch (Exception e) {
            log.error("Token加密失败", e);
            throw new RuntimeException("Failed to encrypt token", e);
        }
    }

    @Override
    public String decrypt(String encrypted) {
        try {
            // 1. 检查是否为加密数据
            if (!encrypted.startsWith(VERSION_PREFIX)) {
                // 兼容旧数据：假设是明文（用于数据迁移）
                log.warn("检测到未加密的Token，建议尽快执行数据迁移");
                return encrypted;
            }

            // 2. 移除版本前缀
            String encodedData = encrypted.substring(VERSION_PREFIX.length());
            byte[] decoded = Base64.getDecoder().decode(encodedData);

            // 3. 提取IV和密文
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            // 4. 配置GCM参数
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            // 5. 初始化解密器
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, masterKey, gcmSpec);

            // 6. 解密并返回
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Token解密失败", e);
            throw new RuntimeException("Failed to decrypt token", e);
        }
    }

    @Override
    public boolean isEncrypted(String value) {
        return value != null && value.startsWith(VERSION_PREFIX);
    }

    /**
     * 加载或生成主密钥
     *
     * 优先级：
     * 1. 环境变量 LLMCTL_MASTER_KEY
     * 2. 配置文件 ~/.llmctl/master.key
     * 3. 首次启动自动生成
     */
    private SecretKey loadOrGenerateMasterKey() throws Exception {
        // 1. 尝试从环境变量读取
        String envKey = System.getenv("LLMCTL_MASTER_KEY");
        if (envKey != null && !envKey.isEmpty()) {
            log.info("从环境变量 LLMCTL_MASTER_KEY 加载主密钥");
            byte[] keyBytes = Base64.getDecoder().decode(envKey);
            return new SecretKeySpec(keyBytes, "AES");
        }

        // 2. 尝试从配置文件读取
        Path keyFilePath = getKeyFilePath();
        if (Files.exists(keyFilePath)) {
            log.info("从配置文件加载主密钥: {}", keyFilePath);
            String keyString = Files.readString(keyFilePath, StandardCharsets.UTF_8).trim();
            byte[] keyBytes = Base64.getDecoder().decode(keyString);
            return new SecretKeySpec(keyBytes, "AES");
        }

        // 3. 首次启动：生成新密钥并保存
        log.info("首次启动，生成新的主密钥");
        SecretKey newKey = generateMasterKey();
        saveMasterKey(newKey, keyFilePath);
        return newKey;
    }

    /**
     * 生成256位AES密钥
     */
    private SecretKey generateMasterKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(AES_KEY_SIZE, new SecureRandom());
        return keyGen.generateKey();
    }

    /**
     * 保存主密钥到配置文件
     */
    private void saveMasterKey(SecretKey key, Path keyFilePath) throws Exception {
        // 创建目录
        Files.createDirectories(keyFilePath.getParent());

        // Base64编码密钥
        String encoded = Base64.getEncoder().encodeToString(key.getEncoded());

        // 写入文件
        Files.writeString(keyFilePath, encoded, StandardCharsets.UTF_8);

        log.info("主密钥已保存到: {}", keyFilePath);
        log.warn("请妥善保管主密钥文件，丢失将无法解密已有Token！");
        log.info("推荐：设置环境变量 LLMCTL_MASTER_KEY={} 以便备份和多机器同步", encoded);
    }

    /**
     * 获取密钥文件路径
     */
    private Path getKeyFilePath() {
        String userHome = System.getProperty("user.home");
        return Paths.get(userHome, ".llmctl", "master.key");
    }
}
