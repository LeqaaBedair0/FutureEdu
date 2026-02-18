package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Custom implementation of UserDetailsService for loading user data from MongoDB.
 * This service is used by Spring Security to authenticate users and load their authorities/roles.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. البحث عن المستخدم بالإيميل (case-insensitive)
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("المستخدم غير موجود بالإيميل: " + email));

        // 2. التحقق من حالة الحساب (active/disabled)
        if (!user.isActive()) {
            throw new UsernameNotFoundException("الحساب معطل: " + email);
        }

        // 3. تحويل الـ role إلى GrantedAuthority (مع prefix ROLE_)
        String role = user.getRole() != null ? user.getRole().trim().toUpperCase() : "USER";
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

        // 4. إرجاع UserDetails كامل
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(Collections.singletonList(authority))  // يدعم roles متعددة في المستقبل
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)  // لو عايز تستخدم user.isActive() هنا، ممكن
                .build();
    }
}