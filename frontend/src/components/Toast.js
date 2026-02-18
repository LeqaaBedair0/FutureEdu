import { useEffect, useState } from "react";
import "../styles/Toast.css";

function Toast({ message, type = "success", duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return <div className={`toast ${type}`}>{message}</div>;
}

export default Toast;
