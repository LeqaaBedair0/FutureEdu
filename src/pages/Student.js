import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import StudentCard from "../components/StudentCard";
import StudentDashboard from "../pages/StudentDashboard";
import { useAuth } from "../context/AuthContext";
import NotFound from "./NotFound";

// ─── Named imports فقط ───────────────────────────────────────
import {
  getStudentByCode,
  updateStudent,
} from "../services/api";

import "../styles/StudentCard.css";
import "../styles/StudentDashboard.css";

function Student() {
  const { id } = useParams(); // studentCode من الـ URL
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      // 1. لو جاي من AddStudent (طالب جديد)
      if (location.state?.student) {
        setStudent(location.state.student);
        setLoading(false);
        return;
      }

      // 2. جلب الطالب من MongoDB
      try {
        const data = await getStudentByCode(id);

        if (!data) {
          setError("الطالب غير موجود");
          setLoading(false);
          return;
        }

        // ────────────────────────────────────────────────
        // الحل النهائي:
        // 1. ابدأ بـ ...data عشان تحتفظ بكل الحقول الأصلية (presentDays, absentDays, lateDays, ...)
        // 2. أضف بعدها فقط الحقول اللي عايز تعدل اسمها أو تضيفها
        setStudent({
          ...data,  // ← الأهم: احتفظ بكل الحقول الأصلية (presentDays, absentDays, lateDays, examResults, ...)

          // أضف/عدل فقط الحقول اللي عايز تغير اسمها أو تضيفها
          name: data.fullName,
          id: data.studentCode,
          class: data.className || "غير محدد",
          phone_number: data.studentPhone || "غير محدد",
          parent_phone_number: data.guardianPhonePrimary || "غير محدد",
          address: data.address || "غير محدد",
          method_of_paying: data.paymentMethod || "غير محدد",

          payment_status: data.paymentStatus || "PENDING",
          total_fees: data.totalFees || 0,
          amount_paid: data.amountPaid || 0,
          currency: data.currency || "EGP",
          last_payment_date: data.lastPaymentDate || "غير محدد",

          // ضمن وجود الحقول دي (حتى لو موجودة أصلًا)
          presentDays: data.presentDays ?? 0,
          absentDays: data.absentDays ?? 0,
          lateDays: data.lateDays ?? 0,

          // اختياري: لو عايز كائن attendance إضافي
          attendance: {
            present: data.presentDays ?? 0,
            absent: data.absentDays ?? 0,
            late: data.lateDays ?? 0,
          },

          grades: data.grades || [],
          examResults: data.examResults || [],
          notes: data.notes || "لا توجد ملاحظات",
        });

        setLoading(false);
      } catch (err) {
        console.error("خطأ في جلب بيانات الطالب:", err);
        setError("تعذر تحميل بيانات الطالب");
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, location.state]);

  // ─── دالة الحفظ في MongoDB ───
  const handleSaveChanges = async (updatedData) => {
    if (!student?.studentCode) return;

    setSaveLoading(true);
    setSaveMessage("");
    setError("");

    try {
      await updateStudent(student.studentCode, updatedData);

      setStudent((prev) => ({
        ...prev,
        ...updatedData,
        name: updatedData.fullName || prev.name,
        class: updatedData.className || prev.class,
        phone_number: updatedData.studentPhone || prev.phone_number,
        parent_phone_number: updatedData.guardianPhonePrimary || prev.parent_phone_number,
        address: updatedData.address || prev.address,
        payment_status: updatedData.paymentStatus || prev.payment_status,
        total_fees: updatedData.totalFees ?? prev.total_fees,
        amount_paid: updatedData.amountPaid ?? prev.amount_paid,
        // حافظ على الحقول المهمة للـ Dashboard لو تم تعديلها
        presentDays: updatedData.presentDays ?? prev.presentDays,
        absentDays: updatedData.absentDays ?? prev.absentDays,
        lateDays: updatedData.lateDays ?? prev.lateDays,
      }));

      setSaveMessage("تم حفظ التعديلات بنجاح ✓");
    } catch (err) {
      console.error("خطأ أثناء الحفظ:", err);
      setError(err.message || "فشل في حفظ التعديلات");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>جاري تحميل بيانات الطالب...</p>;
  }

  if (error || !student) {
    return <NotFound />;
  }

  return (
    <div className="student-page">
      <div className="main-layout-wrapper">
        {/* TOP SECTION: Profile Header */}
        <section className="profile-hero">
          <StudentCard
            student={student}
            isDemo={id === "demo"}
            onUpdate={handleSaveChanges}
            saveLoading={saveLoading}
          />
          {saveMessage && (
            <p style={{ color: "green", textAlign: "center", marginTop: "10px" }}>
              {saveMessage}
            </p>
          )}
          {error && (
            <p style={{ color: "red", textAlign: "center", marginTop: "10px" }}>
              {error}
            </p>
          )}
        </section>

        {/* BOTTOM SECTION: Dashboard */}
        <section className="dashboard-section">
          <h3 className="section-divider">الأداء والإحصائيات</h3>
          <StudentDashboard student={student} />
        </section>
      </div>

      {/* Floating Buttons */}
      <div className="floating-buttons">
        <button className="float-btn" onClick={() => navigate("/search")}>
          🔍
        </button>

        <button
          className="float-btn idcard-float"
          onClick={() => navigate("/id-card", { state: { student } })}
          title="طباعة بطاقة الطالب"
        >
          🪪
        </button>

        <button
          className="float-btn salary-float"
          onClick={() => navigate("/salary")}
          title="عرض تقرير الراتب"
        >
          💰
        </button>

        <button
          className="float-btn logout"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          🚪
        </button>
      </div>
    </div>
  );
}

export default Student;