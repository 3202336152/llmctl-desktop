package com.llmctl.context;

/**
 * 用户上下文
 * 使用ThreadLocal存储当前请求的用户信息
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
public class UserContext {

    private static final ThreadLocal<Long> USER_ID_HOLDER = new ThreadLocal<>();
    private static final ThreadLocal<String> USERNAME_HOLDER = new ThreadLocal<>();

    /**
     * 设置用户ID
     *
     * @param userId 用户ID
     */
    public static void setUserId(Long userId) {
        USER_ID_HOLDER.set(userId);
    }

    /**
     * 获取用户ID
     *
     * @return 用户ID
     * @throws IllegalStateException 如果用户上下文未设置
     */
    public static Long getUserId() {
        Long userId = USER_ID_HOLDER.get();
        if (userId == null) {
            throw new IllegalStateException("用户上下文未设置");
        }
        return userId;
    }

    /**
     * 设置用户名
     *
     * @param username 用户名
     */
    public static void setUsername(String username) {
        USERNAME_HOLDER.set(username);
    }

    /**
     * 获取用户名
     *
     * @return 用户名
     * @throws IllegalStateException 如果用户上下文未设置
     */
    public static String getUsername() {
        String username = USERNAME_HOLDER.get();
        if (username == null) {
            throw new IllegalStateException("用户上下文未设置");
        }
        return username;
    }

    /**
     * 清除用户上下文
     */
    public static void clear() {
        USER_ID_HOLDER.remove();
        USERNAME_HOLDER.remove();
    }
}
