package com.llmctl.controller;

import com.llmctl.dto.ProviderUsageStatDTO;
import com.llmctl.dto.SessionDurationTrendDTO;
import com.llmctl.service.StatisticsService;
import com.llmctl.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 统计数据控制器
 * 提供Dashboard统计数据API
 */
@Slf4j
@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    /**
     * 查询会话时长趋势（最近N天）
     *
     * @param days 天数，默认7天
     * @return 会话时长趋势列表
     */
    @GetMapping("/session-duration-trend")
    public ResponseEntity<Map<String, Object>> getSessionDurationTrend(
            @RequestParam(defaultValue = "7") Integer days) {
        try {
            Long userId = UserContext.getUserId();
            log.info("[统计API] 查询会话时长趋势, userId={}, days={}", userId, days);

            List<SessionDurationTrendDTO> trend = statisticsService.getSessionDurationTrend(userId, days);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "查询成功");
            response.put("data", trend);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[统计API] 查询会话时长趋势失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * 查询Provider使用统计（最近N天）
     *
     * @param days 天数，传null表示全部，默认null
     * @return Provider使用统计列表
     */
    @GetMapping("/provider-usage")
    public ResponseEntity<Map<String, Object>> getProviderUsageStats(
            @RequestParam(required = false) Integer days) {
        try {
            Long userId = UserContext.getUserId();
            log.info("[统计API] 查询Provider使用统计, userId={}, days={}", userId, days);

            List<ProviderUsageStatDTO> stats = statisticsService.getProviderUsageStats(userId, days);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "查询成功");
            response.put("data", stats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[统计API] 查询Provider使用统计失败", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("code", 500);
            errorResponse.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
