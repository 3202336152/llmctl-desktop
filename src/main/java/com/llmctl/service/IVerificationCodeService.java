package com.llmctl.service;

/**
 * 验证码服务接口
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
public interface IVerificationCodeService {
    /**
     * 发送验证码
     *
     * @param email 邮箱地址
     * @param purpose 验证码用途
     */
    void sendVerificationCode(String email, String purpose);

    /**
     * 验证验证码
     *
     * @param email 邮箱地址
     * @param code 验证码
     * @param purpose 验证码用途
     * @return 是否验证成功
     */
    boolean verifyCode(String email, String code, String purpose);
}
