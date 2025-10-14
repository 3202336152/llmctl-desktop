package com.llmctl.mapper;

import com.llmctl.entity.Session;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Session数据访问接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Mapper
public interface SessionMapper {

    /**
     * 根据ID查询Session
     *
     * @param id Session ID
     * @return Session对象，如果不存在则返回null
     */
    Session findById(@Param("id") String id);

    /**
     * 根据ID查询Session（优化版本：同时验证Provider权限并获取Provider名称）
     * 使用JOIN避免额外的Provider权限查询
     *
     * @param sessionId Session ID
     * @param userId 用户ID
     * @return Session对象（包含Provider名称），如果不存在或无权访问则返回null
     */
    Session findByIdWithPermissionCheck(@Param("sessionId") String sessionId, @Param("userId") Long userId);

    /**
     * 查询所有Session
     *
     * @return Session列表
     */
    List<Session> findAll();

    /**
     * 查询指定用户的所有Session（优化版本：使用JOIN避免N+1查询）
     *
     * @param userId 用户ID
     * @return Session列表（包含Provider名称）
     */
    List<Session> findAllByUserIdWithProvider(@Param("userId") Long userId);

    /**
     * 查询指定用户的活跃Session（优化版本：使用JOIN避免N+1查询）
     *
     * @param userId 用户ID
     * @return 活跃的Session列表（包含Provider名称）
     */
    List<Session> findActiveSessionsByUserIdWithProvider(@Param("userId") Long userId);

    /**
     * 根据状态查询Session列表
     *
     * @param status Session状态
     * @return Session列表
     */
    List<Session> findByStatus(@Param("status") String status);

    /**
     * 根据Provider ID查询Session列表
     *
     * @param providerId Provider ID
     * @return Session列表
     */
    List<Session> findByProviderId(@Param("providerId") String providerId);

    /**
     * 查询活跃的Session列表
     *
     * @return 活跃的Session列表
     */
    List<Session> findActiveSessions();

    /**
     * 根据进程ID查询Session
     *
     * @param pid 进程ID
     * @return Session对象，如果不存在则返回null
     */
    Session findByPid(@Param("pid") Integer pid);

    /**
     * 插入Session
     *
     * @param session Session对象
     * @return 影响的行数
     */
    int insert(Session session);

    /**
     * 更新Session
     *
     * @param session Session对象
     * @return 影响的行数
     */
    int update(Session session);

    /**
     * 更新Session状态
     *
     * @param id Session ID
     * @param status 新状态
     * @return 影响的行数
     */
    int updateStatus(@Param("id") String id, @Param("status") String status);

    /**
     * 更新Session最后活动时间
     *
     * @param id Session ID
     * @return 影响的行数
     */
    int updateLastActivity(@Param("id") String id);

    /**
     * 终止Session
     *
     * @param id Session ID
     * @return 影响的行数
     */
    int terminate(@Param("id") String id);

    /**
     * 重新激活Session（将inactive状态改为active）
     *
     * @param id Session ID
     * @return 影响的行数
     */
    int reactivate(@Param("id") String id);

    /**
     * 根据ID删除Session
     *
     * @param id Session ID
     * @return 影响的行数
     */
    int deleteById(@Param("id") String id);

    /**
     * 根据Provider ID删除所有Session
     *
     * @param providerId Provider ID
     * @return 影响的行数
     */
    int deleteByProviderId(@Param("providerId") String providerId);

    /**
     * 删除指定时间之前的已终止Session
     *
     * @param beforeTime 时间界限
     * @return 影响的行数
     */
    int deleteTerminatedBefore(@Param("beforeTime") LocalDateTime beforeTime);

    /**
     * 统计Session总数
     *
     * @return Session总数
     */
    long count();

    /**
     * 统计指定状态的Session数量
     *
     * @param status Session状态
     * @return 指定状态的Session数量
     */
    long countByStatus(@Param("status") String status);

    /**
     * 统计指定Provider的Session数量
     *
     * @param providerId Provider ID
     * @return 指定Provider的Session数量
     */
    long countByProviderId(@Param("providerId") String providerId);

    /**
     * 应用启动时，将所有活跃会话设置为非活跃状态
     * 原因：桌面应用重启后，Electron终端进程已全部终止
     *
     * @return 影响的行数
     */
    int deactivateAllActiveSessions();

    /**
     * 将指定用户的所有活跃会话设置为非活跃状态
     * 用于用户登出场景
     *
     * @param userId 用户ID
     * @return 影响的行数
     */
    int deactivateUserActiveSessions(@Param("userId") Long userId);
}