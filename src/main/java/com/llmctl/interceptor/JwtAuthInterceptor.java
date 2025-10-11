package com.llmctl.interceptor;

import com.llmctl.context.UserContext;
import com.llmctl.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT认证拦截器
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                            Object handler) throws Exception {

        // 0. 放行 OPTIONS 预检请求（CORS preflight）
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            log.debug("放行 OPTIONS 预检请求: {}", request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_OK);
            return true;
        }

        // 1. 从Authorization Header读取Token
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("缺少Authorization Header: {} {}", request.getMethod(), request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"未登录或Token已失效\"}");
            return false;
        }

        String token = authHeader.substring(7);  // 去掉"Bearer "前缀

        try {
            // 2. 验证Token并提取用户信息
            Long userId = jwtUtil.getUserIdFromToken(token);
            String username = jwtUtil.getUsernameFromToken(token);

            // 3. 验证Token是否有效
            if (!jwtUtil.validateToken(token, username)) {
                log.warn("无效的Token: username={}", username);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":401,\"message\":\"Token已过期或无效\"}");
                return false;
            }

            // 4. 设置用户上下文
            UserContext.setUserId(userId);
            UserContext.setUsername(username);

            log.debug("JWT认证成功: userId={}, username={}", userId, username);
            return true;

        } catch (Exception e) {
            log.error("JWT认证失败", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"Token解析失败\"}");
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                               Object handler, Exception ex) {
        // 清除用户上下文
        UserContext.clear();
    }
}
