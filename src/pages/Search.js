import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Quagga from "@ericblade/quagga2";

// استيراد الدوال اللي هنستخدمها فعليًا
import {
  getStudentByCode,
  getAllStudents,
  recordAttendance,
} from "../services/api";

import "../styles/Search.css";

function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRecognized, setLastRecognized] = useState(null);

  const barcodeScannerRef = useRef(null);
  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const intervalRef = useRef(null);

  const navigate = useNavigate();
  const { logout } = useAuth();

  // ─── البحث اليدوي برقم أو اسم ───
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("أدخل رقم الطالب أو الاسم");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      let student = await getStudentByCode(searchQuery.trim());

      if (!student) {
        const result = await getAllStudents({ page: 0, size: 50 });
        student = result.content?.find(
          (s) => s.fullName?.toLowerCase().includes(searchQuery.trim().toLowerCase())
        );
      }

      if (!student) {
        setMessage(`❌ لم يتم العثور على طالب برقم أو اسم "${searchQuery}"`);
        return;
      }

      if (attendanceMode) {
        await recordAttendance(student.studentCode, "manual");
        setMessage(`✅ تم تسجيل حضور ${student.fullName} يدويًا`);
      } else {
        navigate(`/student/${student.studentCode}`);
      }
    } catch (err) {
      console.error("خطأ أثناء البحث:", err);
      setError(err.message || "حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };

  // ─── Barcode Scanner ───
  useEffect(() => {
    if (!barcodeScanning || !barcodeScannerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: barcodeScannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment",
          },
        },
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader"],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          setError("تعذر تشغيل ماسح الباركود");
          setBarcodeScanning(false);
          return;
        }
        Quagga.start();
      }
    );

    const onDetected = (data) => {
      const code = data?.codeResult?.code;
      if (code) {
        setBarcodeScanning(false);
        Quagga.stop();

        if (attendanceMode) {
          recordAttendance(code, "barcode")
            .then(() => setMessage(`✅ تم تسجيل حضور برقم ${code} (باركود)`))
            .catch((err) => {
              console.error(err);
              setError("تم مسح الباركود لكن فشل تسجيل الحضور");
            });
        } else {
          navigate(`/student/${code}`);
        }
      }
    };

    Quagga.onDetected(onDetected);

    return () => {
      Quagga.offDetected(onDetected);
      Quagga.stop();
    };
  }, [barcodeScanning, attendanceMode, navigate]);

  // ─── Face Recognition ───
  const startFaceRecognition = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
      }

      intervalRef.current = setInterval(async () => {
        if (!faceVideoRef.current?.videoWidth || !faceCanvasRef.current) return;

        const canvas = faceCanvasRef.current;
        canvas.width = faceVideoRef.current.videoWidth;
        canvas.height = faceVideoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(faceVideoRef.current, 0, 0);

        const base64 = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];

        try {
          setLoading(true);
          setError(""); // نظف الخطأ السابق

          const res = await fetch("http://localhost:8000/recognize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          });

          if (!res.ok) {
            throw new Error(`مشكلة في خادم التعرف - HTTP ${res.status}`);
          }

          const data = await res.json();

          if (data.match_success && data.best_match) {
            const { name, confidence } = data.best_match;

            // منع التكرار السريع لنفس الشخص
            if (lastRecognized === name) return;

            setLastRecognized(name);

            let studentCode = name;     // الافتراضي
            let displayName = name;

            try {
              // نحاول نجيب بيانات الطالب الحقيقية
              const student = await getStudentByCode(name);

              if (student) {
                studentCode = student.studentCode;
                displayName = student.fullName || name;
              }
              // ────── اختياري: بحث بالاسم إذا لم يُعثر بالكود ──────
              // else {
              //   const all = await getAllStudents({ page: 0, size: 100 });
              //   const found = all.content?.find(s =>
              //     s.fullName?.toLowerCase().includes(name.toLowerCase())
              //   );
              //   if (found) {
              //     studentCode = found.studentCode;
              //     displayName = found.fullName;
              //   }
              // }

              // 1. نسجل الحضور دائمًا (مهما كان الـ mode)
              await recordAttendance(studentCode, "face");

              // 2. رسالة نجاح
              const timeStr = new Date().toLocaleString("ar-EG", {
                dateStyle: "medium",
                timeStyle: "short",
              });

              setMessage(
                `✅ مرحباً ${displayName}!\n` +
                `تم تسجيل حضورك بثقة ${(confidence * 100).toFixed(1)}% في ${timeStr}`
              );

              // 3. إذا كنا في وضع البحث العادي → نروح لصفحة الطالب
              if (!attendanceMode) {
                setTimeout(() => {
                  navigate(`/student/${studentCode}`);
                }, 1800);
              }

              // إيقاف الكشف بعد النجاح (شائع في أنظمة الحضور)
              // احذف هذا السطر إذا أردت الاستمرار في الكشف عن أكثر من طالب
              setFaceScanning(false);
            } catch (innerErr) {
              console.error("خطأ أثناء تسجيل الحضور أو التنقل:", innerErr);
              setError(
                `تم التعرف على ${displayName} لكن فشل تسجيل الحضور أو عرض الملف`
              );
            }
          }
        } catch (err) {
          console.error("خطأ أثناء التعرف:", err);
          setError(err.message || "حدث خطأ أثناء محاولة التعرف على الوجه");
        } finally {
          setLoading(false);
        }
      }, 1800);
    } catch (err) {
      console.error("خطأ فتح الكاميرا:", err);
      setError("تعذر فتح كاميرا الوجه. تأكد من السماح بالوصول.");
      setFaceScanning(false);
    }
  }, [lastRecognized, attendanceMode, navigate]);

  useEffect(() => {
    if (faceScanning) {
      startFaceRecognition();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (faceVideoRef.current?.srcObject) {
        faceVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        faceVideoRef.current.srcObject = null;
      }
    };
  }, [faceScanning, startFaceRecognition]);

  const restartFaceScanning = () => {
    setLastRecognized(null);
    setMessage("");
    setError("");
    setFaceScanning(true);
  };

  return (
    <div className="search-page">
      <div className="search-card">
        <h2>{attendanceMode ? "وضع تسجيل الحضور" : "البحث عن طالب"}</h2>

        <div className="mode-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={attendanceMode}
              onChange={() => setAttendanceMode(!attendanceMode)}
            />
            <span className="slider round"></span>
          </label>
          <p>
            {attendanceMode
              ? "المسح هيسجل الحضور تلقائيًا"
              : "المسح هيفتح ملف الطالب"}
          </p>
        </div>

        <input
          type="text"
          placeholder="رقم الطالب أو الاسم"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
        />

        <div className="button-group">
          <button
            className="btn primary"
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
          >
            {loading ? "جاري..." : attendanceMode ? "تسجيل حضور" : "بحث"}
          </button>

          <button
            className={`btn ${barcodeScanning ? "danger" : "camera"}`}
            onClick={() => setBarcodeScanning(!barcodeScanning)}
            disabled={loading}
          >
            {barcodeScanning ? "إيقاف مسح الباركود" : "📷 مسح ID"}
          </button>

          <button
            className={`btn ${faceScanning ? "danger" : "face"}`}
            onClick={() => setFaceScanning(!faceScanning)}
            disabled={loading}
          >
            {faceScanning ? "إيقاف كشف الوجه" : "👤 كشف الوجه"}
          </button>
        </div>

        {barcodeScanning && (
          <div className="scanner-container">
            <div ref={barcodeScannerRef} className="scanner-viewport" />
            <p>وجه الكاميرا نحو الباركود...</p>
          </div>
        )}

        {faceScanning && (
          <div className="face-scanner">
            <video
              ref={faceVideoRef}
              autoPlay
              playsInline
              muted
              width="100%"
              height="auto"
            />
            <canvas ref={faceCanvasRef} style={{ display: "none" }} />
            <p className="status-text">
              {loading ? "جاري التعرف..." : message || "جاري البحث عن وجه معروف..."}
            </p>
          </div>
        )}

        {!faceScanning && attendanceMode && (
          <button className="btn retry" onClick={restartFaceScanning}>
            إعادة المحاولة بالكاميرا
          </button>
        )}

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <div className="footer-actions">
          <button className="btn secondary" onClick={() => navigate("/add")}>
            إضافة طالب جديد
          </button>
          <button className="btn danger" onClick={logout}>
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

export default Search;