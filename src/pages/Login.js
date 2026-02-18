import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";
import Toast from "../components/Toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [remember, setRemember] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // ─── Load remembered email if exists ───
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!email?.trim()) {
      setError("البريد الإلكتروني مطلوب");
      return;
    }
    if (!password) {
      setError("كلمة المرور مطلوبة");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("استجابة الخادم غير متوقعة");
      }

      if (response.ok) {
        // ─── Success ───
        login(data.token, remember);

        // Remember email if checked
        if (remember) {
          localStorage.setItem("rememberedEmail", email.trim().toLowerCase());
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        setToast({
          message: "تم تسجيل الدخول بنجاح ✓",
          type: "success",
        });

        setTimeout(() => {
          navigate("/search", { replace: true });
        }, 800);
      } else {
        // ─── Server error responses ───
        const errorMessage =
          data?.message ||
          data?.error ||
          (response.status === 401
            ? "بيانات الدخول غير صحيحة"
            : response.status === 403
            ? "الحساب غير مفعّل أو ممنوع الدخول"
            : "حدث خطأ في الخادم");

        setError(errorMessage);
        setToast({ message: errorMessage, type: "error" });
      }
    } catch (err) {
      // ─── Network / timeout / CORS errors ───
      console.error("Login error:", err);

      let friendlyMessage = "حدث خطأ أثناء تسجيل الدخول";

      if (err.name === "TypeError" && err.message.includes("fetch")) {
        friendlyMessage =
          "تعذر الاتصال بالخادم. هل السيرفر يعمل؟ (localhost:8080)";
      } else if (err.message.includes("timeout")) {
        friendlyMessage = "انتهت مهلة الاتصال بالخادم";
      }

      setError(friendlyMessage);
      setToast({ message: friendlyMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Professor Portal</h1>
        <p>الدخول الآمن لبوابة المدرسين</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <div className="options-row">
            <div className="remember-container">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember">تذكرني</label>
            </div>

            <a href="#" className="forgot-password">
              نسيت كلمة المرور؟
            </a>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className={`login-btn ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> جاري الدخول...
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Login;