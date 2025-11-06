package com.llmctl.service.impl;

import com.llmctl.entity.EmailVerificationCode;
import com.llmctl.entity.User;
import com.llmctl.exception.BusinessException;
import com.llmctl.mapper.EmailVerificationCodeMapper;
import com.llmctl.mapper.UserMapper;
import com.llmctl.service.IEmailService;
import com.llmctl.service.IVerificationCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

/**
 * 验证码服务实现类
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationCodeServiceImpl implements IVerificationCodeService {

    private final EmailVerificationCodeMapper codeMapper;
    private final UserMapper userMapper;
    private final IEmailService emailService;
    private static final Random RANDOM = new Random();
    private static final int CODE_EXPIRE_MINUTES = 5;

    @Override
    @Transactional
    public void sendVerificationCode(String email, String purpose) {
        // 如果是重置密码用途，需要先验证邮箱是否已绑定账户
        if ("RESET_PASSWORD".equals(purpose)) {
            User user = userMapper.findByEmail(email);
            if (user == null) {
                throw new BusinessException("该邮箱未绑定任何账户，请检查邮箱地址或联系管理员");
            }
        }

        // 生成6位数字验证码
        String code = String.format("%06d", RANDOM.nextInt(1000000));

        // 创建验证码记录
        EmailVerificationCode verificationCode = new EmailVerificationCode();
        verificationCode.setId(UUID.randomUUID().toString());
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setPurpose(EmailVerificationCode.Purpose.valueOf(purpose));
        verificationCode.setUsed(false);
        verificationCode.setExpireTime(LocalDateTime.now().plusMinutes(CODE_EXPIRE_MINUTES));
        verificationCode.setCreatedAt(LocalDateTime.now());

        // 保存到数据库
        codeMapper.insert(verificationCode);

        // 发送邮件
        emailService.sendVerificationCode(email, code, purpose);

        log.info("验证码已生成并发送: email={}, purpose={}", email, purpose);
    }

    @Override
    @Transactional
    public boolean verifyCode(String email, String code, String purpose) {
        // 查找有效的验证码
        EmailVerificationCode verificationCode = codeMapper.findValidCode(email, code, purpose);

        if (verificationCode == null) {
            log.warn("验证码验证失败: email={}, code={}, purpose={}", email, code, purpose);
            return false;
        }

        // 标记为已使用
        codeMapper.markAsUsed(verificationCode.getId());

        log.info("验证码验证成功: email={}, purpose={}", email, purpose);
        return true;
    }
}
