package com.llmctl.exception;

/**
 * 资源不存在异常
 * 用于处理资源未找到的情况
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Object id) {
        super(String.format("%s 不存在: %s", resource, id));
    }
}