package com.llmctl.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 邮箱验证码实体类
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
@Data
public class EmailVerificationCode {
    private String id;
    private String email;
    private String code;
    private Purpose purpose;
    private Boolean used;
    private LocalDateTime expireTime;
    private LocalDateTime createdAt;

    /**
     * 验证码用途枚举
     */
    public enum Purpose {
        REGISTER("REGISTER"),
        LOGIN("LOGIN"),
        RESET_PASSWORD("RESET_PASSWORD");

        private final String value;

        Purpose(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static Purpose fromValue(String value) {
            if (value == null) {
                return null;
            }
            for (Purpose purpose : Purpose.values()) {
                if (purpose.value.equals(value)) {
                    return purpose;
                }
            }
            throw new IllegalArgumentException("Unknown Purpose value: " + value);
        }
    }
}
