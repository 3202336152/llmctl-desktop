package com.llmctl.service.impl;

import com.llmctl.entity.Token;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.ITokenEncryptionService;
import com.llmctl.service.ITokenMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Token数据迁移服务实现类
 *
 * 负责将数据库中的明文Token迁移到加密存储
 *
 * @author Liu Yifan
 * @version 2.0.4
 * @since 2025-10-10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenMigrationServiceImpl implements ITokenMigrationService {

    private final TokenMapper tokenMapper;
    private final ITokenEncryptionService encryptionService;

    @Override
//    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void migrateTokensOnStartup() {
        log.info("======================================");
        log.info("🔐 开始检查Token数据迁移...");
        log.info("======================================");

        try {
            // 查询所有需要迁移的明文Token
            List<Token> plaintextTokens = tokenMapper.findPlaintextTokens();

            if (plaintextTokens == null || plaintextTokens.isEmpty()) {
                log.info("✅ 无需迁移，所有Token已加密存储");
                return;
            }

            log.warn("⚠️  发现 {} 个明文Token，开始加密迁移...", plaintextTokens.size());

            int successCount = 0;
            int failCount = 0;

            for (Token token : plaintextTokens) {
                try {
                    // 检查Token值是否已经加密
                    if (encryptionService.isEncrypted(token.getValue())) {
                        // 已加密，只需更新版本号
                        token.setEncryptionVersion("v1");
                    } else {
                        // 明文Token，需要加密
                        String plaintext = token.getValue();
                        String encrypted = encryptionService.encrypt(plaintext);

                        token.setValue(encrypted);
                        token.setEncryptionVersion("v1");

                        log.debug("  🔒 Token加密: {} (ID: {}...)",
                                token.getAlias(),
                                token.getId().substring(0, 8));
                    }

                    token.setUpdatedAt(LocalDateTime.now());

                    // 更新到数据库
                    int result = tokenMapper.update(token);
                    if (result > 0) {
                        successCount++;
                    } else {
                        failCount++;
                        log.error("  ❌ Token更新失败: {} (ID: {})", token.getAlias(), token.getId());
                    }

                } catch (Exception e) {
                    failCount++;
                    log.error("  ❌ Token迁移失败: {} (ID: {}) - {}",
                            token.getAlias(), token.getId(), e.getMessage());
                }
            }

            log.info("======================================");
            log.info("✅ Token数据迁移完成！");
            log.info("  - 总计: {} 个Token", plaintextTokens.size());
            log.info("  - 成功: {} 个", successCount);
            log.info("  - 失败: {} 个", failCount);
            log.info("======================================");

            if (failCount > 0) {
                log.warn("⚠️  部分Token迁移失败，请检查日志并手动处理");
            }

        } catch (Exception e) {
            log.error("❌ Token数据迁移过程中发生异常", e);
            throw new RuntimeException("Token数据迁移失败", e);
        }
    }

    @Override
    @Transactional
    public MigrationResult migrateTokensManually() {
        log.info("手动触发Token数据迁移");

        List<Token> plaintextTokens = tokenMapper.findPlaintextTokens();

        if (plaintextTokens == null || plaintextTokens.isEmpty()) {
            return new MigrationResult(0, 0, 0);
        }

        int successCount = 0;
        int failCount = 0;

        for (Token token : plaintextTokens) {
            try {
                if (!encryptionService.isEncrypted(token.getValue())) {
                    String encrypted = encryptionService.encrypt(token.getValue());
                    token.setValue(encrypted);
                }
                token.setEncryptionVersion("v1");
                token.setUpdatedAt(LocalDateTime.now());

                int result = tokenMapper.update(token);
                if (result > 0) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (Exception e) {
                failCount++;
                log.error("Token迁移失败: {}", token.getId(), e);
            }
        }

        return new MigrationResult(plaintextTokens.size(), successCount, failCount);
    }
}
