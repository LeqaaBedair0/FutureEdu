import "../styles/StudentDashboard.css";
import React from "react";

function DashboardCard({ title, children, className = "" }) {
  return (
    <div className={`dashboard-card ${className}`}>
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

export default DashboardCard;