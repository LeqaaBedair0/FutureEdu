function ExamsList({ exams }) {
  return (
    <div className="grid-card">
      <h3>Exams</h3>
      {exams.map((e, i) => (
        <div key={i} className="grade-row">
          <span>{e.name}</span>
          <strong>{e.grade}</strong>
        </div>
      ))}
    </div>
  );
}

export default ExamsList;
