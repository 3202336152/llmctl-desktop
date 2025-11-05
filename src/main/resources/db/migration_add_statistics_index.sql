-- ====================================
-- Dashboard 统计查询性能优化索引
-- ====================================

-- 优化会话时长趋势查询（按用户和时间范围）
-- 用于 SELECT ... FROM sessions WHERE user_id = ? AND start_time >= ? GROUP BY DATE(start_time)
CREATE INDEX idx_user_start_time ON sessions(user_id, start_time);

-- 说明：
-- 1. 此索引用于优化 Dashboard 的会话时长趋势查询
-- 2. 复合索引 (user_id, start_time) 可以同时满足 WHERE 条件过滤和排序需求
-- 3. 避免全表扫描，预计查询性能提升 10-100 倍（取决于数据量）
-- 4. 适用于时间范围查询场景
