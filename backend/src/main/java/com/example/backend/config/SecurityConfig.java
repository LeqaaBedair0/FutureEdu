package com.example.backend.config;

import com.example.backend.security.JwtAuthenticationFilter;
import com.example.backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Security Configuration for the application.
 * - Stateless JWT authentication (no sessions)
 * - CORS for React frontend (fixed properly)
 * - Public endpoints: auth (login/register) + camera
 * - Protected endpoints: students (POST/PUT/DELETE require ADMIN/STAFF)
 * - Custom JSON responses for 401/403 errors
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("Initializing SecurityFilterChain with JWT stateless authentication");

        http
                // Disable CSRF (not needed with JWT stateless)
                .csrf(csrf -> csrf.disable())

                // No server-side sessions (pure JWT)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Enable CORS globally (this is the correct place!)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Define authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (no auth needed)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/camera/**").permitAll()

                        // Allow GET for students (view list/details without login)
                        .requestMatchers(HttpMethod.GET, "/api/students/**").permitAll()

                        // Protect write operations on students (add, update, delete)
                        .requestMatchers(HttpMethod.POST, "/api/students/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.PUT, "/api/students/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers(HttpMethod.DELETE, "/api/students/**").hasAnyRole("ADMIN", "STAFF")

                        // Any other endpoint requires authentication
                        .anyRequest().authenticated()
                )

                // Add JWT filter before the default UsernamePasswordAuthenticationFilter
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtUtil, userDetailsService),
                        UsernamePasswordAuthenticationFilter.class
                )

                // Custom JSON error responses for auth failures
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, ex1) -> {
                            log.warn("Authentication entry point triggered: {}", ex1.getMessage());
                            res.setStatus(401);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"يرجى تسجيل الدخول للوصول إلى هذا المورد\"}");
                        })
                        .accessDeniedHandler((req, res, ex1) -> {
                            log.warn("Access denied: {}", ex1.getMessage());
                            res.setStatus(403);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"الوصول مرفوض - صلاحيات غير كافية\"}");
                        })
                );

        return http.build();
    }

    /**
     * CORS Configuration: Allow frontend (React) to connect
     * This is the correct place when using Spring Security
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
                // أضف domains الـ production لاحقًا، مثل: "https://yourdomain.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization")); // مهم لو بتعرض التوكن
        configuration.setAllowCredentials(true); // مهم لو فيه cookies أو auth في المستقبل
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Password Encoder Bean (BCrypt - secure and recommended)
     */

}