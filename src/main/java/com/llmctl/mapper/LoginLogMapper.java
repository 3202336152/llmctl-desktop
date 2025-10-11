package com.llmctl.mapper;

import com.llmctl.entity.LoginLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 登录日志数据访问接口
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Mapper
public interface LoginLogMapper {

    /**
     * 插入登录日志
     *
     * @param loginLog LoginLog对象
     * @return 影响的行数
     */
    int insert(LoginLog loginLog);

    /**
     * 根据用户ID查询登录日志
     *
     * @param userId 用户ID
     * @param limit 限制数量
     * @return 登录日志列表
     */
    List<LoginLog> findByUserId(@Param("userId") Long userId, @Param("limit") Integer limit);

    /**
     * 根据用户名查询登录日志
     *
     * @param username 用户名
     * @param limit 限制数量
     * @return 登录日志列表
     */
    List<LoginLog> findByUsername(@Param("username") String username, @Param("limit") Integer limit);

    /**
     * 统计用户登录失败次数（最近N分钟）
     *
     * @param username 用户名
     * @param minutes 时间范围（分钟）
     * @return 失败次数
     */
    long countFailedAttempts(@Param("username") String username, @Param("minutes") Integer minutes);
}
