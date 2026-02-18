package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service layer for authentication operations:
 * - Login (JWT token generation)
 * - Registration
 * - Password update
 * - Email existence check
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * محاولة تسجيل الدخول وإرجاع JWT token إذا نجح
     *
     * @param email    الإيميل (case-insensitive)
     * @param password كلمة المرور المدخلة (plain text)
     * @return JWT token صالح أو null إذا فشل
     */
    public String login(String email, String password) {
        if (email == null || email.trim().isEmpty() || password == null || password.isEmpty()) {
            log.warn("Login attempt with empty email or password");
            return null;
        }

        String normalizedEmail = email.trim().toLowerCase();
        log.debug("Login attempt for email: {}", normalizedEmail);

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            log.info("No user found for email: {}", normalizedEmail);
            return null;
        }

        User user = userOpt.get();

        boolean passwordMatches = passwordEncoder.matches(password, user.getPasswordHash());
        log.debug("Password match result for {}: {}", normalizedEmail, passwordMatches);

        if (!passwordMatches) {
            return null;
        }

        // تحديث وقت آخر تسجيل دخول
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // ← التعديل المهم: تمرير الـ role ليتم إضافته في التوكن
        String role = user.getRole() != null ? user.getRole() : "USER";
        String token = jwtUtil.generateToken(user.getEmail(), role);
        log.info("Successful login for: {}", normalizedEmail);

        return token;
    }

    /**
     * التحقق من وجود إيميل معين في قاعدة البيانات
     */
    public boolean existsByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return userRepository.findByEmail(email.trim().toLowerCase()).isPresent();
    }

    /**
     * جلب مستخدم بالإيميل (مفيد في أماكن أخرى)
     */
    public Optional<User> findByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email.trim().toLowerCase());
    }

    /**
     * تسجيل مستخدم جديد
     *
     * @return الكائن User المحفوظ (مع ID الجديد)
     * @throws IllegalArgumentException إذا كان الإيميل مكرر أو البيانات غير صالحة
     */
    public User register(
            String fullName,
            String email,
            String rawPassword,
            String phoneNumber,
            String profilePictureUrl,
            String role) {

        String normalizedEmail = email.trim().toLowerCase();

        // 1. التحقق من تكرار الإيميل
        if (existsByEmail(normalizedEmail)) {
            log.warn("Registration attempt with existing email: {}", normalizedEmail);
            throw new IllegalArgumentException("الإيميل مستخدم بالفعل");
        }

        // 2. التحقق من قوة كلمة المرور
        if (rawPassword == null || rawPassword.trim().length() < 6) {
            throw new IllegalArgumentException("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        }

        // 3. التحقق من الدور (اختياري – يمكن توسيعه)
        String normalizedRole = role != null ? role.trim().toUpperCase() : null;
        if (normalizedRole != null && !isValidRole(normalizedRole)) {
            throw new IllegalArgumentException("الدور غير مدعوم: " + normalizedRole);
        }

        // 4. إنشاء المستخدم
        User user = new User();
        user.setFullName(fullName != null ? fullName.trim() : null);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(rawPassword.trim()));
        user.setPhoneNumber(phoneNumber != null ? phoneNumber.trim() : null);
        user.setProfilePictureUrl(profilePictureUrl);
        user.setRole(normalizedRole);
        user.setActive(true); // افتراضيًا نشط

        // 5. حفظ وتسجيل
        User saved = userRepository.save(user);
        log.info("New user registered successfully: id={}, email={}, name={}",
                saved.getId(), saved.getEmail(), saved.getFullName());

        return saved;
    }

    /**
     * تحديث كلمة مرور مستخدم موجود
     */
    public void updatePassword(String email, String newRawPassword) {
        String normalizedEmail = email.trim().toLowerCase();

        if (newRawPassword == null || newRawPassword.trim().length() < 6) {
            throw new IllegalArgumentException("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
        }

        Optional<User> userOpt = findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("المستخدم غير موجود");
        }

        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(newRawPassword.trim()));
        userRepository.save(user);

        log.info("Password updated successfully for user: {}", normalizedEmail);
    }

    // ────────────────── Helper Methods ──────────────────

    private boolean isValidRole(String role) {
        // يمكن توسيع القائمة حسب احتياجات المشروع
        return "ADMIN".equals(role) ||
               "TEACHER".equals(role) ||
               "PARENT".equals(role) ||
               "STUDENT".equals(role);
    }

    /**
     * للاختبار فقط – يمكن حذفها في الإنتاج
     */
    public void logUserDetails(String email) {
        findByEmail(email).ifPresentOrElse(
                user -> log.info("User found: id={}, name={}, role={}, active={}",
                        user.getId(), user.getFullName(), user.getRole(), user.isActive()),
                () -> log.warn("No user found for email: {}", email)
        );
    }
}