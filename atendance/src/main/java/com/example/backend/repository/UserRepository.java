package com.example.backend.repository;

import com.example.backend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;           // ← أضف السطر ده هنا
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * البحث عن مستخدم بالإيميل (أهم query في نظام الـ login)
     */
    Optional<User> findByEmail(String email);

    /**
     * البحث عن مستخدم بالاسم الكامل (fullName)
     */
    Optional<User> findByFullName(String fullName);

    /**
     * التحقق من وجود إيميل معين
     */
    boolean existsByEmail(String email);

    /**
     * البحث حسب الدور (role)
     */
    List<User> findByRole(String role);

    /**
     * جلب كل المستخدمين النشطين
     */
    List<User> findByActiveTrue();

    /**
     * جلب كل المستخدمين الغير نشطين
     */
    List<User> findByActiveFalse();

    /**
     * البحث الجزئي في الإيميل (case-insensitive)
     */
    List<User> findByEmailContainingIgnoreCase(String emailPart);
}