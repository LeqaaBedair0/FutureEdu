import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Search from "./pages/Search";
import Student from "./pages/Student";
import AddStudent from "./pages/AddStudent";
import Dashboard from "./pages/StudentDashboard";
import IdCardGenerator from "./pages/IdCardGenerator";
import TeacherSalary from "./pages/TeacherSalary";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// 404 page (simple version - you can create a NotFound component later)
const NotFound = () => (
  <div style={{ padding: "40px", textAlign: "center" }}>
    <h1>404 - الصفحة غير موجودة</h1>
    <p>الرابط الذي تحاول الوصول إليه غير موجود.</p>
    <button 
      onClick={() => window.location.href = "/search"}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      }}
    >
      العودة لصفحة البحث
    </button>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>

        {/* ─── Public routes ─── */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} /> {/* Default route = login */}

        {/* ─── Protected routes (require login) ─── */}
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/:id"
          element={
            <ProtectedRoute>
              <Student />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add"
          element={
            <ProtectedRoute>           {/* ← I recommend protecting this route */}
              <AddStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ─── Semi-public or public routes (you can protect them if needed) ─── */}
        <Route path="/id-card" element={<IdCardGenerator />} />
        <Route path="/salary" element={<TeacherSalary />} />

        {/* ─── 404 - catch all ─── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;