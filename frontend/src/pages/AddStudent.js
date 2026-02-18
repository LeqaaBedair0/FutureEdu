import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/AddStudent.css";

function AddStudent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    studentCode: "",
    fullName: "",
    className: "",
    division: "",
    guardianPhonePrimary: "",
    totalFees: "",
    amountPaid: "0",
    paymentStatus: "PENDING",
    notes: "",
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);

    // تنظيف المعاينات القديمة
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // تنظيف المعاينات عند الخروج من الكومبوننت
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("===== زر 'حفظ الطالب' تم الضغط عليه =====");

    setError("");
    setSuccessMessage("");
    setLoading(true);

    // التحقق الأساسي
    if (!formData.studentCode.trim()) {
      setError("رقم الطالب مطلوب");
      setLoading(false);
      return;
    }
    if (!formData.fullName.trim()) {
      setError("اسم الطالب مطلوب");
      setLoading(false);
      return;
    }
    if (formData.guardianPhonePrimary && !/^\d{10,11}$/.test(formData.guardianPhonePrimary.trim())) {
      setError("رقم ولي الأمر يجب أن يكون 10 أو 11 رقم");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("يرجى تسجيل الدخول أولاً");
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    console.log("التحقق نجح - التوكن موجود");

    // بناء بيانات الطالب
    const studentData = {
      studentCode: formData.studentCode.trim(),
      fullName: formData.fullName.trim(),
      className: formData.className.trim() || null,
      division: formData.division.trim() || null,
      guardianPhonePrimary: formData.guardianPhonePrimary.trim() || null,
      totalFees: Number(formData.totalFees) || 0,
      amountPaid: Number(formData.amountPaid) || 0,
      paymentStatus: formData.paymentStatus || "PENDING",
      notes: formData.notes.trim() || null,
    };

    // بناء FormData
    const formDataToSend = new FormData();
    formDataToSend.append("student", JSON.stringify(studentData));

    // إضافة الصور (حتى لو صورة واحدة فقط)
    images.forEach((file) => {
      formDataToSend.append("faceImages", file);
    });

    console.log("===== جاري إرسال الطلب =====");
    console.log("Student JSON:", JSON.stringify(studentData, null, 2));
    console.log("عدد الصور المرفوعة:", images.length);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/students",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // axios سيضيف Content-Type: multipart/form-data تلقائيًا
          },
          timeout: 45000, // 45 ثانية (كافي لرفع صور + حفظ)
        }
      );

      console.log("نجاح! الحالة:", response.status);
      const newStudent = response.data;

      // ─── الجزء التلقائي المهم ───
      // طلب تسجيل الوجه تلقائيًا في الـ face server
      try {
        await axios.post("http://localhost:8000/register_new_face", {
          student_code: newStudent.studentCode,
        });
        console.log("تم طلب تسجيل الوجه تلقائيًا للطالب:", newStudent.studentCode);
        setSuccessMessage("تم إضافة الطالب وتسجيل الوجه بنجاح!");
      } catch (faceErr) {
        console.warn("فشل طلب تسجيل الوجه (لكن الطالب تم إضافته):", faceErr);
        setSuccessMessage("تم إضافة الطالب بنجاح، لكن تسجيل الوجه فشل. يرجى المحاولة لاحقًا.");
      }

      // الانتقال لصفحة الطالب
      navigate(`/student/${newStudent.studentCode}`, {
        state: { newStudent },
        replace: true,
      });

    } catch (err) {
      console.error("خطأ أثناء الإضافة:", err);

      let errorMsg = "حدث خطأ غير متوقع";
      const status = err.response?.status;

      if (err.response) {
        if (status === 409) {
          errorMsg = "رقم الطالب موجود بالفعل. اختر رقمًا جديدًا.";
        } else if (status === 401 || status === 403) {
          errorMsg = "انتهت الجلسة أو ليس لديك صلاحية. يرجى تسجيل الدخول مجددًا.";
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else if (status === 400 || status === 422) {
          errorMsg = err.response.data?.message || "خطأ في البيانات المرسلة";
        } else if (status === 500) {
          errorMsg = "خطأ داخلي في السيرفر. يرجى المحاولة لاحقًا.";
        } else {
          errorMsg = `فشل الإضافة (${status}) - ${err.response.data?.message || err.message}`;
        }
      } else if (err.request) {
        errorMsg = "لا يمكن الاتصال بالسيرفر. تحقق من الشبكة أو السيرفر.";
      } else {
        errorMsg = err.message || "خطأ غير معروف";
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
      console.log("===== انتهت عملية الإضافة =====");
    }
  };

  return (
    <div className="add-student-page">
      <div className="form-card">
        <h2>إضافة طالب جديد</h2>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم الطالب *</label>
            <input
              required
              type="text"
              name="fullName"
              placeholder="مثال: أحمد علي"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>رقم الطالب (باركود) *</label>
            <input
              required
              type="text"
              name="studentCode"
              placeholder="مثال: STU2026001"
              value={formData.studentCode}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>الفصل</label>
              <input
                type="text"
                name="className"
                placeholder="مثال: أولى ثانوي"
                value={formData.className}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>الشعبة (اختياري)</label>
              <input
                type="text"
                name="division"
                placeholder="مثال: علمي"
                value={formData.division}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>إجمالي المصروفات</label>
              <input
                type="number"
                name="totalFees"
                placeholder="مثال: 15000"
                value={formData.totalFees}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>المبلغ المدفوع</label>
              <input
                type="number"
                name="amountPaid"
                placeholder="مثال: 5000"
                value={formData.amountPaid}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>تليفون ولي الأمر *</label>
            <input
              required
              type="tel"
              name="guardianPhonePrimary"
              placeholder="مثال: 01012345678"
              value={formData.guardianPhonePrimary}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>رفع صورة الوجه للتعرف (صورة واحدة كافية)</label>
            <input
              type="file"
              accept="image/*"
              multiple // يمكنك إزالة multiple لو عايز صورة واحدة فقط
              onChange={handleImageChange}
              disabled={loading}
            />
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-preview-container">
              {imagePreviews.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`معاينة الصورة ${index + 1}`}
                  className="image-preview"
                  style={{ width: "120px", height: "120px", objectFit: "cover", margin: "5px", borderRadius: "8px" }}
                />
              ))}
            </div>
          )}

          <div className="form-group">
            <label>ملاحظات (اختياري)</label>
            <textarea
              name="notes"
              placeholder="أي ملاحظات إضافية..."
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="button-group">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "جاري الحفظ وتسجيل الوجه..." : "حفظ الطالب"}
            </button>

            <button type="button" className="btn-cancel" onClick={() => navigate(-1)} disabled={loading}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudent;