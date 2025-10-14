package com.llmctl.mapper;

import com.llmctl.entity.EmailVerificationCode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 邮箱验证码数据访问层
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
@Mapper
public interface EmailVerificationCodeMapper {
    /**
     * 插入验证码记录
     *
     * @param code 验证码实体
     */
    void insert(EmailVerificationCode code);

    /**
     * 查找有效的验证码
     *
     * @param email 邮箱地址
     * @param code 验证码
     * @param purpose 用途
     * @return 验证码实体
     */
    EmailVerificationCode findValidCode(@Param("email") String email,
                                       @Param("code") String code,
                                       @Param("purpose") String purpose);

    /**
     * 标记验证码为已使用
     *
     * @param id 验证码ID
     */
    void markAsUsed(@Param("id") String id);

    /**
     * 删除过期的验证码
     */
    void deleteExpiredCodes();
}
