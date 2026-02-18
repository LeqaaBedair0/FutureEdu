import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Barcode from "react-barcode";
import "../styles/IdCardGenerator.css";

function IdCardGenerator() {
  const location = useLocation();
  const navigate = useNavigate();

  // Default state or data passed from Student Profile
  const [student, setStudent] = useState({
    name: "Ahmed Hassan",
    id: "100200",
    class: "3A",
    role: "Student",
    school: "Future Generation School" // You can change this
  });

  // Load data if passed via navigation
  useEffect(() => {
    if (location.state && location.state.student) {
      const data = location.state.student;
      setStudent({
        ...student, // keep defaults like school name
        name: data.name,
        id: data.user_id || data.id, // Handle different field names
        class: data.class || "N/A"
      });
    }
  }, [location.state]);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  return (
    <div className="generator-container">
      
      {/* 1. LEFT SIDE: The Controls */}
      <div className="controls-panel no-print">
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        <h2>🪪 ID Card Creator</h2>
        <p>Edit details to update the card instantly.</p>

        <div className="input-group">
          <label>School Name</label>
          <input name="school" value={student.school} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Student Name</label>
          <input name="name" value={student.name} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Student ID (Barcode)</label>
          <input name="id" value={student.id} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Class / Grade</label>
          <input name="class" value={student.class} onChange={handleChange} />
        </div>

        <button className="btn-print-large" onClick={() => window.print()}>
          🖨️ Print ID Card
        </button>
      </div>

      {/* 2. RIGHT SIDE: The Live Preview (This gets printed) */}
      <div className="preview-panel">
        <div className="id-card-print-area">
          
          {/* THE ID CARD */}
          <div className="id-card">
            {/* Header */}
            <div className="card-header-bg">
              <h3>{student.school}</h3>
            </div>

            {/* Photo & Details */}
            <div className="card-body">
              <div className="photo-section">
                <img 
                  src={`https://ui-avatars.com/api/?name=${student.name}&background=0D8ABC&color=fff&size=128`} 
                  alt="Student" 
                />
              </div>
              <div className="details-section">
                <h2 className="st-name">{student.name}</h2>
                <p className="st-role">{student.role}</p>
                <div className="st-meta">
                  <span>Class: <strong>{student.class}</strong></span>
                  <span>ID: <strong>{student.id}</strong></span>
                </div>
              </div>
            </div>

            {/* BARCODE SECTION */}
            <div className="barcode-section">
              <Barcode 
                value={student.id} 
                width={1.5} 
                height={40} 
                fontSize={14}
                displayValue={true} 
              />
            </div>

            {/* Footer decoration */}
            <div className="card-footer-stripe"></div>
          </div>

        </div>
        <p className="preview-note no-print">☝️ This is how it will look on paper</p>
      </div>

    </div>
  );
}

export default IdCardGenerator;