# Jasypt 加密配置与 AES-256-GCM 加密算法使用指南

## 一、概述

在 LLMctl 项目中，我们使用了两种不同的加密方案来保护不同类型的敏感数据：

### 1.1 加密方案对比

| 特性 | Jasypt (PBEWithMD5AndDES) | AES-256-GCM |
|------|---------------------------|-------------|
| **用途** | 配置文件敏感信息加密 | Token值运行时加密存储 |
| **加密对象** | application.yml中的密码等 | 数据库中的API Token |
| **加密时机** | 部署前手动加密 | 运行时自动加密 |
| **密钥管理** | 环境变量传入 | 文件/环境变量存储 |
| **安全级别** | 中等（DES算法） | 高（AES-256） |
| **认证** | 无 | AEAD认证加密 |
| **适用场景** | 静态配置保护 | 动态数据保护 |

### 1.2 为什么需要两种加密方案？

**Jasypt** 用于保护配置文件：
- ✅ 数据库密码、第三方API密钥等静态配置
- ✅ 防止配置文件泄露导致敏感信息暴露
- ✅ 适合部署前加密、运行时解密的场景

**AES-256-GCM** 用于保护动态数据：
- ✅ 用户输入的LLM Provider Token
- ✅ 需要频繁加解密的动态数据
- ✅ 需要认证和完整性保护的场景
- ✅ 符合现代安全标准（NSA绝密信息级）

---

## 二、Jasypt 加密配置说明

### 2.1 Spring Boot 集成步骤

#### Step 1: 添加 Maven 依赖

```xml
<dependency>
    <groupId>com.github.ulisesbocchio</groupId>
    <artifactId>jasypt-spring-boot-starter</artifactId>
    <version>3.0.5</version>
</dependency>
```

#### Step 2: 配置 application.yml

```yaml
# Jasypt加密配置
jasypt:
  encryptor:
    password: ${JASYPT_PASSWORD}           # 从环境变量读取密钥
    algorithm: PBEWithMD5AndDES           # 加密算法
    iv-generator-classname: org.jasypt.iv.NoIvGenerator  # 不使用IV
```

#### Step 3: 设置环境变量

**Windows (PowerShell):**
```powershell
$env:JASYPT_PASSWORD="your_secret_password_here"
```

**Linux/macOS (Bash):**
```bash
export JASYPT_PASSWORD="your_secret_password_here"
```

**IDEA/Eclipse 运行配置:**
- 在 Run Configuration 的 Environment Variables 中添加：
  ```
  JASYPT_PASSWORD=your_secret_password_here
  ```

#### Step 4: 使用加密值

在 `application.yml` 中使用 `ENC()` 包裹加密后的值：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/llmctl
    username: huanyu
    password: ENC(P4JtACctTK7jRQERpp3ODF31VeH080Ak)  # 加密后的密码
```

### 2.2 命令行加密与解密示例

#### 方法一：使用 Jasypt CLI 工具

**下载 Jasypt CLI:**
```bash
wget https://github.com/jasypt/jasypt/releases/download/jasypt-1.9.3/jasypt-1.9.3-dist.zip
unzip jasypt-1.9.3-dist.zip
cd jasypt-1.9.3/bin
```

**加密明文:**
```bash
# Linux/macOS
./encrypt.sh input="mySecretPassword" password="your_secret_password_here" algorithm=PBEWithMD5AndDES

# Windows
encrypt.bat input="mySecretPassword" password="your_secret_password_here" algorithm=PBEWithMD5AndDES
```

**输出示例:**
```
----ENVIRONMENT-----------------
Runtime: Oracle Corporation OpenJDK 64-Bit Server VM 11.0.12+7

----ARGUMENTS-------------------
input: mySecretPassword
password: your_secret_password_here
algorithm: PBEWithMD5AndDES

----OUTPUT----------------------
P4JtACctTK7jRQERpp3ODF31VeH080Ak
```

**解密密文:**
```bash
./decrypt.sh input="P4JtACctTK7jRQERpp3ODF31VeH080Ak" password="your_secret_password_here" algorithm=PBEWithMD5AndDES
```

#### 方法二：使用 Maven 插件

**添加插件到 pom.xml:**
```xml
<plugin>
    <groupId>com.github.ulisesbocchio</groupId>
    <artifactId>jasypt-maven-plugin</artifactId>
    <version>3.0.5</version>
</plugin>
```

**加密命令:**
```bash
mvn jasypt:encrypt-value \
  -Djasypt.encryptor.password="your_secret_password_here" \
  -Djasypt.plugin.value="mySecretPassword" \
  -Djasypt.encryptor.algorithm="PBEWithMD5AndDES"
```

**解密命令:**
```bash
mvn jasypt:decrypt-value \
  -Djasypt.encryptor.password="your_secret_password_here" \
  -Djasypt.plugin.value="P4JtACctTK7jRQERpp3ODF31VeH080Ak" \
  -Djasypt.encryptor.algorithm="PBEWithMD5AndDES"
```

#### 方法三：Java 代码加密（最灵活）

```java
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.iv.NoIvGenerator;

public class JasyptEncryptorUtil {

    public static void main(String[] args) {
        String password = "your_secret_password_here";  // 主密钥
        String plaintext = "mySecretPassword";          // 要加密的明文

        // 创建加密器
        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        encryptor.setPassword(password);
        encryptor.setAlgorithm("PBEWithMD5AndDES");
        encryptor.setIvGenerator(new NoIvGenerator());

        // 加密
        String encrypted = encryptor.encrypt(plaintext);
        System.out.println("加密结果: " + encrypted);

        // 解密
        String decrypted = encryptor.decrypt(encrypted);
        System.out.println("解密结果: " + decrypted);
    }
}
```

**输出:**
```
加密结果: P4JtACctTK7jRQERpp3ODF31VeH080Ak
解密结果: mySecretPassword
```

### 2.3 常见问题与最佳实践

#### Q1: 为什么启动应用时报 "Failed to decrypt" 错误？

**原因:** 环境变量 `JASYPT_PASSWORD` 未设置或值不正确。

**解决:**
```bash
# 检查环境变量是否设置
echo $JASYPT_PASSWORD    # Linux/macOS
echo %JASYPT_PASSWORD%   # Windows CMD
echo $env:JASYPT_PASSWORD  # Windows PowerShell

# 如果未设置，重新设置
export JASYPT_PASSWORD="your_secret_password_here"
```

#### Q2: 每次加密同一个值，结果都不一样？

**原因:** Jasypt 使用了随机盐值（Salt），这是安全特性，不是Bug。

**说明:**
- 同一个明文每次加密会得到不同密文（因为盐值随机）
- 但所有这些不同的密文都能正确解密回原始明文
- 这提高了安全性，防止彩虹表攻击

```java
// 示例
String plaintext = "password123";
String encrypted1 = encryptor.encrypt(plaintext);  // 输出: ABC123...
String encrypted2 = encryptor.encrypt(plaintext);  // 输出: XYZ789...（不同！）

// 但两者都能解密
encryptor.decrypt(encrypted1);  // 输出: password123
encryptor.decrypt(encrypted2);  // 输出: password123
```

#### Q3: 如何在生产环境中安全管理 JASYPT_PASSWORD？

**最佳实践:**

1. **绝对不要**把 `JASYPT_PASSWORD` 硬编码在代码或配置文件中
2. **生产环境推荐方案**:
   - 使用 Kubernetes Secrets
   - 使用 AWS Secrets Manager / Azure Key Vault
   - 使用 HashiCorp Vault
   - 容器化部署时通过环境变量注入

**Kubernetes 示例:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: llmctl-secrets
type: Opaque
data:
  jasypt-password: eW91cl9zZWNyZXRfcGFzc3dvcmRfaGVyZQ==  # base64编码

---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: llmctl
        env:
        - name: JASYPT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: llmctl-secrets
              key: jasypt-password
```

**Docker Compose 示例:**
```yaml
version: '3.8'
services:
  llmctl:
    image: llmctl:latest
    environment:
      - JASYPT_PASSWORD=${JASYPT_PASSWORD}  # 从宿主机环境变量读取
    env_file:
      - .env.production  # 或从文件读取（但不要提交到Git）
```

#### Q4: PBEWithMD5AndDES 算法安全性如何？

**安全性分析:**

| 特性 | 评价 | 说明 |
|------|------|------|
| **加密强度** | ⚠️ 中等 | DES使用56位密钥，现代标准偏弱 |
| **适用场景** | ✅ 配置文件 | 适合静态配置保护，不适合高敏感数据 |
| **破解难度** | ⚠️ 可暴力破解 | 对于国家级攻击者可破解 |
| **推荐程度** | ✅ 可用 | 对于普通项目足够，高安全要求建议升级 |

**升级到更安全的算法（可选）:**

```yaml
jasypt:
  encryptor:
    password: ${JASYPT_PASSWORD}
    algorithm: PBEWITHHMACSHA512ANDAES_256  # 更安全的算法
    iv-generator-classname: org.jasypt.salt.RandomSaltGenerator
    key-obtention-iterations: 1000  # 增加迭代次数
```

⚠️ **注意:** 升级算法后需要重新加密所有配置值！

---

## 三、AES-256-GCM 加密算法

### 3.1 算法原理

#### GCM 模式简介

**GCM (Galois/Counter Mode)** 是一种认证加密模式：

```
┌─────────────────────────────────────────────────────┐
│           AES-256-GCM 加密流程                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  明文 (Plaintext)                                   │
│    ↓                                                │
│  [ 密钥 (256-bit Key) ] + [ IV/Nonce (96-bit) ]    │
│    ↓                                                │
│  AES-256 加密 (Counter Mode)                        │
│    ↓                                                │
│  密文 (Ciphertext)                                  │
│    ↓                                                │
│  GMAC 认证计算                                       │
│    ↓                                                │
│  认证标签 (Auth Tag, 128-bit)                       │
│    ↓                                                │
│  最终输出: Ciphertext + Tag                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**核心组件:**

1. **密钥 (Key)**: 256位（32字节）随机密钥
   - 使用 `SecureRandom` 生成
   - Base64编码后存储在文件或环境变量中

2. **IV/Nonce**: 12字节（96位）初始化向量
   - 每次加密都必须使用新的随机IV
   - ⚠️ **绝对不能重复使用相同的IV**
   - 与密文一起存储（明文形式）

3. **认证标签 (Tag)**: 128位
   - 用于验证密文完整性
   - 防止密文被篡改
   - 解密时自动验证

#### 为什么选择 AES-256-GCM？

| 优势 | 说明 |
|------|------|
| 🔒 **最高安全级别** | NSA批准用于绝密信息（TOP SECRET） |
| ✅ **认证加密 (AEAD)** | 同时保证机密性和完整性 |
| 🛡️ **防篡改** | GCM Tag验证，任何修改都会被检测 |
| ⚡ **硬件加速** | 现代CPU支持AES-NI指令集，性能优秀 |
| 🌐 **行业标准** | TLS 1.3、HTTPS、VPN等广泛使用 |

### 3.2 Java 代码示例

#### 完整的加密服务实现

```java
package com.llmctl.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Service
public class TokenEncryptionServiceImpl implements ITokenEncryptionService {

    // AES-GCM 常量
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;      // 128位认证标签
    private static final int GCM_IV_LENGTH = 12;        // 96位IV（12字节）
    private static final int AES_KEY_SIZE = 256;        // 256位密钥
    private static final String VERSION_PREFIX = "AES-256-GCM$v1$";

    private final SecretKey masterKey;

    public TokenEncryptionServiceImpl() {
        this.masterKey = loadOrGenerateMasterKey();
    }

    /**
     * 加密Token值
     *
     * @param plaintext 明文Token
     * @return 加密后的Token，格式: AES-256-GCM$v1$<IV>$<密文+Tag>
     */
    @Override
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            throw new IllegalArgumentException("明文不能为空");
        }

        try {
            // 1. 生成随机IV（每次加密都不同）
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // 2. 配置GCM参数
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            // 3. 初始化加密器
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, masterKey, gcmSpec);

            // 4. 执行加密（输出包含密文+Tag）
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes("UTF-8"));

            // 5. 组装最终格式: 版本前缀$IV$密文+Tag
            String ivBase64 = Base64.getEncoder().encodeToString(iv);
            String ciphertextBase64 = Base64.getEncoder().encodeToString(ciphertext);

            String encrypted = VERSION_PREFIX + ivBase64 + "$" + ciphertextBase64;

            log.debug("Token加密成功，长度: {}", encrypted.length());
            return encrypted;

        } catch (Exception e) {
            log.error("Token加密失败", e);
            throw new RuntimeException("Token加密失败: " + e.getMessage(), e);
        }
    }

    /**
     * 解密Token值
     *
     * @param encrypted 加密的Token或明文Token
     * @return 解密后的明文
     */
    @Override
    public String decrypt(String encrypted) {
        if (encrypted == null || encrypted.isEmpty()) {
            throw new IllegalArgumentException("加密值不能为空");
        }

        // 兼容明文Token（用于渐进式迁移）
        if (!isEncrypted(encrypted)) {
            log.debug("检测到明文Token，直接返回");
            return encrypted;
        }

        try {
            // 1. 解析加密格式: AES-256-GCM$v1$<IV>$<密文+Tag>
            String withoutPrefix = encrypted.substring(VERSION_PREFIX.length());
            String[] parts = withoutPrefix.split("\\$");

            if (parts.length != 2) {
                throw new IllegalArgumentException("加密Token格式错误");
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] ciphertext = Base64.getDecoder().decode(parts[1]);

            // 2. 配置GCM参数
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            // 3. 初始化解密器
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, masterKey, gcmSpec);

            // 4. 执行解密（自动验证Tag）
            byte[] plaintext = cipher.doFinal(ciphertext);

            String decrypted = new String(plaintext, "UTF-8");
            log.debug("Token解密成功");
            return decrypted;

        } catch (javax.crypto.AEADBadTagException e) {
            log.error("Token解密失败：认证标签验证失败（密文可能被篡改）", e);
            throw new RuntimeException("Token验证失败，数据可能已损坏或被篡改", e);
        } catch (Exception e) {
            log.error("Token解密失败", e);
            throw new RuntimeException("Token解密失败: " + e.getMessage(), e);
        }
    }

    /**
     * 检查Token是否已加密
     */
    @Override
    public boolean isEncrypted(String value) {
        return value != null && value.startsWith(VERSION_PREFIX);
    }

    /**
     * 加载或生成主密钥
     * 优先级：环境变量 → 配置文件 → 自动生成
     */
    private SecretKey loadOrGenerateMasterKey() {
        try {
            // 1. 尝试从环境变量读取
            String envKey = System.getenv("LLMCTL_MASTER_KEY");
            if (envKey != null && !envKey.isEmpty()) {
                log.info("从环境变量 LLMCTL_MASTER_KEY 加载主密钥");
                byte[] keyBytes = Base64.getDecoder().decode(envKey);
                return new SecretKeySpec(keyBytes, "AES");
            }

            // 2. 尝试从配置文件读取
            Path keyFile = Paths.get(System.getProperty("user.home"), ".llmctl", "master.key");
            if (Files.exists(keyFile)) {
                log.info("从配置文件加载主密钥: {}", keyFile);
                String fileKey = Files.readString(keyFile).trim();
                byte[] keyBytes = Base64.getDecoder().decode(fileKey);
                return new SecretKeySpec(keyBytes, "AES");
            }

            // 3. 自动生成新密钥
            log.warn("未找到主密钥，自动生成新密钥并保存到: {}", keyFile);

            KeyGenerator keyGen = KeyGenerator.getInstance("AES");
            keyGen.init(AES_KEY_SIZE, new SecureRandom());
            SecretKey newKey = keyGen.generateKey();

            // 保存到文件
            Files.createDirectories(keyFile.getParent());
            String keyBase64 = Base64.getEncoder().encodeToString(newKey.getEncoded());
            Files.writeString(keyFile, keyBase64);

            // 设置文件权限（仅所有者可读写）
            try {
                Files.setPosixFilePermissions(keyFile,
                    java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
            } catch (UnsupportedOperationException e) {
                // Windows系统不支持POSIX权限，忽略
            }

            log.info("主密钥已生成并保存");
            return newKey;

        } catch (Exception e) {
            throw new RuntimeException("无法加载主密钥", e);
        }
    }
}
```

#### 密钥生成工具类

```java
package com.llmctl.utils;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256 密钥生成工具
 */
public class AESKeyGenerator {

    public static void main(String[] args) throws Exception {
        // 生成256位AES密钥
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256, new SecureRandom());
        SecretKey secretKey = keyGen.generateKey();

        // Base64编码（便于存储）
        String keyBase64 = Base64.getEncoder().encodeToString(secretKey.getEncoded());

        System.out.println("=== AES-256 密钥生成成功 ===");
        System.out.println("Base64编码: " + keyBase64);
        System.out.println("密钥长度: " + secretKey.getEncoded().length + " bytes (" +
                          (secretKey.getEncoded().length * 8) + " bits)");
        System.out.println("\n使用方法:");
        System.out.println("1. 保存到文件: ~/.llmctl/master.key");
        System.out.println("2. 或设置环境变量: export LLMCTL_MASTER_KEY=\"" + keyBase64 + "\"");
    }
}
```

**输出示例:**
```
=== AES-256 密钥生成成功 ===
Base64编码: 5K8vYmZ3N9tP2xQrL4kJ8aF6hW1dC7eB9mN0oU5pV2s=
密钥长度: 32 bytes (256 bits)

使用方法:
1. 保存到文件: ~/.llmctl/master.key
2. 或设置环境变量: export LLMCTL_MASTER_KEY="5K8vYmZ3N9tP2xQrL4kJ8aF6hW1dC7eB9mN0oU5pV2s="
```

### 3.3 常见安全注意事项

#### ⚠️ 关键安全规则

| 规则 | 说明 | 后果 |
|------|------|------|
| **绝不重复使用IV** | 每次加密必须生成新的随机IV | 重复使用会完全破坏GCM安全性 |
| **妥善保管主密钥** | 密钥丢失=数据永久无法解密 | 必须备份密钥 |
| **验证Tag失败=拒绝** | Tag验证失败绝不使用数据 | 防止使用被篡改的数据 |
| **使用SecureRandom** | 不要使用Math.random()生成IV | 会导致可预测的IV |
| **密钥长度必须256位** | 不要使用128位密钥 | 降低安全性 |

#### 示例：正确vs错误的IV使用

**❌ 错误示例（绝对不要这样做）:**
```java
// 错误1: 使用固定IV
byte[] iv = new byte[12];
Arrays.fill(iv, (byte)0);  // 全是0 - 极度危险！

// 错误2: 使用Math.random()
byte[] iv = new byte[12];
new Random().nextBytes(iv);  // 不安全的随机数
```

**✅ 正确示例:**
```java
// 正确: 使用SecureRandom生成随机IV
byte[] iv = new byte[12];
SecureRandom secureRandom = new SecureRandom();
secureRandom.nextBytes(iv);  // 密码学安全的随机数
```

#### IV重复使用的危害示例

```java
// 危险场景演示（仅用于说明，不要在生产环境使用）
SecretKey key = ...; // 假设有一个固定密钥
byte[] fixedIV = new byte[12]; // 危险：固定IV

// 加密两个不同的Token
String token1 = "sk-ant-api03-abc123...";
String token2 = "sk-ant-api03-xyz789...";

byte[] ciphertext1 = encrypt(token1, key, fixedIV);
byte[] ciphertext2 = encrypt(token2, key, fixedIV);  // 使用相同IV！

// 攻击者可以：
// 1. 通过 ciphertext1 XOR ciphertext2 获取 token1 XOR token2
// 2. 如果知道token1的格式，可以推导出token2的部分内容
// 3. 完全破坏GCM的认证安全性
```

#### 主密钥管理最佳实践

**生产环境密钥管理方案:**

```bash
# 方案1: 使用专业密钥管理服务（推荐）
# AWS KMS
aws kms create-key --description "LLMctl Master Key"
aws kms encrypt --key-id <key-id> --plaintext fileb://master.key

# 方案2: 使用环境变量（适合容器化部署）
# Kubernetes Secret
kubectl create secret generic llmctl-master-key \
  --from-literal=LLMCTL_MASTER_KEY="$(cat ~/.llmctl/master.key)"

# 方案3: 使用配置中心
# Nacos/Apollo/Consul 等配置中心加密存储
```

**密钥备份策略:**

1. **多地备份**: 至少3份备份，存储在不同物理位置
2. **加密备份**: 备份文件本身也应该加密
3. **访问控制**: 限制只有运维人员可访问
4. **定期轮换**: 每6-12个月更换一次主密钥（需要重新加密所有Token）

**密钥轮换流程:**

```java
/**
 * 密钥轮换工具
 * 警告：密钥轮换会重新加密所有Token，需要在维护窗口执行
 */
@Service
public class KeyRotationService {

    @Transactional
    public void rotateKey(SecretKey oldKey, SecretKey newKey) {
        log.info("开始密钥轮换，预计需要几分钟...");

        // 1. 获取所有加密的Token
        List<Token> tokens = tokenMapper.findAllEncryptedTokens();
        log.info("找到 {} 个需要重新加密的Token", tokens.size());

        int successCount = 0;
        int failCount = 0;

        for (Token token : tokens) {
            try {
                // 2. 使用旧密钥解密
                String plaintext = decryptWithKey(token.getValue(), oldKey);

                // 3. 使用新密钥加密
                String newEncrypted = encryptWithKey(plaintext, newKey);

                // 4. 更新数据库
                token.setValue(newEncrypted);
                tokenMapper.updateById(token);

                successCount++;
            } catch (Exception e) {
                log.error("Token {} 重新加密失败", token.getId(), e);
                failCount++;
            }
        }

        log.info("密钥轮换完成：成功 {}, 失败 {}", successCount, failCount);

        if (failCount > 0) {
            throw new RuntimeException("密钥轮换未完全成功，请检查日志");
        }
    }
}
```

---

## 四、Jasypt 与 AES-256-GCM 的结合使用场景

### 4.1 在 Spring 项目中混合使用方案

#### 架构设计

```
┌──────────────────────────────────────────────────────────┐
│                     LLMctl 应用                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐         ┌─────────────────┐       │
│  │ application.yml │         │  数据库 (MySQL)  │       │
│  │                 │         │                 │       │
│  │ datasource:     │         │  tokens表:      │       │
│  │   password:     │         │   id: 1         │       │
│  │   ENC(abc...)   │         │   value: AES... │       │
│  └────────┬────────┘         └────────┬────────┘       │
│           │                           │                 │
│           │ Jasypt解密               │ AES-GCM解密     │
│           │                           │                 │
│  ┌────────▼──────────────────────────▼────────┐       │
│  │     Spring Boot 应用运行时                  │       │
│  │                                             │       │
│  │  • 启动时：Jasypt解密配置文件              │       │
│  │  • 运行时：AES-256-GCM加解密Token         │       │
│  └─────────────────────────────────────────────┘       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 配置示例

**application.yml:**
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/llmctl
    username: llmctl
    password: ENC(P4JtACctTK7jRQERpp3ODF31VeH080Ak)  # Jasypt加密

  # Redis密码（如果使用）
  redis:
    password: ENC(aB3xY9zM2nQ5tR8wK1jF4hL7dC6eP0uV)  # Jasypt加密

# Jasypt配置
jasypt:
  encryptor:
    password: ${JASYPT_PASSWORD}
    algorithm: PBEWithMD5AndDES
```

**启动参数:**
```bash
# 设置两个独立的加密密钥
export JASYPT_PASSWORD="jasypt_secret_key_2024"         # 用于配置文件
export LLMCTL_MASTER_KEY="5K8vYmZ3N9tP2xQrL4kJ8a..."    # 用于Token加密

# 启动应用
java -jar llmctl.jar
```

### 4.2 适用场景与限制说明

#### 场景对比表

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| **数据库密码** | Jasypt | 静态配置，启动时解密一次即可 |
| **Redis密码** | Jasypt | 同上 |
| **第三方API密钥** | Jasypt | 配置文件中的固定值 |
| **用户输入的Token** | AES-256-GCM | 需要频繁加解密，需要AEAD保护 |
| **敏感用户数据** | AES-256-GCM | 数据库存储，需要完整性验证 |
| **JWT Secret** | Jasypt | 应用级配置，不需要频繁变更 |
| **加密密钥本身** | 环境变量/KMS | 绝不存储在配置文件或数据库 |

#### 使用限制

**Jasypt 的限制:**

- ❌ 不适合高频加解密场景（性能较低）
- ❌ 不提供认证功能（无法检测篡改）
- ❌ DES算法安全性不如AES-256
- ✅ 适合配置文件静态数据保护
- ✅ Spring Boot集成简单

**AES-256-GCM 的限制:**

- ❌ 需要自己管理IV（增加存储开销）
- ❌ IV绝不能重复（需要严格控制）
- ❌ 需要额外代码实现（不像Jasypt开箱即用）
- ✅ 高性能，支持硬件加速
- ✅ 提供认证和完整性保护
- ✅ 符合现代加密标准

#### 混合使用示例

```java
@Service
public class SecurityService {

    @Autowired
    private Environment env;  // Jasypt自动解密配置

    @Autowired
    private ITokenEncryptionService tokenEncryption;  // AES-256-GCM

    /**
     * 连接数据库（使用Jasypt解密的密码）
     */
    public void connectDatabase() {
        String dbPassword = env.getProperty("spring.datasource.password");
        // Jasypt已自动解密，这里是明文密码
        DataSource ds = createDataSource(dbPassword);
    }

    /**
     * 保存用户Token（使用AES-256-GCM加密）
     */
    public void saveUserToken(String providerId, String plainToken) {
        // 1. 加密Token
        String encrypted = tokenEncryption.encrypt(plainToken);

        // 2. 保存到数据库
        Token token = new Token();
        token.setProviderId(providerId);
        token.setValue(encrypted);  // 加密后的值
        token.setEncryptionVersion("v1");
        tokenMapper.insert(token);
    }

    /**
     * 读取用户Token（使用AES-256-GCM解密）
     */
    public String getUserToken(String tokenId) {
        Token token = tokenMapper.selectById(tokenId);

        // 解密Token
        return tokenEncryption.decrypt(token.getValue());
    }
}
```

---

## 五、总结与参考资料

### 5.1 关键要点总结

#### 密码学原则 (Cryptography Principles)

1. **永远不要自己实现加密算法** - 使用经过验证的库（Java Crypto API, Bouncy Castle等）
2. **密钥管理比算法选择更重要** - 再强的算法，密钥泄露也无济于事
3. **使用认证加密 (AEAD)** - GCM模式同时提供机密性和完整性
4. **随机数必须密码学安全** - 使用 `SecureRandom`，不是 `Random`
5. **IV/Nonce绝不重复** - 每次加密生成新的随机IV

#### 项目实践总结

**Jasypt 使用清单:**
- ✅ 加密 `application.yml` 中的数据库密码
- ✅ 加密 Redis、消息队列等中间件密码
- ✅ 加密第三方服务API密钥（固定配置）
- ✅ `JASYPT_PASSWORD` 通过环境变量传入
- ✅ 生产环境使用 Kubernetes Secrets 管理密钥
- ⚠️ 考虑升级到 `PBEWITHHMACSHA512ANDAES_256` 算法

**AES-256-GCM 使用清单:**
- ✅ 加密用户输入的LLM Provider Token
- ✅ 每个Token使用独立随机IV
- ✅ 存储格式: `AES-256-GCM$v1$<IV>$<密文+Tag>`
- ✅ 主密钥优先级: 环境变量 → 文件 → 自动生成
- ✅ 解密失败（Tag验证失败）= 拒绝使用数据
- ✅ 定期备份主密钥文件 `~/.llmctl/master.key`
- ⚠️ 每6-12个月轮换主密钥

### 5.2 参考资料

#### 官方文档

- [Java Cryptography Architecture (JCA)](https://docs.oracle.com/en/java/javase/11/security/java-cryptography-architecture-jca-reference-guide.html)
- [Jasypt Official Guide](http://www.jasypt.org/howtoencryptuserpasswords.html)
- [NIST SP 800-38D: GCM Mode](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [Spring Boot Jasypt Integration](https://github.com/ulisesbocchio/jasypt-spring-boot)

#### 最佳实践

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Google Tink - 推荐的加密库](https://github.com/google/tink)
- [How to Encrypt and Decrypt Data in Java](https://www.baeldung.com/java-aes-encryption-decryption)

#### 安全标准

- FIPS 140-2: 美国联邦信息处理标准
- NIST SP 800-175B: 密钥管理指南
- PCI DSS: 支付卡行业数据安全标准

#### 推荐阅读

- 《Applied Cryptography》 - Bruce Schneier
- 《Cryptography Engineering》 - Niels Ferguson
- [cryptopals.com](https://cryptopals.com/) - 加密学挑战练习

### 5.3 常见问题速查

| 问题 | 答案 |
|------|------|
| Jasypt 和 AES-GCM 能同时使用吗？ | ✅ 可以，用于不同场景 |
| 密钥丢失了怎么办？ | ❌ 数据永久无法恢复，必须备份密钥 |
| 可以在前端加密Token吗？ | ⚠️ 不推荐，前端密钥无法安全存储 |
| AES-128 够用吗？ | ⚠️ 建议使用AES-256，成本相近但更安全 |
| 如何检测密文是否被篡改？ | ✅ GCM模式自动验证，Tag失败=拒绝 |
| IV可以公开吗？ | ✅ 可以，IV是公开的，但绝不能重复 |
| 需要加盐 (Salt) 吗？ | ⚠️ GCM不需要，Jasypt的PBE自动加盐 |
| 多机器部署如何共享密钥？ | ✅ 使用KMS或配置中心集中管理 |

---

## 附录：快速参考卡片

### Jasypt 命令速查

```bash
# 加密
mvn jasypt:encrypt-value -Djasypt.encryptor.password="SECRET" -Djasypt.plugin.value="myPassword"

# 解密
mvn jasypt:decrypt-value -Djasypt.encryptor.password="SECRET" -Djasypt.plugin.value="ENC(...)"

# 加密整个配置文件
mvn jasypt:encrypt -Djasypt.encryptor.password="SECRET" -Djasypt.plugin.path="file:src/main/resources/application.yml"
```

### AES-256-GCM 代码片段

```java
// 加密
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);
GCMParameterSpec spec = new GCMParameterSpec(128, iv);
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.ENCRYPT_MODE, key, spec);
byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

// 解密
GCMParameterSpec spec = new GCMParameterSpec(128, iv);
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.DECRYPT_MODE, key, spec);
byte[] plaintext = cipher.doFinal(ciphertext);
```

### 安全检查清单 ✅

- [ ] 使用 `SecureRandom` 生成IV
- [ ] 每次加密都生成新的IV
- [ ] 主密钥已备份到安全位置
- [ ] 环境变量中的密钥值已设置
- [ ] 生产环境使用KMS或Secrets Manager
- [ ] Tag验证失败时拒绝使用数据
- [ ] 日志中不输出明文密钥或Token
- [ ] 定期轮换加密密钥（6-12个月）

---

**文档版本**: v1.0
**最后更新**: 2025-10-10
**作者**: LLMctl Development Team
**许可证**: MIT License

如有疑问或发现错误，请在 [GitHub Issues](https://github.com/3202336152/llmctl-desktop/issues) 反馈。
