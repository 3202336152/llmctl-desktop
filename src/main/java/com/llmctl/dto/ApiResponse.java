package com.llmctl.dto;

import lombok.Data;

/**
 * 统一API响应格式
 *
 * @param <T> 响应数据类型
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class ApiResponse<T> {

    /**
     * 响应状态码
     */
    private Integer code;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 响应数据
     */
    private T data;

    /**
     * 错误详情 (仅在失败时设置)
     */
    private String error;

    /**
     * 时间戳
     */
    private Long timestamp;

    /**
     * 私有构造函数
     */
    private ApiResponse() {
        this.timestamp = System.currentTimeMillis();
    }

    /**
     * 成功响应 (带数据)
     *
     * @param data 响应数据
     * @param <T>  数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(ResponseCode.SUCCESS);
        response.setMessage("success");
        response.setData(data);
        return response;
    }

    /**
     * 成功响应 (无数据)
     *
     * @param message 响应消息
     * @param <T>     数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> success(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(ResponseCode.SUCCESS);
        response.setMessage(message);
        return response;
    }

    /**
     * 成功响应 (带数据和自定义消息)
     *
     * @param data    响应数据
     * @param message 响应消息
     * @param <T>     数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(ResponseCode.SUCCESS);
        response.setMessage(message);
        response.setData(data);
        return response;
    }

    /**
     * 失败响应
     *
     * @param code    错误码
     * @param message 错误消息
     * @param <T>     数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> error(Integer code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        return response;
    }

    /**
     * 失败响应 (带错误详情)
     *
     * @param code    错误码
     * @param message 错误消息
     * @param error   错误详情
     * @param <T>     数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> error(Integer code, String message, String error) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        response.setError(error);
        return response;
    }

    /**
     * 参数错误响应
     *
     * @param message 错误消息
     * @param <T>     数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> badRequest(String message) {
        return error(ResponseCode.BAD_REQUEST, message);
    }

    /**
     * 资源不存在响应
     *
     * @param message 错误消息
     * @param <T>     数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> notFound(String message) {
        return error(ResponseCode.NOT_FOUND, message);
    }

    /**
     * 服务器内部错误响应
     *
     * @param message 错误消息
     * @param <T>     数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> internalError(String message) {
        return error(ResponseCode.INTERNAL_ERROR, message);
    }

    /**
     * 资源冲突响应
     *
     * @param message 错误消息
     * @param <T>     数据类型
     * @return API响应对象
     */
    public static <T> ApiResponse<T> conflict(String message) {
        return error(ResponseCode.CONFLICT, message);
    }

    /**
     * 响应状态码常量
     */
    public static class ResponseCode {
        /**
         * 成功
         */
        public static final int SUCCESS = 200;

        /**
         * 请求参数错误
         */
        public static final int BAD_REQUEST = 400;

        /**
         * 资源不存在
         */
        public static final int NOT_FOUND = 404;

        /**
         * 资源冲突
         */
        public static final int CONFLICT = 409;

        /**
         * 服务器内部错误
         */
        public static final int INTERNAL_ERROR = 500;
    }
}