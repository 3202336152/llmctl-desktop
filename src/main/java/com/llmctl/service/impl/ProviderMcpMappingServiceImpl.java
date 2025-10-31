package com.llmctl.service.impl;

import com.llmctl.entity.ProviderMcpMapping;
import com.llmctl.mapper.ProviderMcpMappingMapper;
import com.llmctl.service.ProviderMcpMappingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Provider MCP 映射服务实现类
 * 业务逻辑层，负责 Provider 与 MCP 服务器关联关系的业务处理
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderMcpMappingServiceImpl implements ProviderMcpMappingService {

    private final ProviderMcpMappingMapper mappingMapper;

    @Override
    public List<ProviderMcpMapping> getMappingsByProviderAndCli(String providerId, String cliType) {
        log.info("查询 Provider MCP 映射，Provider ID: {}, CLI 类型: {}", providerId, cliType);
        return mappingMapper.findByProviderAndCli(providerId, cliType);
    }

    @Override
    public List<ProviderMcpMapping> getMappingsByProviderId(String providerId) {
        log.info("查询 Provider MCP 映射，Provider ID: {}", providerId);
        return mappingMapper.findByProviderId(providerId);
    }

    @Override
    public ProviderMcpMapping getMappingById(Long id) {
        log.info("根据 ID 查询 Provider MCP 映射: {}", id);
        return mappingMapper.findById(id);
    }

    @Override
    @Transactional
    public ProviderMcpMapping createMapping(ProviderMcpMapping mapping) {
        log.info("创建 Provider MCP 映射，Provider ID: {}, MCP Server ID: {}, CLI 类型: {}",
                mapping.getProviderId(), mapping.getMcpServerId(), mapping.getCliType());

        // 设置默认值
        if (mapping.getEnabled() == null) {
            mapping.setEnabled(true);
        }
        if (mapping.getPriority() == null) {
            mapping.setPriority(0);
        }

        mappingMapper.insert(mapping);
        log.info("Provider MCP 映射创建成功，ID: {}", mapping.getId());
        return mapping;
    }

    @Override
    @Transactional
    public ProviderMcpMapping updateMapping(ProviderMcpMapping mapping) {
        log.info("更新 Provider MCP 映射，ID: {}", mapping.getId());

        // 检查是否存在
        ProviderMcpMapping existingMapping = mappingMapper.findById(mapping.getId());
        if (existingMapping == null) {
            throw new IllegalArgumentException("Provider MCP 映射不存在，ID: " + mapping.getId());
        }

        mappingMapper.update(mapping);
        log.info("Provider MCP 映射更新成功，ID: {}", mapping.getId());
        return mapping;
    }

    @Override
    @Transactional
    public void deleteMapping(Long id) {
        log.info("删除 Provider MCP 映射，ID: {}", id);

        // 检查是否存在
        ProviderMcpMapping existingMapping = mappingMapper.findById(id);
        if (existingMapping == null) {
            throw new IllegalArgumentException("Provider MCP 映射不存在，ID: " + id);
        }

        mappingMapper.deleteById(id);
        log.info("Provider MCP 映射删除成功，ID: {}", id);
    }

    @Override
    @Transactional
    public void batchSaveMappings(String providerId, String cliType, List<ProviderMcpMapping> mappings) {
        log.info("批量保存 Provider MCP 映射，Provider ID: {}, CLI 类型: {}, 数量: {}",
                providerId, cliType, mappings.size());

        // 删除旧的映射
        mappingMapper.deleteByProviderAndCli(providerId, cliType);

        // 创建新的映射
        for (ProviderMcpMapping mapping : mappings) {
            mapping.setProviderId(providerId);
            mapping.setCliType(cliType);

            // 设置默认值
            if (mapping.getEnabled() == null) {
                mapping.setEnabled(true);
            }
            if (mapping.getPriority() == null) {
                mapping.setPriority(0);
            }

            mappingMapper.insert(mapping);
        }

        log.info("批量保存 Provider MCP 映射成功");
    }

    @Override
    @Transactional
    public void updatePriority(Long id, Integer priority) {
        log.info("更新 Provider MCP 映射优先级，ID: {}, 优先级: {}", id, priority);
        mappingMapper.updatePriority(id, priority);
    }

    @Override
    @Transactional
    public void batchUpdatePriority(List<ProviderMcpMapping> mappings) {
        log.info("批量更新 Provider MCP 映射优先级，数量: {}", mappings.size());

        for (ProviderMcpMapping mapping : mappings) {
            if (mapping.getId() != null && mapping.getPriority() != null) {
                mappingMapper.updatePriority(mapping.getId(), mapping.getPriority());
            }
        }

        log.info("批量更新 Provider MCP 映射优先级成功");
    }

    @Override
    @Transactional
    public void batchAssociateMcpServers(String providerId, String cliType, List<Long> mcpServerIds) {
        log.info("批量关联 MCP 服务器到 Provider，Provider ID: {}, CLI 类型: {}, 数量: {}",
                providerId, cliType, mcpServerIds.size());

        // 为每个 MCP 服务器创建关联
        for (Long mcpServerId : mcpServerIds) {
            // 检查是否已存在相同的关联
            List<ProviderMcpMapping> existingMappings = mappingMapper.findByProviderAndCli(providerId, cliType);
            boolean alreadyExists = existingMappings.stream()
                    .anyMatch(m -> m.getMcpServerId().equals(mcpServerId));

            if (alreadyExists) {
                log.info("MCP 服务器 {} 已关联到 Provider {} (CLI: {})，跳过",
                        mcpServerId, providerId, cliType);
                continue;
            }

            // 创建新的关联
            ProviderMcpMapping mapping = new ProviderMcpMapping();
            mapping.setProviderId(providerId);
            mapping.setCliType(cliType);
            mapping.setMcpServerId(mcpServerId);
            mapping.setEnabled(true);
            mapping.setPriority(0);

            mappingMapper.insert(mapping);
            log.info("成功关联 MCP 服务器 {} 到 Provider {}", mcpServerId, providerId);
        }

        log.info("批量关联 MCP 服务器成功");
    }
}
