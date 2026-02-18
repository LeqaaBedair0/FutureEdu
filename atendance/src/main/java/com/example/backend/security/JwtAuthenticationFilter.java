package com.example.backend.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        log.info("===== JwtFilter بدأ معالجة الطلب: {} {} =====",
                 request.getMethod(), request.getRequestURI());

        String authHeader = request.getHeader("Authorization");
        log.info("Authorization Header: {}", 
                 authHeader != null ? authHeader.substring(0, Math.min(40, authHeader.length())) + "..." : "MISSING");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("No valid Bearer token found → تخطي المصادقة");
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7).trim();
        log.debug("Extracted JWT (first 60 chars): {}", 
                  jwt.length() > 60 ? jwt.substring(0, 60) + "..." : jwt);

        String username = null;
        try {
            username = jwtUtil.extractEmail(jwt);
            log.info("تم استخراج الـ username بنجاح: {}", username);
        } catch (ExpiredJwtException e) {
            log.warn("التوكن منتهي الصلاحية: {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        } catch (MalformedJwtException e) {
            log.warn("صيغة التوكن غير صحيحة (Malformed): {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        } catch (SignatureException e) {
            log.warn("توقيع التوكن غير صالح (Invalid signature): {}", e.getMessage());
            filterChain.doFilter(request, response);
            return;
        } catch (Exception e) {
            log.error("فشل في استخراج الـ username من التوكن", e);
            filterChain.doFilter(request, response);
            return;
        }

        if (username == null || username.isBlank()) {
            log.warn("الـ username فارغ أو null → تخطي المصادقة");
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            log.info("لا يوجد مصادقة حالية → تحميل UserDetails لـ: {}", username);

            UserDetails userDetails = null;
            try {
                userDetails = userDetailsService.loadUserByUsername(username);
                log.info("تم تحميل UserDetails بنجاح - الصلاحيات: {}", 
                         userDetails.getAuthorities());
            } catch (Exception e) {
                log.error("فشل تحميل UserDetails للمستخدم {}: {}", username, e.getMessage(), e);
                filterChain.doFilter(request, response);
                return;
            }

            boolean tokenValid = false;
            try {
                tokenValid = jwtUtil.validateToken(jwt);
                log.info("نتيجة التحقق من التوكن: {}", tokenValid ? "VALID" : "INVALID");
            } catch (Exception e) {
                log.error("خطأ غير متوقع أثناء التحقق من التوكن لـ {}: {}", 
                          username, e.getMessage(), e);
            }

            if (tokenValid) {
                log.info("التوكن صالح → إعداد المصادقة للمستخدم {} مع الصلاحيات: {}", 
                         username, userDetails.getAuthorities());

                UsernamePasswordAuthenticationToken authToken = 
                    new UsernamePasswordAuthenticationToken(
                        userDetails, 
                        null, 
                        userDetails.getAuthorities()
                    );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                log.warn("التوكن غير صالح → لم يتم إعداد المصادقة لـ {}", username);
            }
        } else {
            log.debug("المصادقة موجودة بالفعل → تخطي إعدادها");
        }

        log.debug("===== JwtFilter انتهى → متابعة سلسلة الفلاتر =====");
        filterChain.doFilter(request, response);
    }
}