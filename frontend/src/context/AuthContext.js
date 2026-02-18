import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const getStoredToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  };

  const [token, setToken] = useState(getStoredToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getStoredToken());

  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  const login = (newToken, remember = true) => {
    if (!newToken) {
      console.warn("تحذير: تم استدعاء login بدون توكن");
      return;
    }

    console.log("تسجيل دخول ناجح - التوكن:", newToken.substring(0, 20) + "...");

    // دائمًا احفظ في localStorage (أو في الاتنين)
    localStorage.setItem("token", newToken);

    if (!remember) {
      // لو مش تذكرني → احفظ في session أيضًا للتبويب الحالي
      sessionStorage.setItem("token", newToken);
    }

    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log("تم تسجيل الخروج");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth يجب أن يُستخدم داخل AuthProvider");
  }
  return context;
}