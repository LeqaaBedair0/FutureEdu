package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS}) // ← مؤقتًا للـ dev، غيّرها لاحقًا
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthController(AuthService authService,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ─── Login ────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        String token = authService.login(request.getEmail(), request.getPassword());

        if (token != null) {
            log.info("Login successful for: {}", request.getEmail());
            return ResponseEntity.ok(new LoginResponse(token));
        }

        log.warn("Login failed for: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("بيانات الدخول غير صحيحة"));
    }

    // ─── Register ─────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());

        // 1. التحقق من تكرار الإيميل
        if (authService.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("الإيميل مستخدم بالفعل"));
        }

        // 2. التحقق من الدور المسموح به
        String role = request.getRole().toUpperCase().trim();
        if (!"ADMIN".equals(role) && !"TEACHER".equals(role) && !"PARENT".equals(role) && !"STUDENT".equals(role)) {
            log.warn("Invalid role attempted: {}", role);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("الدور غير صالح (ADMIN, TEACHER, PARENT, STUDENT فقط)"));
        }

        // 3. إنشاء وتسجيل المستخدم
        try {
            User savedUser = authService.register(
                    request.getName(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getPhoneNumber(),
                    request.getProfilePicture(),
                    role
            );

            log.info("User registered successfully: id={}, email={}, role={}", 
                     savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new SuccessResponse("تم إنشاء الحساب بنجاح"));

        } catch (IllegalArgumentException e) {
            log.error("Registration failed due to validation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("حدث خطأ داخلي أثناء إنشاء الحساب"));
        }
    }

    // ─── DTOs ─────────────────────────────────────────────────
    public static class LoginRequest {
        @NotBlank(message = "البريد الإلكتروني مطلوب")
        @Email(message = "بريد إلكتروني غير صالح")
        private String email;

        @NotBlank(message = "كلمة المرور مطلوبة")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private final String token;
        public LoginResponse(String token) { this.token = token; }
        public String getToken() { return token; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "الاسم مطلوب")
        private String name;

        @NotBlank(message = "البريد الإلكتروني مطلوب")
        @Email(message = "بريد إلكتروني غير صالح")
        private String email;

        @NotBlank(message = "كلمة المرور مطلوبة")
        @Size(min = 6, message = "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
        private String password;

        private String phoneNumber;
        private String profilePicture;

        @NotBlank(message = "الدور مطلوب")
        private String role;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getProfilePicture() { return profilePicture; }
        public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class SuccessResponse {
        private final String message;
        public SuccessResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }

    public static class ErrorResponse {
        private final String message;
        public ErrorResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }
}