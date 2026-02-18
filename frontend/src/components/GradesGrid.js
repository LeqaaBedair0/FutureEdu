function GradesGrid({ grades }) {
    return (
      <div className="dashboard-card">
        <h3>Current Grades</h3>
        <div className="grades-list">
          {grades.map((g, i) => (
            <div key={i} className="grade-item">
              <span className="subject-name">{g.subject}</span>
              <div className="score-bar-bg">
                 <div 
                    className="score-bar-fill" 
                    style={{width: `${g.score}%`, backgroundColor: g.score >= 90 ? '#10b981' : g.score >= 70 ? '#f59e0b' : '#ef4444'}}
                 ></div>
              </div>
              <span className="grade-score">{g.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  export default GradesGrid;