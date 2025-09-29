package com.llmctl.exception;

/**
 * 业务异常类
 * 用于处理业务逻辑错误
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message) {
        super(message);
        this.code = 500;
    }

    public int getCode() {
        return code;
    }
}