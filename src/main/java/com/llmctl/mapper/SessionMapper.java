package com.llmctl.mapper;

import com.llmctl.entity.Session;
import org.apache.ibatis.annotations.*;

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
    @Select("SELECT * FROM sessions WHERE id = #{id}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "pid", column = "pid"),
        @Result(property = "workingDirectory", column = "working_directory"),
        @Result(property = "command", column = "command"),
        @Result(property = "status", column = "status"),
        @Result(property = "startTime", column = "start_time"),
        @Result(property = "lastActivity", column = "last_activity"),
        @Result(property = "endTime", column = "end_time")
    })
    Session findById(@Param("id") String id);

    /**
     * 查询所有Session
     *
     * @return Session列表
     */
    @Select("SELECT * FROM sessions ORDER BY start_time DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "pid", column = "pid"),
        @Result(property = "workingDirectory", column = "working_directory"),
        @Result(property = "command", column = "command"),
        @Result(property = "status", column = "status"),
        @Result(property = "startTime", column = "start_time"),
        @Result(property = "lastActivity", column = "last_activity"),
        @Result(property = "endTime", column = "end_time")
    })
    List<Session> findAll();

    /**
     * 根据状态查询Session列表
     *
     * @param status Session状态
     * @return Session列表
     */
    @Select("SELECT * FROM sessions WHERE status = #{status} ORDER BY start_time DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "pid", column = "pid"),
        @Result(property = "workingDirectory", column = "working_directory"),
        @Result(property = "command", column = "command"),
        @Result(property = "status", column = "status"),
        @Result(property = "startTime", column = "start_time"),
        @Result(property = "lastActivity", column = "last_activity"),
        @Result(property = "endTime", column = "end_time")
    })
    List<Session> findByStatus(@Param("status") String status);

    /**
     * 根据Provider ID查询Session列表
     *
     * @param providerId Provider ID
     * @return Session列表
     */
    @Select("SELECT * FROM sessions WHERE provider_id = #{providerId} ORDER BY start_time DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "pid", column = "pid"),
        @Result(property = "workingDirectory", column = "working_directory"),
        @Result(property = "command", column = "command"),
        @Result(property = "status", column = "status"),
        @Result(property = "startTime", column = "start_time"),
        @Result(property = "lastActivity", column = "last_activity"),
        @Result(property = "endTime", column = "end_time")
    })
    List<Session> findByProviderId(@Param("providerId") String providerId);

    /**
     * 查询活跃的Session列表
     *
     * @return 活跃的Session列表
     */
    @Select("SELECT * FROM sessions WHERE status = 'active' ORDER BY last_activity DESC")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "pid", column = "pid"),
        @Result(property = "workingDirectory", column = "working_directory"),
        @Result(property = "command", column = "command"),
        @Result(property = "status", column = "status"),
        @Result(property = "startTime", column = "start_time"),
        @Result(property = "lastActivity", column = "last_activity"),
        @Result(property = "endTime", column = "end_time")
    })
    List<Session> findActiveSessions();

    /**
     * 根据进程ID查询Session
     *
     * @param pid 进程ID
     * @return Session对象，如果不存在则返回null
     */
    @Select("SELECT * FROM sessions WHERE pid = #{pid}")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "pid", column = "pid"),
        @Result(property = "workingDirectory", column = "working_directory"),
        @Result(property = "command", column = "command"),
        @Result(property = "status", column = "status"),
        @Result(property = "startTime", column = "start_time"),
        @Result(property = "lastActivity", column = "last_activity"),
        @Result(property = "endTime", column = "end_time")
    })
    Session findByPid(@Param("pid") Integer pid);

    /**
     * 插入Session
     *
     * @param session Session对象
     * @return 影响的行数
     */
    @Insert("INSERT INTO sessions (id, provider_id, pid, working_directory, command, status, " +
            "start_time, last_activity, end_time) " +
            "VALUES (#{id}, #{providerId}, #{pid}, #{workingDirectory}, #{command}, #{status}, " +
            "#{startTime}, #{lastActivity}, #{endTime})")
    int insert(Session session);

    /**
     * 更新Session
     *
     * @param session Session对象
     * @return 影响的行数
     */
    @Update("UPDATE sessions SET " +
            "provider_id = #{providerId}, " +
            "pid = #{pid}, " +
            "working_directory = #{workingDirectory}, " +
            "command = #{command}, " +
            "status = #{status}, " +
            "last_activity = #{lastActivity}, " +
            "end_time = #{endTime} " +
            "WHERE id = #{id}")
    int update(Session session);

    /**
     * 更新Session状态
     *
     * @param id Session ID
     * @param status 新状态
     * @return 影响的行数
     */
    @Update("UPDATE sessions SET status = #{status}, last_activity = NOW() WHERE id = #{id}")
    int updateStatus(@Param("id") String id, @Param("status") String status);

    /**
     * 更新Session最后活动时间
     *
     * @param id Session ID
     * @return 影响的行数
     */
    @Update("UPDATE sessions SET last_activity = NOW() WHERE id = #{id}")
    int updateLastActivity(@Param("id") String id);

    /**
     * 终止Session
     *
     * @param id Session ID
     * @return 影响的行数
     */
    @Update("UPDATE sessions SET status = 'terminated', end_time = NOW(), last_activity = NOW() WHERE id = #{id}")
    int terminate(@Param("id") String id);

    /**
     * 根据ID删除Session
     *
     * @param id Session ID
     * @return 影响的行数
     */
    @Delete("DELETE FROM sessions WHERE id = #{id}")
    int deleteById(@Param("id") String id);

    /**
     * 根据Provider ID删除所有Session
     *
     * @param providerId Provider ID
     * @return 影响的行数
     */
    @Delete("DELETE FROM sessions WHERE provider_id = #{providerId}")
    int deleteByProviderId(@Param("providerId") String providerId);

    /**
     * 删除指定时间之前的已终止Session
     *
     * @param beforeTime 时间界限
     * @return 影响的行数
     */
    @Delete("DELETE FROM sessions WHERE status = 'terminated' AND end_time < #{beforeTime}")
    int deleteTerminatedBefore(@Param("beforeTime") LocalDateTime beforeTime);

    /**
     * 查询空闲超时的Session列表
     *
     * @param idleTimeoutMinutes 空闲超时时间（分钟）
     * @return 空闲超时的Session列表
     */
    @Select("SELECT * FROM sessions WHERE status = 'active' " +
            "AND last_activity < DATE_SUB(NOW(), INTERVAL #{idleTimeoutMinutes} MINUTE)")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "providerId", column = "provider_id"),
        @Result(property = "pid", column = "pid"),
        @Result(property = "workingDirectory", column = "working_directory"),
        @Result(property = "command", column = "command"),
        @Result(property = "status", column = "status"),
        @Result(property = "startTime", column = "start_time"),
        @Result(property = "lastActivity", column = "last_activity"),
        @Result(property = "endTime", column = "end_time")
    })
    List<Session> findIdleTimeoutSessions(@Param("idleTimeoutMinutes") int idleTimeoutMinutes);

    /**
     * 批量更新空闲超时Session的状态为inactive
     *
     * @param idleTimeoutMinutes 空闲超时时间（分钟）
     * @return 影响的行数
     */
    @Update("UPDATE sessions SET status = 'inactive', last_activity = NOW() " +
            "WHERE status = 'active' AND last_activity < DATE_SUB(NOW(), INTERVAL #{idleTimeoutMinutes} MINUTE)")
    int markIdleSessionsAsInactive(@Param("idleTimeoutMinutes") int idleTimeoutMinutes);

    /**
     * 统计Session总数
     *
     * @return Session总数
     */
    @Select("SELECT COUNT(*) FROM sessions")
    long count();

    /**
     * 统计指定状态的Session数量
     *
     * @param status Session状态
     * @return 指定状态的Session数量
     */
    @Select("SELECT COUNT(*) FROM sessions WHERE status = #{status}")
    long countByStatus(@Param("status") String status);

    /**
     * 统计指定Provider的Session数量
     *
     * @param providerId Provider ID
     * @return 指定Provider的Session数量
     */
    @Select("SELECT COUNT(*) FROM sessions WHERE provider_id = #{providerId}")
    long countByProviderId(@Param("providerId") String providerId);
}