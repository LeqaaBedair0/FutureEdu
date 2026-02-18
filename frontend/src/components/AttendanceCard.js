function AttendanceCard({ attendance }) {
  const total = attendance.present + attendance.absent;
  const percentage = Math.round((attendance.present / total) * 100);

  return (
    <div className="dashboard-card">
      <h3>Attendance</h3>
      <p>
        Present: <span className="present">{attendance.present}</span>
      </p>
      <p>
        Absent: <span className="absent">{attendance.absent}</span>
      </p>
      <p>
      <strong>Attendance %: {percentage}%</strong>
      </p>
    </div>
  );
}

export default AttendanceCard;
