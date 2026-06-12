import "./HealthScore.css";

export default function HealthScore() {
  const raw = sessionStorage.getItem('score');
  if (!raw) return null; // or a loading/empty state

  const data = JSON.parse(raw);
  const reasons = data?.breakdown ?? [];

  return (
    <div className="division">
      <ul>
        {reasons.map((el, i) => {
          let type = "";
          if (el.startsWith("+")) type = "green";
          else if (el.startsWith("~")) type = "orange";
          else if (el.startsWith("-")) type = "red";
          return <li key={i} className={`reason ${type}`}>{el}</li>;
        })}
      </ul>
    </div>
  );
}