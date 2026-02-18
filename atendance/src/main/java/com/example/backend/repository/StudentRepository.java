package com.example.backend.repository;

import com.example.backend.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Student entities.
 * Provides standard CRUD operations via MongoRepository
 * and custom query methods commonly needed in school/attendance/payment systems.
 */
@Repository
public interface StudentRepository extends MongoRepository<Student, String> {

    // ────────────────────────────────────────────────
    //  Core / Most frequently used queries
    // ────────────────────────────────────────────────

    /**
     * Find student by unique student code (most important lookup)
     */
    Optional<Student> findByStudentCode(String studentCode);

    /**
     * Check if student code already exists (used in create/update validation)
     */
    boolean existsByStudentCode(String studentCode);

    // ────────────────────────────────────────────────
    //  Class / Section / Name searches
    // ────────────────────────────────────────────────

    List<Student> findByClassName(String className);

    List<Student> findByClassNameAndDivision(String className, String division);

    List<Student> findByFullNameContainingIgnoreCase(String namePart);

    // Partial name search with class filter (common in attendance / report screens)
    List<Student> findByFullNameContainingIgnoreCaseAndClassName(String namePart, String className);

    // ────────────────────────────────────────────────
    //  Guardian / Contact lookup (useful when parent calls)
    // ────────────────────────────────────────────────

    List<Student> findByGuardianPhonePrimaryOrGuardianPhoneSecondary(String phone);

    Optional<Student> findByGuardianPhonePrimary(String phone);

    Optional<Student> findByGuardianPhoneSecondary(String phone);

    // ────────────────────────────────────────────────
    //  Attendance related queries
    // ────────────────────────────────────────────────

    /**
     * Students with low attendance (warning / follow-up list)
     */
    List<Student> findByAbsentDaysGreaterThanEqual(int minAbsentDays);

    /**
     * Students who were present today (for daily report)
     */
    @Query("{ 'attendanceRecords.dateTime' : { $gte : ?0, $lt : ?1 } }")
    List<Student> findStudentsPresentToday(LocalDateTime startOfDay, LocalDateTime endOfDay);

    /**
     * Students who have attendance record on a specific date
     */
    @Query("{ 'attendanceRecords.dateTime' : { $gte : ?0, $lt : ?1 } }")
    List<Student> findByAttendanceOnDate(LocalDateTime start, LocalDateTime end);

    // ────────────────────────────────────────────────
    //  Payment / Financial status queries
    // ────────────────────────────────────────────────

    List<Student> findByPaymentStatus(Student.PaymentStatus status);

    List<Student> findByPaymentStatusNot(Student.PaymentStatus status);

    /**
     * Students who still owe money (practical filter)
     */
    List<Student> findByAmountPaidLessThan(double totalFees);

    /**
     * Overdue / pending payments sorted by amount remaining
     */
    List<Student> findByPaymentStatusOrderByTotalFeesDesc(Student.PaymentStatus status);

    // ────────────────────────────────────────────────
    //  Active / Inactive students
    // ────────────────────────────────────────────────

    List<Student> findByActive(boolean active);

    List<Student> findByActiveTrue();

    List<Student> findByActiveFalse();

    // ────────────────────────────────────────────────
    //  Paginated / Sorted queries (useful for tables / reports)
    // ────────────────────────────────────────────────

    Page<Student> findByClassName(String className, Pageable pageable);

    Page<Student> findByFullNameContainingIgnoreCase(String namePart, Pageable pageable);

    Page<Student> findByPaymentStatus(Student.PaymentStatus status, Pageable pageable);

    Page<Student> findAllByOrderByFullNameAsc(Pageable pageable);

    Page<Student> findAllByOrderByAbsentDaysDesc(Pageable pageable);

    // ────────────────────────────────────────────────
    //  Advanced / Reporting style queries (examples)
    // ────────────────────────────────────────────────

    /**
     * Students who have not attended for the last N days
     * (can be used for absence alerts)
     */
    @Query("{ 'attendanceRecords.dateTime' : { $lt : ?0 } }")
    List<Student> findStudentsWithNoAttendanceSince(LocalDateTime since);

    /**
     * Count students per class (can be used in dashboard)
     */
    long countByClassName(String className);

    long countByPaymentStatus(Student.PaymentStatus status);

    long countByActive(boolean active);

    // You can keep adding more domain-specific methods as needed
}