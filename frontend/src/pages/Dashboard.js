import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api";  // ← تأكد إن المسار صحيح لملف api.js
import "../styles/Dashboard.css";  // لو عندك ستايل منفصل

function Dashboard() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // جلب كل الطلاب (عدّل size لو عندك آلاف الطلاب)
        const response = await api.getAllStudents(0, 1000);
        
        // تجميع عدد الطلاب لكل فصل (className)
        const classCount = response.content.reduce((acc, student) => {
          const className = student.className || "غير محدد";
          acc[className] = (acc[className] || 0) + 1;
          return acc;
        }, {});

        // تحويل النتيجة لصيغة recharts
        const formattedData = Object.entries(classCount).map(([className, students]) => ({
          class: className,
          students
        }));

        setChartData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("خطأ في جلب بيانات الداشبورد:", err);
        setError("تعذر تحميل بيانات الطلاب");
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Dashboard</h1>
        <p>جاري تحميل البيانات من قاعدة البيانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "red" }}>
        <h1>Dashboard</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>لوحة التحكم</h1>
      <h3>عدد الطلاب حسب الفصل</h3>

      {chartData.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          لا توجد بيانات طلاب بعد في قاعدة البيانات
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <XAxis dataKey="class" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ 
                background: "#1e293b", 
                border: "none", 
                borderRadius: "8px", 
                color: "white" 
              }} 
            />
            <Bar 
              dataKey="students" 
              fill="#2563eb" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default Dashboard;