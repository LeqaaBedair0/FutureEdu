package com.example.backend.controller;

import com.example.backend.model.Student;
import com.example.backend.model.Student.AttendanceRecord;
import com.example.backend.model.Student.Grade;
import com.example.backend.model.Student.ExamResult;
import com.example.backend.repository.StudentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST Controller for managing students.
 */
@RestController
@RequestMapping("/api/students")
@CrossOrigin(
    origins = "http://localhost:3000",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS, RequestMethod.PATCH},
    allowCredentials = "true"
)
public class StudentController {

    private static final Logger log = LoggerFactory.getLogger(StudentController.class);

    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    @Value("${face.register.folder}")
    private String registerFolder;

    private static final List<String> ALLOWED_EXTENSIONS = List.of(".jpg", ".jpeg", ".png");
    private static final int MAX_FACE_IMAGES = 10;
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    public StudentController(
            StudentRepository studentRepository,
            ObjectMapper objectMapper,
            Validator validator) {
        this.studentRepository = studentRepository;
        this.objectMapper = objectMapper;
        this.validator = validator;
    }

    // ────────────────────────────────────────────────────────────────
    // 1. إنشاء طالب جديد + صور الوجه
    // ────────────────────────────────────────────────────────────────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<StudentResponse> createStudent(
            @RequestPart("student") String studentJson,
            @RequestPart(value = "faceImages", required = false) MultipartFile[] faceImages) {

        Student student;
        try {
            student = objectMapper.readValue(studentJson, Student.class);
            log.debug("Parsed student JSON successfully. Code: {}", student.getStudentCode());
        } catch (JsonProcessingException e) {
            log.warn("Invalid student JSON: {}", studentJson, e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "صيغة بيانات الطالب غير صحيحة: " + e.getOriginalMessage());
        }

        // Manual validation
        Set<ConstraintViolation<Student>> violations = validator.validate(student);
        if (!violations.isEmpty()) {
            String errorMsg = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .collect(Collectors.joining("; "));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMsg);
        }

        // Safe defaults
        student.setCurrency(student.getCurrency() != null ? student.getCurrency() : "EGP");
        student.setPaymentStatus(student.getPaymentStatus() != null ? student.getPaymentStatus() : Student.PaymentStatus.PENDING);
        student.setCreatedAt(student.getCreatedAt() != null ? student.getCreatedAt() : LocalDateTime.now());
        student.setUpdatedAt(student.getUpdatedAt() != null ? student.getUpdatedAt() : LocalDateTime.now());

        // Business validation
        if (student.getStudentCode() == null || student.getStudentCode().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "رقم الطالب مطلوب");
        }
        if (student.getFullName() == null || student.getFullName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "اسم الطالب مطلوب");
        }
        if (student.getTotalFees() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "إجمالي المصروفات لا يمكن أن يكون سالبًا");
        }

        if (studentRepository.existsByStudentCode(student.getStudentCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "رقم الطالب موجود بالفعل");
        }

        Student saved = studentRepository.save(student);
        log.info("Student created: code={}, name={}, id={}", saved.getStudentCode(), saved.getFullName(), saved.getId());

        // Save face images
        int savedImageCount = 0;
        if (faceImages != null && faceImages.length > 0) {
            if (faceImages.length > MAX_FACE_IMAGES) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "الحد الأقصى لعدد الصور هو " + MAX_FACE_IMAGES);
            }

            try {
                Path studentDir = Paths.get(registerFolder, saved.getStudentCode());
                Files.createDirectories(studentDir);

                for (MultipartFile file : faceImages) {
                    if (file == null || file.isEmpty()) continue;
                    if (file.getSize() > MAX_FILE_SIZE) continue;

                    String origName = file.getOriginalFilename();
                    if (origName == null) continue;

                    String ext = origName.substring(origName.lastIndexOf(".")).toLowerCase();
                    if (!ALLOWED_EXTENSIONS.contains(ext)) continue;

                    String safeName = "face_" + System.currentTimeMillis() + ext;
                    Path target = studentDir.resolve(safeName);
                    file.transferTo(target.toFile());
                    savedImageCount++;
                }

                if (savedImageCount > 0) {
                    log.info("Saved {} face images for student {}", savedImageCount, saved.getStudentCode());
                }
            } catch (IOException e) {
                log.error("Failed to save face images for student {}: {}", saved.getStudentCode(), e.getMessage(), e);
                // لا نُفشل الطلب كله
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(new StudentResponse(saved));
    }

    // ────────────────────────────────────────────────────────────────
    // 2. جلب طالب بواسطة الكود
    // ────────────────────────────────────────────────────────────────
    @GetMapping("/code/{code}")
    public ResponseEntity<StudentResponse> getStudentByCode(@PathVariable String code) {
        return studentRepository.findByStudentCode(code)
                .map(s -> ResponseEntity.ok(new StudentResponse(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ────────────────────────────────────────────────────────────────
    // 3. جلب كل الطلاب (مع تصفح وترتيب)
    // ────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Page<StudentResponse>> getAllStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Student> studentsPage = studentRepository.findAll(pageable);
        Page<StudentResponse> responsePage = studentsPage.map(StudentResponse::new);

        return ResponseEntity.ok(responsePage);
    }

    // ────────────────────────────────────────────────────────────────
    // 4. تعديل بيانات الطالب الأساسية (PATCH)
    // ────────────────────────────────────────────────────────────────
    @PatchMapping("/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable String code,
            @RequestBody Map<String, Object> updates) {

        Student student = studentRepository.findByStudentCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الطالب غير موجود"));

        // تحديث الحقول المرسلة فقط
        updates.forEach((key, value) -> {
            switch (key) {
                case "fullName" -> student.setFullName((String) value);
                case "className" -> student.setClassName((String) value);
                case "division" -> student.setDivision((String) value);
                case "address" -> student.setAddress((String) value);
                case "guardianPhonePrimary" -> student.setGuardianPhonePrimary((String) value);
                case "guardianPhoneSecondary" -> student.setGuardianPhoneSecondary((String) value);
                case "notes" -> student.setNotes((String) value);
                case "totalFees" -> student.setTotalFees(((Number) value).doubleValue());
                case "amountPaid" -> student.setAmountPaid(((Number) value).doubleValue());
                case "active" -> student.setActive((Boolean) value);
                // أضف المزيد حسب الحاجة
            }
        });

        student.setUpdatedAt(LocalDateTime.now());
        Student updated = studentRepository.save(student);

        log.info("Student updated: code={}", code);
        return ResponseEntity.ok(new StudentResponse(updated));
    }

    // ────────────────────────────────────────────────────────────────
    // 5. إضافة درجة أو نتيجة امتحان
    // ────────────────────────────────────────────────────────────────
    @PatchMapping("/{code}/grade")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<StudentResponse> addGradeOrExam(
            @PathVariable String code,
            @RequestBody GradeOrExamRequest request) {

        Student student = studentRepository.findByStudentCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الطالب غير موجود"));

        if ("grade".equalsIgnoreCase(request.type)) {
            Grade grade = new Grade(
                    request.subject,
                    request.score,
                    request.maxScore,
                    request.date != null ? request.date : LocalDate.now(),
                    request.comment
            );
            student.getGrades().add(grade);
        } else if ("exam".equalsIgnoreCase(request.type)) {
            ExamResult exam = new ExamResult(
                    request.examName,
                    request.obtainedMarks,
                    request.totalMarks,
                    request.date != null ? request.date : LocalDate.now(),
                    request.gradeLetter
            );
            student.getExamResults().add(exam);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "نوع غير مدعوم: استخدم 'grade' أو 'exam'");
        }

        student.setUpdatedAt(LocalDateTime.now());
        Student updated = studentRepository.save(student);

        log.info("Added {} for student: {}", request.type, code);
        return ResponseEntity.ok(new StudentResponse(updated));
    }

    // ────────────────────────────────────────────────────────────────
    // 6. تسجيل حضور (يدوي أو بالوجه)
    // ────────────────────────────────────────────────────────────────
    @PostMapping("/{code}/attend")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'TEACHER')")
    public ResponseEntity<StudentResponse> recordAttendance(
            @PathVariable String code,
            @RequestBody(required = false) Map<String, String> body) {

        Student student = studentRepository.findByStudentCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الطالب غير موجود"));

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        // منع التكرار في نفس اليوم (اختياري – يمكن إزالته إذا أردت السماح بتعديل الحضور)
        boolean alreadyToday = student.getAttendanceRecords().stream()
                .anyMatch(r -> r.getDateTime().toLocalDate().equals(today));

        if (alreadyToday) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "تم تسجيل حضور الطالب اليوم بالفعل");
        }

        String method = body != null ? body.getOrDefault("method", "manual") : "manual";
        String recordedBy = body != null ? body.getOrDefault("recordedBy", "system") : "system";

        AttendanceRecord record = new AttendanceRecord(now, method, recordedBy);
        student.addAttendanceRecord(record);
        student.incrementPresentDays();

        Student updated = studentRepository.save(student);

        log.info("Attendance recorded for {} at {} by {}", code, now, recordedBy);
        return ResponseEntity.ok(new StudentResponse(updated));
    }
// ────────────────────────────────────────────────────────────────
// 7. إضافة صور وجه إضافية للطالب الموجود (لتحسين التعرف)
// ────────────────────────────────────────────────────────────────
    @PostMapping(value = "/{code}/face-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<StudentResponse> addFaceImages(
            @PathVariable String code,
            @RequestPart(value = "faceImages", required = true) MultipartFile[] faceImages) {

        if (faceImages == null || faceImages.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "يجب رفع صورة واحدة على الأقل");
        }

        Student student = studentRepository.findByStudentCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الطالب غير موجود"));

        int savedImageCount = 0;

        try {
            Path studentDir = Paths.get(registerFolder, code);
            if (!Files.exists(studentDir)) {
                Files.createDirectories(studentDir);
            }

            for (MultipartFile file : faceImages) {
                if (file == null || file.isEmpty()) continue;
                if (file.getSize() > MAX_FILE_SIZE) {
                    log.warn("تجاهل ملف كبير: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
                    continue;
                }

                String origName = file.getOriginalFilename();
                if (origName == null) continue;

                String ext = origName.substring(origName.lastIndexOf(".")).toLowerCase();
                if (!ALLOWED_EXTENSIONS.contains(ext)) {
                    log.warn("صيغة غير مدعومة: {}", origName);
                    continue;
                }

                String safeName = "face_" + System.currentTimeMillis() + "_" + (savedImageCount + 1) + ext;
                Path target = studentDir.resolve(safeName);
                file.transferTo(target.toFile());
                savedImageCount++;
            }

            if (savedImageCount == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "لم يتم حفظ أي صور صالحة");
            }

            log.info("تم إضافة {} صور وجه جديدة للطالب {}", savedImageCount, code);

            // إعادة جلب الطالب بعد التحديث (اختياري، لكن مفيد)
            Student updated = studentRepository.findByStudentCode(code).orElse(student);

            return ResponseEntity.ok(new StudentResponse(updated));

        } catch (IOException e) {
            log.error("فشل في حفظ صور الوجه للطالب {}: {}", code, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "فشل في حفظ الصور: " + e.getMessage());
        }
    }
// **************************************************
// بعد حفظ الطالب
    if (faceImages != null && faceImages.length > 0) {
        String studentCode = savedStudent.getStudentCode();
        Path studentFaceDir = Paths.get(registerFolder, studentCode);

        try {
            Files.createDirectories(studentFaceDir);

            for (MultipartFile file : faceImages) {
                if (!file.isEmpty()) {
                    String fileName = file.getOriginalFilename();
                    Path dest = studentFaceDir.resolve(fileName);
                    Files.copy(file.getInputStream(), dest);
                }
            }

            // أخبر الـ face server
            RestTemplate rest = new RestTemplate();
            String faceServerUrl = "http://localhost:8000/register_new_face";
            Map<String, String> payload = new HashMap<>();
            payload.put("student_code", studentCode);

            rest.postForObject(faceServerUrl, payload, String.class);
            log.info("Sent registration request to face server for student: {}", studentCode);

        } catch (Exception e) {
            log.error("Failed to register face for student {}: {}", studentCode, e.getMessage(), e);
            // مش لازم ترمي exception، خلّي الإضافة تنجح حتى لو الوجه ما سجلش
        }
    }
    // ────────────────────────────────────────────────────────────────
    // DTOs
    // ────────────────────────────────────────────────────────────────

    public static class StudentResponse {
        private final String id;
        private final String studentCode;
        private final String fullName;
        private final String className;
        private final String division;
        private final String guardianPhonePrimary;
        private final double totalFees;
        private final double amountPaid;
        private final Student.PaymentStatus paymentStatus;
        private final String currency;
        private final String notes;
        private final boolean active;
        private final List<Student.AttendanceRecord> attendanceRecords;
        private final List<Student.Grade> grades;
        private final List<Student.ExamResult> examResults;

        public StudentResponse(Student s) {
            this.id = s.getId();
            this.studentCode = s.getStudentCode();
            this.fullName = s.getFullName();
            this.className = s.getClassName();
            this.division = s.getDivision();
            this.guardianPhonePrimary = s.getGuardianPhonePrimary();
            this.totalFees = s.getTotalFees();
            this.amountPaid = s.getAmountPaid();
            this.paymentStatus = s.getPaymentStatus();
            this.currency = s.getCurrency();
            this.notes = s.getNotes();
            this.active = s.isActive();
            this.attendanceRecords = new ArrayList<>(s.getAttendanceRecords());
            this.grades = new ArrayList<>(s.getGrades());
            this.examResults = new ArrayList<>(s.getExamResults());
        }

        // getters ...
        public String getId() { return id; }
        public String getStudentCode() { return studentCode; }
        public String getFullName() { return fullName; }
        public String getClassName() { return className; }
        public String getDivision() { return division; }
        public String getGuardianPhonePrimary() { return guardianPhonePrimary; }
        public double getTotalFees() { return totalFees; }
        public double getAmountPaid() { return amountPaid; }
        public Student.PaymentStatus getPaymentStatus() { return paymentStatus; }
        public String getCurrency() { return currency; }
        public String getNotes() { return notes; }
        public boolean isActive() { return active; }
        public List<Student.AttendanceRecord> getAttendanceRecords() { return attendanceRecords; }
        public List<Student.Grade> getGrades() { return grades; }
        public List<Student.ExamResult> getExamResults() { return examResults; }
    }

    // DTO لإضافة درجة أو امتحان
    public static class GradeOrExamRequest {
        public String type;           // "grade" or "exam"
        public String subject;        // للدرجة
        public double score;
        public double maxScore;
        public LocalDate date;
        public String comment;

        public String examName;       // للامتحان
        public double obtainedMarks;
        public double totalMarks;
        public String gradeLetter;
    }
}