import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-logo">Professor Portal</div>
      {isAuthenticated && (
        <div className="navbar-user">
          <span>Professor</span>
          <button
            className="btn-primary"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Logout
          </button>
          <button onClick={() => navigate("/dashboard")} className="btn-primary">
            Dashboard
          </button>

        </div>
        
      )}
    </nav>
  );
}

export default Navbar;
