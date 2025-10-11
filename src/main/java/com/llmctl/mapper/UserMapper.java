package com.llmctl.mapper;

import com.llmctl.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

/**
 * 用户数据访问接口
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Mapper
public interface UserMapper {

    /**
     * 根据ID查询用户
     *
     * @param id 用户ID
     * @return User对象，如果不存在则返回null
     */
    User selectById(@Param("id") Long id);

    /**
     * 根据用户名查询用户
     *
     * @param username 用户名
     * @return User对象，如果不存在则返回null
     */
    User findByUsername(@Param("username") String username);

    /**
     * 根据邮箱查询用户
     *
     * @param email 邮箱
     * @return User对象，如果不存在则返回null
     */
    User findByEmail(@Param("email") String email);

    /**
     * 插入用户
     *
     * @param user User对象
     * @return 影响的行数
     */
    int insert(User user);

    /**
     * 更新用户信息
     *
     * @param user User对象
     * @return 影响的行数
     */
    int update(User user);

    /**
     * 增加失败登录次数
     *
     * @param userId 用户ID
     * @return 影响的行数
     */
    int incrementFailedAttempts(@Param("userId") Long userId);

    /**
     * 重置失败登录次数
     *
     * @param userId 用户ID
     * @return 影响的行数
     */
    int resetFailedAttempts(@Param("userId") Long userId);

    /**
     * 锁定用户
     *
     * @param userId 用户ID
     * @param lockedUntil 锁定到期时间
     * @return 影响的行数
     */
    int lockUser(@Param("userId") Long userId, @Param("lockedUntil") LocalDateTime lockedUntil);

    /**
     * 解锁用户
     *
     * @param userId 用户ID
     * @return 影响的行数
     */
    int unlockUser(@Param("userId") Long userId);

    /**
     * 更新最后登录时间和IP
     *
     * @param userId 用户ID
     * @param ipAddress IP地址
     * @return 影响的行数
     */
    int updateLastLogin(@Param("userId") Long userId, @Param("ipAddress") String ipAddress);

    /**
     * 更新Refresh Token
     *
     * @param userId 用户ID
     * @param refreshTokenHash Refresh Token哈希
     * @param expiresAt 过期时间
     * @return 影响的行数
     */
    int updateRefreshToken(@Param("userId") Long userId,
                           @Param("refreshTokenHash") String refreshTokenHash,
                           @Param("expiresAt") LocalDateTime expiresAt);

    /**
     * 清除Refresh Token
     *
     * @param userId 用户ID
     * @return 影响的行数
     */
    int clearRefreshToken(@Param("userId") Long userId);
}
