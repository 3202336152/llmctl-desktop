package com.llmctl.mapper;

import com.llmctl.entity.ProviderConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * ProviderConfig数据访问接口
 *
 * @author Liu Yifan
 * @version 2.3.0
 * @since 2025-01-15
 */
@Mapper
public interface ProviderConfigMapper {

    /**
     * 插入配置
     *
     * @param config ProviderConfig对象
     * @return 影响的行数
     */
    int insert(ProviderConfig config);

    /**
     * 查询某个Provider的所有配置
     *
     * @param providerId Provider ID
     * @return ProviderConfig列表
     */
    List<ProviderConfig> selectByProviderId(@Param("providerId") String providerId);

    /**
     * 查询某个Provider的特定CLI配置
     *
     * @param providerId Provider ID
     * @param cliType CLI类型
     * @return ProviderConfig对象，如果不存在则返回null
     */
    ProviderConfig selectByProviderIdAndCliType(
            @Param("providerId") String providerId,
            @Param("cliType") String cliType
    );

    /**
     * 根据配置ID查询
     *
     * @param id 配置ID
     * @return ProviderConfig对象，如果不存在则返回null
     */
    ProviderConfig selectById(@Param("id") Long id);

    /**
     * 更新配置
     *
     * @param config ProviderConfig对象
     * @return 影响的行数
     */
    int update(ProviderConfig config);

    /**
     * 删除某个Provider的所有配置
     *
     * @param providerId Provider ID
     * @return 影响的行数
     */
    int deleteByProviderId(@Param("providerId") String providerId);

    /**
     * 删除特定配置
     *
     * @param id 配置ID
     * @return 影响的行数
     */
    int deleteById(@Param("id") Long id);

    /**
     * 统计某个Provider的配置数量
     *
     * @param providerId Provider ID
     * @return 配置数量
     */
    long countByProviderId(@Param("providerId") String providerId);
}
