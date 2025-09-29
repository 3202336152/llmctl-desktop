package com.llmctl.exception;

/**
 * 服务层异常
 * 用于处理服务层操作失败的情况
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public class ServiceException extends RuntimeException {

    private final String operation;

    public ServiceException(String operation, String message) {
        super(message);
        this.operation = operation;
    }

    public ServiceException(String operation, Throwable cause) {
        super(String.format("%s失败: %s", operation, cause.getMessage()), cause);
        this.operation = operation;
    }

    public ServiceException(String operation, String message, Throwable cause) {
        super(message, cause);
        this.operation = operation;
    }

    public String getOperation() {
        return operation;
    }
}