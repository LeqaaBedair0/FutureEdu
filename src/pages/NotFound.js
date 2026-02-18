import { useNavigate, useParams } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  const { id } = useParams(); 

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="icon">😕</div>
        
        <h1>Student Not Found</h1>
        
        {/* Show the ID if we have one, otherwise just generic message */}
        {id ? (
          <p>We couldn't find a student with ID: <strong>{id}</strong></p>
        ) : (
          <p>The page or student you are looking for does not exist.</p>
        )}

        <div className="button-group">
          <button 
            className="btn-primary" 
            onClick={() => navigate("/search")}
          >
            🔍 Search / Scan Again
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={() => navigate("/")}
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;