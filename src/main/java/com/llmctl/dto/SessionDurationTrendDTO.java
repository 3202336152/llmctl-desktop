package com.llmctl.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 会话时长趋势DTO
 * 用于统计每日的会话时长和数量
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionDurationTrendDTO {
    /**
     * 日期（格式：YYYY-MM-DD）
     */
    private String date;

    /**
     * 平均会话时长（分钟）
     */
    private Double avgDuration;

    /**
     * 会话数量
     */
    private Integer sessionCount;
}
