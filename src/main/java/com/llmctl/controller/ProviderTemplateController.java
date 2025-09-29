package com.llmctl.controller;

import com.llmctl.dto.ApiResponse;
import com.llmctl.dto.ProviderTemplateDTO;
import com.llmctl.service.IProviderTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/templates")
@RequiredArgsConstructor
@Slf4j
@Validated
public class ProviderTemplateController {

    private final IProviderTemplateService templateService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProviderTemplateDTO>>> getAllTemplates() {
        log.info("获取所有Provider模板");
        List<ProviderTemplateDTO> templates = templateService.getAllTemplates();
        return ResponseEntity.ok(ApiResponse.success(templates));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProviderTemplateDTO>> getTemplateById(@PathVariable String id) {
        log.info("获取Provider模板，ID: {}", id);
        ProviderTemplateDTO template = templateService.getTemplateById(id);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    @GetMapping("/type/{providerType}")
    public ResponseEntity<ApiResponse<List<ProviderTemplateDTO>>> getTemplatesByType(
            @PathVariable @NotBlank(message = "Provider类型不能为空") String providerType) {
        log.info("获取指定类型的Provider模板，类型: {}", providerType);
        List<ProviderTemplateDTO> templates = templateService.getTemplatesByType(providerType);
        return ResponseEntity.ok(ApiResponse.success(templates));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProviderTemplateDTO>> createTemplate(
            @Valid @RequestBody IProviderTemplateService.CreateTemplateRequest request) {
        log.info("创建Provider模板: {}", request.getName());
        ProviderTemplateDTO created = templateService.createTemplate(request);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProviderTemplateDTO>> updateTemplate(
            @PathVariable String id,
            @Valid @RequestBody IProviderTemplateService.UpdateTemplateRequest request) {
        log.info("更新Provider模板，ID: {}", id);
        ProviderTemplateDTO updated = templateService.updateTemplate(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable String id) {
        log.info("删除Provider模板，ID: {}", id);
        templateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<ApiResponse<IProviderTemplateService.ProviderConfigFromTemplate>> generateProviderFromTemplate(
            @PathVariable String id,
            @RequestBody Map<String, Object> variables) {
        log.info("使用模板生成Provider配置，模板ID: {}, 变量数量: {}", id, variables.size());
        IProviderTemplateService.ProviderConfigFromTemplate providerConfig =
            templateService.generateProviderConfig(id, variables);
        return ResponseEntity.ok(ApiResponse.success(providerConfig));
    }

    @GetMapping("/supported-types")
    public ResponseEntity<ApiResponse<List<String>>> getSupportedProviderTypes() {
        log.info("获取支持的Provider类型列表");
        List<String> supportedTypes = templateService.getSupportedProviderTypes();
        return ResponseEntity.ok(ApiResponse.success(supportedTypes));
    }
}