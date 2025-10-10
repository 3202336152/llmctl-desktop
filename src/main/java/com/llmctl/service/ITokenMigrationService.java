package com.llmctl.service;

/**
 * Token数据迁移服务接口
 *
 * 负责将数据库中的明文Token迁移到加密存储
 *
 * @author Liu Yifan
 * @version 2.0.4
 * @since 2025-10-10
 */
public interface ITokenMigrationService {

    /**
     * 应用启动后自动执行Token数据迁移
     * 将明文Token加密并更新到数据库
     */
    void migrateTokensOnStartup();

    /**
     * 手动触发Token数据迁移（用于管理员API）
     *
     * @return 迁移结果统计
     */
    MigrationResult migrateTokensManually();

    /**
     * 迁移结果统计
     */
    class MigrationResult {
        private final int total;
        private final int success;
        private final int failed;

        public MigrationResult(int total, int success, int failed) {
            this.total = total;
            this.success = success;
            this.failed = failed;
        }

        public int getTotal() { return total; }
        public int getSuccess() { return success; }
        public int getFailed() { return failed; }

        @Override
        public String toString() {
            return String.format("迁移结果: 总计=%d, 成功=%d, 失败=%d", total, success, failed);
        }
    }
}
