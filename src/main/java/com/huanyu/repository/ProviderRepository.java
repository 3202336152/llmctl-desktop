package com.llmctl.repository;

import com.llmctl.entity.Provider;
import com.llmctl.enums.ProviderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Provider Repository
 */
@Repository
public interface ProviderRepository extends JpaRepository<Provider, String> {

    /**
     * 根据用户ID查找所有Providers
     */
    List<Provider> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * 根据用户ID分页查找Providers
     */
    Page<Provider> findByUserId(String userId, Pageable pageable);

    /**
     * 根据用户ID和Provider名称查找
     */
    Optional<Provider> findByUserIdAndName(String userId, String name);

    /**
     * 根据用户ID和Provider类型查找
     */
    List<Provider> findByUserIdAndType(String userId, ProviderType type);

    /**
     * 查找用户的活跃Provider
     */
    @Query("SELECT p FROM Provider p WHERE p.user.id = :userId AND p.isActive = true")
    Optional<Provider> findActiveProviderByUserId(@Param("userId") String userId);

    /**
     * 查找用户所有活跃的Providers
     */
    List<Provider> findByUserIdAndIsActiveTrue(String userId);

    /**
     * 检查用户下Provider名称是否存在
     */
    boolean existsByUserIdAndName(String userId, String name);

    /**
     * 统计用户的Provider数量
     */
    long countByUserId(String userId);

    /**
     * 根据类型统计Provider数量
     */
    @Query("SELECT p.type, COUNT(p) FROM Provider p GROUP BY p.type")
    List<Object[]> countByType();

    /**
     * 搜索Providers（根据名称或描述）
     */
    @Query("SELECT p FROM Provider p WHERE p.user.id = :userId AND " +
           "(p.name LIKE %:keyword% OR p.description LIKE %:keyword%)")
    Page<Provider> searchProviders(@Param("userId") String userId,
                                 @Param("keyword") String keyword,
                                 Pageable pageable);
}