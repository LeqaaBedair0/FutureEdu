import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStudents } from "../services/api";   // ← افترض إنك مستوردها
import "../styles/TeacherSalary.css";

function TeacherSalary() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // جلب كل الطلاب (يمكن تحسينه لاحقاً بـ endpoint مخصص)
        const response = await getAllStudents({ page: 0, size: 1000 });

        // افتراض أن response فيه content (pagination)
        const studentList = response.content || response || [];

        // تحويل البيانات للشكل اللي نحتاجه
        const formatted = studentList.map((s) => ({
          id: s.studentCode,
          name: s.fullName,
          paid: s.amountPaid || 0,
          total: s.totalFees || 0,
          status: s.paymentStatus || "PENDING",
        }));

        setStudents(formatted);
      } catch (err) {
        console.error("خطأ في جلب بيانات المصروفات:", err);
        setError("تعذر تحميل بيانات المصروفات");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, []);

  // الحسابات بناءً على البيانات الحقيقية
  const totalCollected = students.reduce((acc, curr) => acc + curr.paid, 0);
  const totalFeesAll = students.reduce((acc, curr) => acc + curr.total, 0);
  const totalRemaining = totalFeesAll - totalCollected;

  const teacherCommissionRate = 0.10; // 10% — يمكن جلبها من الـ backend لاحقاً
  const teacherSalary = totalCollected * teacherCommissionRate;

  const fullyPaidCount = students.filter(s => s.paid >= s.total).length;
  const partialCount = students.filter(s => s.paid > 0 && s.paid < s.total).length;
  const notPaidCount = students.length - fullyPaidCount - partialCount;

  if (loading) {
    return (
      <div className="salary-page">
        <div className="salary-container">
          <p className="loading-text">جاري تحميل بيانات المصروفات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="salary-page">
        <div className="salary-container">
          <div className="error-message">
            <h3>حدث خطأ</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-page">
      <div className="salary-container">
        <header className="salary-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← رجوع
          </button>
          <h1>💰 تقرير أرباح المعلم</h1>
        </header>

        {/* ملخص سريع */}
        <div className="salary-stats">
          <div className="stat-card">
            <span className="stat-label">عدد الطلاب</span>
            <span className="stat-value">{students.length}</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-label">إجمالي المحصل (جنيه)</span>
            <span className="stat-value">{totalCollected.toLocaleString()}</span>
          </div>
          <div className="stat-card salary">
            <span className="stat-label">راتبك (10%)</span>
            <span className="stat-value">{teacherSalary.toLocaleString()}</span>
          </div>
        </div>

        {/* إحصائيات إضافية صغيرة */}
        <div className="quick-stats">
          <div>كامل الدفع: <strong>{fullyPaidCount}</strong></div>
          <div>جزئي: <strong>{partialCount}</strong></div>
          <div>لم يدفع: <strong>{notPaidCount}</strong></div>
          <div>المتبقي كلياً: <strong>{totalRemaining.toLocaleString()} ج.م</strong></div>
        </div>

        {/* الجدول التفصيلي */}
        <div className="salary-table-wrapper">
          {students.length === 0 ? (
            <div className="no-data">
              <p>لا توجد بيانات طلاب بعد</p>
            </div>
          ) : (
            <table className="salary-table">
              <thead>
                <tr>
                  <th>كود الطالب</th>
                  <th>الاسم</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>#{student.id}</td>
                    <td className="st-name">{student.name}</td>
                    <td className="paid-amount">
                      {student.paid.toLocaleString()} ج.م
                    </td>
                    <td className="remaining-amount">
                      {(student.total - student.paid).toLocaleString()} ج.م
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          student.paid >= student.total
                            ? "full"
                            : student.paid > 0
                            ? "partial"
                            : "none"
                        }`}
                      >
                        {student.paid >= student.total
                          ? "كامل"
                          : student.paid > 0
                          ? "جزئي"
                          : "لم يدفع"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherSalary;