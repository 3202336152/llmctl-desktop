package com.llmctl.controller;

import com.llmctl.dto.*;
import com.llmctl.service.TokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Token管理REST控制器
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
@RestController
@RequestMapping("/providers/{providerId}/tokens")
@RequiredArgsConstructor
@Validated
public class TokenController {

    private final TokenService tokenService;

    /**
     * 获取指定Provider的所有Token列表
     *
     * @param providerId Provider ID
     * @return Token列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TokenDTO>>> getTokensByProviderId(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId) {
        log.info("获取Provider的Token列表: {}", providerId);

        List<TokenDTO> tokens = tokenService.getTokensByProviderId(providerId);
        ApiResponse<List<TokenDTO>> response = ApiResponse.success(tokens);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取指定Provider的可用Token列表
     *
     * @param providerId Provider ID
     * @return 可用Token列表
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<TokenDTO>>> getAvailableTokensByProviderId(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId) {
        log.info("获取Provider的可用Token列表: {}", providerId);

        List<TokenDTO> tokens = tokenService.getAvailableTokensByProviderId(providerId);
        ApiResponse<List<TokenDTO>> response = ApiResponse.success(tokens);

        return ResponseEntity.ok(response);
    }

    /**
     * 根据ID获取Token详情
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @return Token详情
     */
    @GetMapping("/{tokenId}")
    public ResponseEntity<ApiResponse<TokenDTO>> getTokenById(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId,
            @PathVariable @NotBlank(message = "Token ID不能为空") String tokenId) {
        log.info("获取Token详情: {} (Provider: {})", tokenId, providerId);

        TokenDTO token = tokenService.getTokenById(tokenId);

        // 验证Token是否属于指定Provider
        if (!providerId.equals(token.getProviderId())) {
            throw new IllegalArgumentException("Token不属于指定Provider");
        }

        ApiResponse<TokenDTO> response = ApiResponse.success(token);
        return ResponseEntity.ok(response);
    }

    /**
     * 为Provider创建新的Token
     *
     * @param providerId Provider ID
     * @param request 创建Token请求
     * @return 创建的Token
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TokenDTO>> createToken(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId,
            @Valid @RequestBody CreateTokenRequest request) {
        log.info("为Provider创建Token: {} (Provider: {})", request.getAlias(), providerId);

        TokenDTO token = tokenService.createToken(providerId, request);
        ApiResponse<TokenDTO> response = ApiResponse.success(token, "Token创建成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 更新Token
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @param request 更新Token请求
     * @return 更新后的Token
     */
    @PutMapping("/{tokenId}")
    public ResponseEntity<ApiResponse<TokenDTO>> updateToken(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId,
            @PathVariable @NotBlank(message = "Token ID不能为空") String tokenId,
            @Valid @RequestBody CreateTokenRequest request) {
        log.info("更新Token: {} (Provider: {})", tokenId, providerId);

        TokenDTO token = tokenService.updateToken(providerId, tokenId, request);
        ApiResponse<TokenDTO> response = ApiResponse.success(token, "Token更新成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 删除Token
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @return 删除结果
     */
    @DeleteMapping("/{tokenId}")
    public ResponseEntity<ApiResponse<Object>> deleteToken(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId,
            @PathVariable @NotBlank(message = "Token ID不能为空") String tokenId) {
        log.info("删除Token: {} (Provider: {})", tokenId, providerId);

        tokenService.deleteToken(providerId, tokenId);
        ApiResponse<Object> response = ApiResponse.success("Token删除成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 更新Token健康状态
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @param request 健康状态更新请求
     * @return 更新结果
     */
    @PutMapping("/{tokenId}/health")
    public ResponseEntity<ApiResponse<Object>> updateTokenHealth(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId,
            @PathVariable @NotBlank(message = "Token ID不能为空") String tokenId,
            @Valid @RequestBody TokenHealthRequest request) {
        log.info("更新Token健康状态: {} -> {} (Provider: {})", tokenId, request.getHealthy(), providerId);

        tokenService.updateTokenHealth(tokenId, request.getHealthy());
        ApiResponse<Object> response = ApiResponse.success("Token健康状态更新成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 重置Token错误计数
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @return 重置结果
     */
    @PostMapping("/{tokenId}/reset-errors")
    public ResponseEntity<ApiResponse<Object>> resetTokenErrors(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId,
            @PathVariable @NotBlank(message = "Token ID不能为空") String tokenId) {
        log.info("重置Token错误计数: {} (Provider: {})", tokenId, providerId);

        tokenService.resetTokenError(tokenId);
        ApiResponse<Object> response = ApiResponse.success("Token错误计数重置成功");

        return ResponseEntity.ok(response);
    }

    /**
     * Token健康状态更新请求DTO
     */
    public static class TokenHealthRequest {
        @NotBlank(message = "健康状态不能为空")
        private Boolean healthy;

        public Boolean getHealthy() {
            return healthy;
        }

        public void setHealthy(Boolean healthy) {
            this.healthy = healthy;
        }
    }
}