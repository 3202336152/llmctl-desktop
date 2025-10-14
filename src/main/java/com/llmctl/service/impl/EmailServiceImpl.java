package com.llmctl.service.impl;

import com.llmctl.service.IEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 邮件服务实现类
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements IEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Override
    public void sendVerificationCode(String email, String code, String purpose) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(email);
            message.setSubject("【LLMctl】验证码");

            String purposeText = getPurposeText(purpose);
            message.setText(String.format(
                    "您好，\n\n" +
                            "您正在进行%s操作。\n" +
                            "本次验证码为：%s\n" +
                            "请在 5 分钟内完成验证。\n\n" +
                            "若非您本人操作，请忽略此邮件。\n\n" +
                            "—— LLMctl 团队",
                    purposeText, code
            ));

            mailSender.send(message);
            log.info("验证码邮件已发送到: {}", email);
        } catch (Exception e) {
            log.error("发送验证码邮件失败: {}", email, e);
            throw new RuntimeException("发送验证码失败，请稍后重试");
        }
    }


    private String getPurposeText(String purpose) {
        return switch (purpose) {
            case "REGISTER" -> "用户注册";
            case "LOGIN" -> "用户登录";
            case "RESET_PASSWORD" -> "重置密码";
            default -> "验证操作";
        };
    }
}
