package com.llmctl.config;

import com.llmctl.interceptor.JwtAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC配置类
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-09-28
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final JwtAuthInterceptor jwtAuthInterceptor;

    /**
     * 配置跨域请求
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*") // 允许所有本地端口
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type")
                .allowCredentials(true)
                .maxAge(3600);
    }

    /**
     * 添加拦截器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // JWT认证拦截器
        registry.addInterceptor(jwtAuthInterceptor)
                .addPathPatterns("/**")  // 拦截所有请求
                .excludePathPatterns(
                    "/auth/**",                       // 排除所有认证相关接口
                    "/sse/**",                        // SSE端点（token在URL参数中验证）
                    "/health",                        // 健康检查接口（用于 Docker 健康检查）
                    "/actuator/**",                   // Spring Boot Actuator 监控端点（如果启用）
                    "/sessions/deactivate-all",       // 应用退出时的清理接口（无需认证）
                    "/error",                         // 错误页面
                    "/favicon.ico",                   // 网站图标
                    "/static/**",                     // 静态资源
                    "/public/**",                     // 公共资源
                    "/*.html",                        // HTML文件
                    "/*.js",                          // JS文件
                    "/*.css",                         // CSS文件
                    "/migration/**",
                    "/*.map",                          // Source map文件
                    "/users/list","/users/ids"
                );
    }
}