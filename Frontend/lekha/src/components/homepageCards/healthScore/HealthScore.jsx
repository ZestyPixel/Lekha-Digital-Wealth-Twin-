import "./HealthScore.css";

const getScoreConfig = (score) => {
  if (score >= 80) return { label: "Excellent", color: "#4ade80" };
  if (score >= 60) return { label: "Good", color: "#a3e635" };
  if (score >= 40) return { label: "Fair", color: "#fbbf24" };
  if (score >= 20) return { label: "Poor", color: "#fb923c" };
  return { label: "Critical", color: "#f87171" };
};

export default function HealthScore({ Title }) {
  const raw = localStorage.getItem('score');
  if (!raw) return null; // or a loading/empty state

  const scoreFinal = JSON.parse(raw);
  const score = scoreFinal?.score ?? 0;
  const { label, color } = getScoreConfig(score);

  return (
    <div className="health-card Total-expenses-trans card-trans card">

      <div className="heading-trans">{Title}</div>

      <div className="score-row">
        <span className="score-number" style={{ color }}>
          {score}
        </span>

        <div className="score-info">
          <span className="score-max">/100</span>

          <span className="score-label" style={{ color }}>
            {label}
          </span>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-labels">
          <span>0</span>
          <span>100</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${score}%`,
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
      </div>

    </div>
  );
}