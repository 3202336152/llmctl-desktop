package com.llmctl.exception;

/**
 * 认证异常类
 * 用于处理认证相关错误（登录失败、Token无效等）
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
public class AuthenticationException extends RuntimeException {

    private final int code;

    public AuthenticationException(int code, String message) {
        super(message);
        this.code = code;
    }

    public AuthenticationException(String message) {
        super(message);
        this.code = 401;
    }

    public int getCode() {
        return code;
    }
}
