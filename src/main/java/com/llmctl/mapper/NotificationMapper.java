package com.llmctl.mapper;

import com.llmctl.entity.Notification;
import com.llmctl.entity.Notification.NotificationType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 通知数据访问层
 */
@Mapper
public interface NotificationMapper {

    /**
     * 插入通知
     */
    int insert(Notification notification);

    /**
     * 批量插入通知
     */
    int batchInsert(@Param("notifications") List<Notification> notifications);

    /**
     * 根据ID查询通知
     */
    Notification selectById(Long id);

    /**
     * 分页查询用户通知
     */
    List<Notification> selectByUserId(@Param("userId") Long userId,
                                      @Param("type") NotificationType type,
                                      @Param("unreadOnly") Boolean unreadOnly,
                                      @Param("sortColumn") String sortColumn,
                                      @Param("sortOrder") String sortOrder,
                                      @Param("offset") Integer offset,
                                      @Param("limit") Integer limit);

    /**
     * 统计用户通知总数
     */
    Long countByUserId(@Param("userId") Long userId,
                       @Param("type") NotificationType type,
                       @Param("unreadOnly") Boolean unreadOnly);

    /**
     * 统计用户未读通知数量
     */
    Long countUnreadByUserId(Long userId);

    /**
     * 标记通知为已读
     */
    int markAsRead(Long id);

    /**
     * 批量标记为已读
     */
    int batchMarkAsRead(@Param("ids") List<Long> ids);

    /**
     * 标记用户所有通知为已读
     */
    int markAllAsReadByUserId(Long userId);

    /**
     * 删除通知
     */
    int deleteById(Long id);

    /**
     * 批量删除通知
     */
    int batchDelete(@Param("ids") List<Long> ids);

    /**
     * 删除用户所有已读通知
     */
    int deleteReadByUserId(Long userId);

    /**
     * 删除过期通知
     */
    int deleteExpired();

    /**
     * 删除超过指定天数的已读通知
     *
     * @param days 天数（例如：30表示删除30天前的已读通知）
     * @return 删除的记录数
     */
    int deleteOldReadNotifications(@Param("days") int days);

    /**
     * 查询最近的通知（用于SSE推送）
     */
    List<Notification> selectRecentByUserId(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
