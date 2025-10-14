package com.llmctl.service;

/**
 * 邮件服务接口
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
public interface IEmailService {
    /**
     * 发送验证码邮件
     *
     * @param email 邮箱地址
     * @param code 验证码
     * @param purpose 验证码用途
     */
    void sendVerificationCode(String email, String code, String purpose);
}
