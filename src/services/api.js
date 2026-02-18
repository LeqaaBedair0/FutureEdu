// api.js - API Client لنظام إدارة الطلاب والحضور (محدث فبراير 2026)

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// ─── Helper functions ────────────────────────────────────────────────────────
const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const saveToken = (token, remember = true) => {
  if (remember) {
    localStorage.setItem("token", token);
    sessionStorage.removeItem("token");
  } else {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
  }
};

const removeToken = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};

const createHeaders = (needsAuth = true, contentType = "application/json") => {
  const headers = contentType ? { "Content-Type": contentType } : {};

  if (needsAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 204) return null;

  let data;
  const contentType = res.headers.get("content-type");

  try {
    if (contentType?.includes("application/json")) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }
  } catch {
    data = { message: "رد غير مفهوم من الخادم" };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      removeToken();
      window.location.href = "/login?session_expired=true";
      throw new Error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى");
    }

    if (res.status === 404) {
      throw new Error(data?.message || "العنصر غير موجود");
    }

    if (res.status === 409) {
      throw new Error(data?.message || "البيانات موجودة بالفعل");
    }

    if (res.status === 400) {
      throw new Error(data?.message || data?.detail || "بيانات غير صحيحة");
    }

    const errorMsg =
      data?.message ||
      data?.error ||
      data?.detail ||
      `خطأ ${res.status} - ${res.statusText}`;

    throw new Error(errorMsg);
  }

  return data;
};

// ─── Auth ────────────────────────────────────────────────────────────────────
const login = async ({ email, password, remember = true }) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: createHeaders(false),
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  const data = await handleResponse(res);
  if (data?.token) saveToken(data.token, remember);
  return data;
};

const logout = () => {
  removeToken();
  window.location.href = "/login?logout=true";
};

// ─── Students ────────────────────────────────────────────────────────────────
const getStudentByCode = async (code, signal = null) => {
  const res = await fetch(`${BASE_URL}/students/code/${encodeURIComponent(code)}`, {
    headers: createHeaders(),
    signal,
  });
  return handleResponse(res);
};

const getAllStudents = async ({
  page = 0,
  size = 20,
  sortBy = "createdAt",
  direction = "desc",
  signal = null,
} = {}) => {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy,
    direction,
  }).toString();

  const res = await fetch(`${BASE_URL}/students?${query}`, {
    headers: createHeaders(),
    signal,
  });

  return handleResponse(res);
};

const searchStudents = async (query = "", page = 0, size = 20, signal = null) => {
  if (!query.trim()) return getAllStudents({ page, size, signal });

  const all = await getAllStudents({ page, size: Math.max(size, 100), signal });
  const lowerQuery = query.trim().toLowerCase();

  const filtered = (all.content || []).filter(
    (s) =>
      s.studentCode?.toLowerCase().includes(lowerQuery) ||
      s.fullName?.toLowerCase().includes(lowerQuery) ||
      s.email?.toLowerCase().includes(lowerQuery)
  );

  return { ...all, content: filtered, totalElements: filtered.length };
};

const addStudent = async (studentData, signal = null) => {
  const res = await fetch(`${BASE_URL}/students`, {
    method: "POST",
    headers: createHeaders(true),
    body: JSON.stringify(studentData),
    signal,
  });
  return handleResponse(res);
};

const updateStudent = async (code, updates, signal = null) => {
  const res = await fetch(`${BASE_URL}/students/code/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: createHeaders(true),
    body: JSON.stringify(updates),
    signal,
  });
  return handleResponse(res);
};

const deleteStudent = async (code, signal = null) => {
  const res = await fetch(`${BASE_URL}/students/code/${encodeURIComponent(code)}`, {
    method: "DELETE",
    headers: createHeaders(true),
    signal,
  });
  return handleResponse(res);
};

// ─── Attendance ──────────────────────────────────────────────────────────────
const recordAttendance = async (code, method = "face", recordedBy = "system", signal = null) => {
  const res = await fetch(`${BASE_URL}/students/${encodeURIComponent(code)}/attend`, {
    method: "POST",
    headers: createHeaders(true),
    body: JSON.stringify({ method, recordedBy }),
    signal,
  });
  return handleResponse(res);
};

const getAttendanceHistory = async (code, fromDate, toDate, signal = null) => {
  const params = new URLSearchParams();
  if (fromDate) params.append("from", fromDate);
  if (toDate) params.append("to", toDate);

  const query = params.toString();
  const url = `${BASE_URL}/students/${encodeURIComponent(code)}/attendance${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    headers: createHeaders(),
    signal,
  });
  return handleResponse(res);
};

// ─── Grades / Exams ──────────────────────────────────────────────────────────
const addGradeOrExam = async (code, data, signal = null) => {
  const res = await fetch(`${BASE_URL}/students/${encodeURIComponent(code)}/grade`, {
    method: "PATCH",
    headers: createHeaders(true),
    body: JSON.stringify(data),
    signal,
  });
  return handleResponse(res);
};

const getStudentGrades = async (code, signal = null) => {
  const res = await fetch(`${BASE_URL}/students/${encodeURIComponent(code)}/grades`, {
    headers: createHeaders(),
    signal,
  });
  return handleResponse(res);
};

// ─── Named exports (التصدير الوحيد في الملف) ───────────────────────────────
export {
  login,
  logout,
  getStudentByCode,
  getAllStudents,
  searchStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  recordAttendance,
  getAttendanceHistory,
  addGradeOrExam,
  getStudentGrades,
};