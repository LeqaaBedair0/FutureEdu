package com.example.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "students")
public class Student {

    @Id
    private String id;

    @Indexed(unique = true)
    private String studentCode;

    private String fullName;

    private String className;
    private String division;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;

    private String guardianName;
    @Indexed
    private String guardianPhonePrimary;
    private String guardianPhoneSecondary;
    private String guardianEmail;

    private String studentPhone;
    private String studentEmail;

    private double totalFees = 0.0;
    private double amountPaid = 0.0;
    private String currency = "EGP";
    private LocalDate lastPaymentDate;
    private String paymentMethod;
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private int presentDays = 0;
    private int absentDays = 0;
    private int lateDays = 0;

    private List<AttendanceRecord> attendanceRecords = new ArrayList<>();

    private List<Grade> grades = new ArrayList<>();
    private List<ExamResult> examResults = new ArrayList<>();

    private String profilePictureUrl;
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private boolean active = true;

    // ────────────────── Constructors ──────────────────
    public Student() {
        this.grades = new ArrayList<>();
        this.examResults = new ArrayList<>();
        this.attendanceRecords = new ArrayList<>();
    }

    // Full constructor (optional)
    public Student(String id, String studentCode, String fullName, String className,
                   String division, LocalDate dateOfBirth, String gender, String address,
                   String guardianName, String guardianPhonePrimary, String guardianPhoneSecondary,
                   String guardianEmail, String studentPhone, String studentEmail,
                   double totalFees, double amountPaid, String currency, LocalDate lastPaymentDate,
                   String paymentMethod, PaymentStatus paymentStatus, int presentDays, int absentDays,
                   int lateDays, List<AttendanceRecord> attendanceRecords,
                   List<Grade> grades, List<ExamResult> examResults,
                   String profilePictureUrl, String notes, LocalDateTime createdAt,
                   LocalDateTime updatedAt, boolean active) {
        this.id = id;
        this.studentCode = studentCode;
        this.fullName = fullName;
        this.className = className;
        this.division = division;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.address = address;
        this.guardianName = guardianName;
        this.guardianPhonePrimary = guardianPhonePrimary;
        this.guardianPhoneSecondary = guardianPhoneSecondary;
        this.guardianEmail = guardianEmail;
        this.studentPhone = studentPhone;
        this.studentEmail = studentEmail;
        this.totalFees = totalFees;
        this.amountPaid = amountPaid;
        this.currency = currency;
        this.lastPaymentDate = lastPaymentDate;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.presentDays = presentDays;
        this.absentDays = absentDays;
        this.lateDays = lateDays;
        this.attendanceRecords = attendanceRecords != null ? attendanceRecords : new ArrayList<>();
        this.grades = grades != null ? grades : new ArrayList<>();
        this.examResults = examResults != null ? examResults : new ArrayList<>();
        this.profilePictureUrl = profilePictureUrl;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.active = active;
    }

    // ────────────────── Getters & Setters (كلهم يدوي) ──────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStudentCode() { return studentCode; }
    public void setStudentCode(String studentCode) { this.studentCode = studentCode; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getGuardianName() { return guardianName; }
    public void setGuardianName(String guardianName) { this.guardianName = guardianName; }

    public String getGuardianPhonePrimary() { return guardianPhonePrimary; }
    public void setGuardianPhonePrimary(String guardianPhonePrimary) { this.guardianPhonePrimary = guardianPhonePrimary; }

    public String getGuardianPhoneSecondary() { return guardianPhoneSecondary; }
    public void setGuardianPhoneSecondary(String guardianPhoneSecondary) { this.guardianPhoneSecondary = guardianPhoneSecondary; }

    public String getGuardianEmail() { return guardianEmail; }
    public void setGuardianEmail(String guardianEmail) { this.guardianEmail = guardianEmail; }

    public String getStudentPhone() { return studentPhone; }
    public void setStudentPhone(String studentPhone) { this.studentPhone = studentPhone; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public double getTotalFees() { return totalFees; }
    public void setTotalFees(double totalFees) { this.totalFees = totalFees; }

    public double getAmountPaid() { return amountPaid; }
    public void setAmountPaid(double amountPaid) { this.amountPaid = amountPaid; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public LocalDate getLastPaymentDate() { return lastPaymentDate; }
    public void setLastPaymentDate(LocalDate lastPaymentDate) { this.lastPaymentDate = lastPaymentDate; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public int getPresentDays() { return presentDays; }
    public void setPresentDays(int presentDays) { this.presentDays = presentDays; }

    public int getAbsentDays() { return absentDays; }
    public void setAbsentDays(int absentDays) { this.absentDays = absentDays; }

    public int getLateDays() { return lateDays; }
    public void setLateDays(int lateDays) { this.lateDays = lateDays; }

    public List<AttendanceRecord> getAttendanceRecords() {
        return attendanceRecords;
    }

    public void setAttendanceRecords(List<AttendanceRecord> attendanceRecords) {
        this.attendanceRecords = attendanceRecords != null ? attendanceRecords : new ArrayList<>();
    }

    public List<Grade> getGrades() {
        return grades;
    }

    public void setGrades(List<Grade> grades) {
        this.grades = grades != null ? grades : new ArrayList<>();
    }

    public List<ExamResult> getExamResults() {
        return examResults;
    }

    public void setExamResults(List<ExamResult> examResults) {
        this.examResults = examResults != null ? examResults : new ArrayList<>();
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // ────────────────── Helper methods ──────────────────

    public void incrementPresentDays() {
        this.presentDays++;
        this.updatedAt = LocalDateTime.now();
    }

    public void addAttendanceRecord(AttendanceRecord record) {
        if (record != null) {
            this.attendanceRecords.add(record);
            this.updatedAt = LocalDateTime.now();
        }
    }

    // enum
    public enum PaymentStatus {
        PENDING, PARTIAL, PAID, OVERDUE, REFUNDED
    }

    // ────────────────── Embedded classes ──────────────────

    public static class AttendanceRecord {
        private LocalDateTime dateTime;
        private String method;         // "face", "manual", "qr", etc.
        private String recordedBy;     // "system", username, etc.

        public AttendanceRecord() {}

        public AttendanceRecord(LocalDateTime dateTime, String method, String recordedBy) {
            this.dateTime = dateTime;
            this.method = method;
            this.recordedBy = recordedBy;
        }

        public LocalDateTime getDateTime() { return dateTime; }
        public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }

        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }

        public String getRecordedBy() { return recordedBy; }
        public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }
    }

    public static class Grade {
        private String subject;
        private double score;
        private double maxScore;
        private LocalDate date;
        private String comment;

        public Grade() {}

        public Grade(String subject, double score, double maxScore, LocalDate date, String comment) {
            this.subject = subject;
            this.score = score;
            this.maxScore = maxScore;
            this.date = date;
            this.comment = comment;
        }

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }

        public double getMaxScore() { return maxScore; }
        public void setMaxScore(double maxScore) { this.maxScore = maxScore; }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
    }

    public static class ExamResult {
        private String examName;
        private double obtainedMarks;
        private double totalMarks;
        private LocalDate date;
        private String gradeLetter;

        public ExamResult() {}

        public ExamResult(String examName, double obtainedMarks, double totalMarks, LocalDate date, String gradeLetter) {
            this.examName = examName;
            this.obtainedMarks = obtainedMarks;
            this.totalMarks = totalMarks;
            this.date = date;
            this.gradeLetter = gradeLetter;
        }

        public String getExamName() { return examName; }
        public void setExamName(String examName) { this.examName = examName; }

        public double getObtainedMarks() { return obtainedMarks; }
        public void setObtainedMarks(double obtainedMarks) { this.obtainedMarks = obtainedMarks; }

        public double getTotalMarks() { return totalMarks; }
        public void setTotalMarks(double totalMarks) { this.totalMarks = totalMarks; }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public String getGradeLetter() { return gradeLetter; }
        public void setGradeLetter(String gradeLetter) { this.gradeLetter = gradeLetter; }
    }
}