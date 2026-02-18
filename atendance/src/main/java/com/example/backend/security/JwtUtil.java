package com.example.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * توليد توكن مع إضافة الـ roles (اختياري لكن موصى به)
     */
    public String generateToken(String email, String role) {
        log.debug("Generating token for email: {}, role: {}", email, role);

        return Jwts.builder()
                .subject(email)
                .claim("role", role)  // ← أضفنا الـ role هنا
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    // النسخة القديمة (لو مش عايز تعدل كل مكان)
    public String generateToken(String email) {
        return generateToken(email, "USER"); // fallback
    }

    public String extractEmail(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
        } catch (Exception e) {
            log.warn("Failed to extract email from token: {}", e.getMessage());
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            log.info("Token validated successfully - subject: {}", extractEmail(token));
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("Token expired: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("Invalid JWT format: {}", e.getMessage());
        } catch (SignatureException e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected token validation error", e);
        }
        return false;
    }

    // دالة مساعدة جديدة: استخراج الـ role من التوكن
    public String extractRole(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .get("role", String.class);
        } catch (Exception e) {
            log.warn("Failed to extract role: {}", e.getMessage());
            return null;
        }
    }
}