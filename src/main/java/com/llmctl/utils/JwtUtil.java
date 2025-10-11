package com.llmctl.utils;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT工具类
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration; // 默认24小时（毫秒）

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration; // 默认7天（毫秒）

    /**
     * 生成JWT Access Token
     *
     * @param userId 用户ID
     * @param username 用户名
     * @return JWT Token字符串
     */
    public String generateAccessToken(Long userId, String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("type", "access");

        return createToken(claims, username, expiration);
    }

    /**
     * 生成JWT Refresh Token
     *
     * @param userId 用户ID
     * @param username 用户名
     * @return Refresh Token字符串
     */
    public String generateRefreshToken(Long userId, String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("type", "refresh");

        return createToken(claims, username, refreshExpiration);
    }

    /**
     * 创建Token
     */
    private String createToken(Map<String, Object> claims, String subject, Long expiration) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 从Token中提取用户名
     */
    public String getUsernameFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    /**
     * 从Token中提取用户ID
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get("userId", Long.class);
    }

    /**
     * 验证Token是否有效
     *
     * @param token JWT Token
     * @param username 用户名
     * @return 是否有效
     */
    public boolean validateToken(String token, String username) {
        try {
            final String tokenUsername = getUsernameFromToken(token);
            return (tokenUsername.equals(username) && !isTokenExpired(token));
        } catch (Exception e) {
            log.error("Token验证失败", e);
            return false;
        }
    }

    /**
     * 检查Token是否过期
     */
    private boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    /**
     * 获取Token过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimsFromToken(token).getExpiration();
    }

    /**
     * 解析Token获取Claims
     */
    private Claims getClaimsFromToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 检查Token是否即将过期（还剩不到1小时）
     */
    public boolean isTokenExpiringSoon(String token) {
        Date expiration = getExpirationDateFromToken(token);
        long timeLeft = expiration.getTime() - System.currentTimeMillis();
        return timeLeft < 3600000; // 1小时
    }

    /**
     * 获取Access Token过期时间（秒）
     */
    public Long getAccessTokenExpiration() {
        return expiration / 1000;
    }

    /**
     * 获取Refresh Token过期时间（秒）
     */
    public Long getRefreshTokenExpiration() {
        return refreshExpiration / 1000;
    }
}
