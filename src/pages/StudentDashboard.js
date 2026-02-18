import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "../styles/StudentDashboard.css";

function StudentDashboard({ student }) {
  // ─── قراءة مباشرة من الداتا الحقيقية ────────────────────────────────
  console.log("Dashboard props → ", student);
  const presentDays = Number(student?.presentDays ?? 0);
  const absentDays  = Number(student?.absentDays ?? 0);
  const lateDays    = Number(student?.lateDays ?? 0);

  const totalDays = presentDays + absentDays + lateDays;
  const presencePercentage =
    totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const attendanceData = React.useMemo(
    () => [
      { name: "حاضر",   value: presentDays, color: "#10b981" },
      { name: "غائب",   value: absentDays,  color: "#ef4444" },
      { name: "متأخر",  value: lateDays,    color: "#f59e0b" },
    ],
    [presentDays, absentDays, lateDays]
  );

  const hasGradesOrExams =
    (student?.grades?.length ?? 0) > 0 ||
    (student?.examResults?.length ?? 0) > 0;

  const performanceData = React.useMemo(() => {
    if (!hasGradesOrExams) return [];

    const monthlyMap = new Map();

    (student?.grades || []).forEach((g) => {
      if (!g?.date) return;
      const key = new Date(g.date).toLocaleString("ar-EG", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyMap.has(key)) monthlyMap.set(key, { sum: 0, count: 0 });
      const entry = monthlyMap.get(key);
      entry.sum += (g.score / (g.maxScore || 1)) * 100;
      entry.count += 1;
    });

    (student?.examResults || []).forEach((e) => {
      if (!e?.date) return;
      const key = new Date(e.date).toLocaleString("ar-EG", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyMap.has(key)) monthlyMap.set(key, { sum: 0, count: 0 });
      const entry = monthlyMap.get(key);
      entry.sum += (e.obtainedMarks / (e.totalMarks || 1)) * 100;
      entry.count += 1;
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        avg: Math.round(data.sum / data.count) || 0,
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [student?.grades, student?.examResults]);

  const recentAssessments = React.useMemo(() => {
    const list = [];

    (student?.grades || []).forEach((g) => {
      list.push({
        type: "درجة",
        subject: g.subject || "غير محدد",
        date: g.date ? new Date(g.date).toLocaleDateString("ar-EG") : "غير محدد",
        score: `${g.score ?? 0}/${g.maxScore ?? "?"}`,
        status: (g.score ?? 0) >= (g.maxScore ?? 1) * 0.5 ? "نجاح" : "رسوب",
      });
    });

    (student?.examResults || []).forEach((e) => {
      list.push({
        type: "امتحان",
        subject: e.examName || "غير محدد",
        date: e.date ? new Date(e.date).toLocaleDateString("ar-EG") : "غير محدد",
        score: `${e.obtainedMarks ?? 0}/${e.totalMarks ?? "?"}`,
        status:
          (e.obtainedMarks ?? 0) >= (e.totalMarks ?? 1) * 0.5 ? "نجاح" : "رسوب",
      });
    });

    return list
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [student?.grades, student?.examResults]);

  if (!student) {
    return (
      <div className="dashboard-loading">
        جاري تحميل بيانات الطالب...
      </div>
    );
  }

  // ─── الماليات ─────────────────────────────────────────────────────
  const totalFees     = Number(student?.totalFees ?? 0);
  const amountPaid    = Number(student?.amountPaid ?? 0);
  const currency      = student?.currency || "EGP";
  const paymentStatus = student?.paymentStatus || "غير محدد";

  const remaining = totalFees - amountPaid;

  return (
    <div className="dashboard-grid">
      {/* ملخص الحضور */}
      <div className="dashboard-card attendance-card">
        <div className="card-header">
          <h3>ملخص الحضور</h3>
        </div>

        <div className="attendance-pie-wrapper" style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={attendanceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>

          <div
            className="attendance-center"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: "2.6rem", fontWeight: "bold", color: "#1e40af" }}>
              {presencePercentage}%
            </div>
            <div style={{ fontSize: "0.95rem", color: "#64748b" }}>نسبة الحضور</div>
          </div>
        </div>

        <div className="attendance-summary-text" style={{ padding: "0.8rem", textAlign: "center" }}>
          <div>حاضر: <strong>{presentDays}</strong> يوم</div>
          <div>غائب: <strong>{absentDays}</strong> يوم</div>
          <div>متأخر: <strong>{lateDays}</strong> يوم</div>
        </div>
      </div>

      {/* منحنى الأداء */}
      <div className="dashboard-card chart-card">
        <div className="card-header">
          <h3>منحنى الأداء</h3>
        </div>

        {performanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={performanceData}>
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis domain={[0, 100]} stroke="#64748b" />
              <Tooltip formatter={(value) => [`${value}%`, "متوسط الأداء"]} />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: "220px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: "12px", opacity: 0.6 }}>📊</div>
            <p>لا توجد درجات أو امتحانات مسجلة بعد</p>
            <small>سيظهر المنحنى تلقائياً عند إضافة تقييمات</small>
          </div>
        )}
      </div>

      {/* آخر التقييمات */}
      <div className="dashboard-card recent-assessments">
        <div className="card-header">
          <h3>آخر التقييمات</h3>
        </div>

        {recentAssessments.length > 0 ? (
          <div className="assessments-list" style={{ padding: "0.8rem" }}>
            {recentAssessments.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.7rem 0",
                  borderBottom: idx < recentAssessments.length - 1 ? "1px solid #e2e8f0" : "none",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{item.subject}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{item.date}</div>
                </div>
                <span
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    backgroundColor: item.status === "نجاح" ? "#dcfce7" : "#fee2e2",
                    color: item.status === "نجاح" ? "#166534" : "#991b1b",
                  }}
                >
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              height: "180px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "12px", opacity: 0.6 }}>📝</div>
            <p>لا توجد تقييمات بعد</p>
            <small>سيظهر هنا آخر الدرجات والامتحانات</small>
          </div>
        )}
      </div>

      {/* ملخص مالي */}
      <div className="dashboard-card finance-summary">
        <div className="card-header">
          <h3>الحالة المالية</h3>
        </div>
        <div style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "0.6rem 0" }}>
            <span style={{ color: "#475569" }}>إجمالي المصروفات</span>
            <span style={{ fontWeight: 600 }}>
              {totalFees.toLocaleString()} {currency}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "0.6rem 0" }}>
            <span style={{ color: "#475569" }}>المدفوع</span>
            <span style={{ fontWeight: 600, color: "#15803d" }}>
              {amountPaid.toLocaleString()} {currency}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "0.6rem 0" }}>
            <span style={{ color: "#475569" }}>المتبقي</span>
            <span style={{ fontWeight: 600, color: "#b45309" }}>
              {remaining.toLocaleString()} {currency}
            </span>
          </div>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            الحالة:{" "}
            <strong
              style={{
                color:
                  paymentStatus === "PAID" ? "#15803d" :
                  paymentStatus === "PENDING" ? "#d97706" :
                  paymentStatus === "OVERDUE" ? "#dc2626" : "#64748b",
              }}
            >
              {paymentStatus}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;