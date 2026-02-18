import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StudentCard.css";

function StudentCard({ student, isDemo, onPrint, onUpdate }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(student || {});

  useEffect(() => {
    setFormData(student || {});
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    if (onUpdate) onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(student);
    setIsEditing(false);
  };

  const openWhatsApp = (phone) => {
    if(!phone) return;
    let cleanNumber = phone.replace(/\D/g, ''); 
    if (!cleanNumber.startsWith("20")) cleanNumber = "20" + cleanNumber;
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  };

  const makeCall = (phone) => window.location.href = `tel:${phone}`;

  return (
    <div className={`student-card-organized ${isEditing ? 'editing-mode' : ''}`}>
      {isDemo && <div className="demo-badge">DEMO MODE</div>}
      
      {!isEditing && (
        <button className="btn-icon-edit" onClick={() => setIsEditing(true)}>✏️</button>
      )}

      <div className="card-main-layout">
        
        {/* LEFT COLUMN: Photo, Name, and Generate ID */}
        <div className="profile-sidebar">
          <div className="avatar-container">
            <img
              className="student-photo-large"
              src={`https://ui-avatars.com/api/?name=${formData.name}&background=c2185b&color=fff&size=150`}
              alt="Student"
            />
          </div>
          
          <div className="profile-titles">
            {isEditing ? (
              <input 
                className="edit-input title-input-centered" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
              />
            ) : (
              <h2 className="student-name-large">{student.name}</h2>
            )}
            <p className="student-id-sub">ID: #{student.user_id}</p>
          </div>

          {!isEditing && (
            <button 
              className="btn-generate-id-below" 
              onClick={() => navigate('/id-card', { state: { student: student } })}
            >
              🪪 Generate ID
            </button>
          )}
        </div>

        {/* RIGHT SECTION: Info Grid */}
        <div className="info-main-content">
          <div className="info-grid-row">
            <div className="grid-item">
              <label>Class</label>
              {isEditing ? (
                <input className="edit-input" name="class" value={formData.class} onChange={handleChange} />
              ) : (
                <p>{student.class}</p>
              )}
            </div>
            <div className="grid-item">
              <label>Address</label>
              {isEditing ? (
                <input className="edit-input" name="address" value={formData.address} onChange={handleChange} />
              ) : (
                <p>{student.address}</p>
              )}
            </div>
          </div>

          <div className="info-grid-row">
            <div className="grid-item">
              <label>Student Phone</label>
              {isEditing ? (
                <input className="edit-input" name="phone_number" value={formData.phone_number} onChange={handleChange} />
              ) : (
                <div className="contact-display">
                  {student.phone_number} <button className="mini-icon" onClick={() => makeCall(student.phone_number)}>📞</button>
                </div>
              )}
            </div>
            <div className="grid-item">
              <label>Payment Method</label>
              {isEditing ? (
                <select className="edit-input" name="method_of_paying" value={formData.method_of_paying} onChange={handleChange}>
                  <option value="Cash">Cash</option>
                  <option value="Visa">Visa</option>
                </select>
              ) : (
                <p>{student.method_of_paying}</p>
              )}
            </div>
          </div>

          <div className="info-grid-row">
            <div className="grid-item">
              <label>Parent Phone</label>
              {isEditing ? (
                <input className="edit-input" name="parent_phone_number" value={formData.parent_phone_number} onChange={handleChange} />
              ) : (
                <div className="contact-display">
                  {student.parent_phone_number} 
                  <button className="mini-icon" onClick={() => makeCall(student.parent_phone_number)}>📞</button>
                  <button className="mini-icon" onClick={() => openWhatsApp(student.parent_phone_number)}>💬</button>
                </div>
              )}
            </div>
            <div className="grid-item">
              <label>Payment Status</label>
              {isEditing ? (
                <select className="edit-input" name="payment_status" value={formData.payment_status} onChange={handleChange}>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              ) : (
                <span className={`status-pill ${student.payment_status?.toLowerCase()}`}>
                  {student.payment_status}
                </span>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="edit-actions-bottom">
              <button className="btn-save-final" onClick={handleSave}>💾 Save Changes</button>
              <button className="btn-cancel-final" onClick={handleCancel}>❌ Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentCard;