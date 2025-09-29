package com.llmctl.dto;

import lombok.Data;

/**
 * 活跃Provider配置DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class ActiveProviderConfigDTO {

    /**
     * 当前活跃的Provider ID
     */
    private String activeProviderId;

    /**
     * 活跃Provider对象
     */
    private ProviderDTO activeProvider;
}