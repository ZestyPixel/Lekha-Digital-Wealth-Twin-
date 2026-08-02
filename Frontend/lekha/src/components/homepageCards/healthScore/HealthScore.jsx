import "./HealthScore.css";
import { useTranslation } from "react-i18next";

const localeMap = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  mr: "mr-IN",
};

export default function HealthScore() {
  const getScoreConfig = (score) => {
    if (score >= 80) return { label: t("excellent"), color: "#4ade80" };
    if (score >= 60) return { label: t("good"), color: "#a3e635" };
    if (score >= 40) return { label: t("fair"), color: "#fbbf24" };
    if (score >= 20) return { label: t("poor"), color: "#fb923c" };
    return { label: "Critical", color: "#f87171" };
  };

  const { t, i18n } = useTranslation("translation", { keyPrefix: "dashboard" });

  const raw = sessionStorage.getItem("score");
  if (!raw) return null; // or a loading/empty state
  console.log("RAW SCORE STORAGE:", raw); // TEMP
  const scoreFinal = JSON.parse(raw);
  const score = scoreFinal?.score ?? 0;
  const { label, color } = getScoreConfig(score);

  const locale = localeMap[i18n.language] || "en-IN";
  const formattedScore = new Intl.NumberFormat(locale).format(score);
  const formattedMax = new Intl.NumberFormat(locale).format(100);
  const formattedZero = new Intl.NumberFormat(locale).format(0);

  return (
    <div className="health-card Total-expenses-trans card-trans card">
      <div className="heading-trans">{t("financialHealthScore")}</div>

      <div className="score-row">
        <span className="score-number" style={{ color }}>
          {formattedScore}
        </span>

        <div className="score-info">
          <span className="score-max">/{formattedMax}</span>
          <span className="score-label" style={{ color }}>
            {label}
          </span>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-labels">
          <span>{formattedZero}</span>
          <span>{formattedMax}</span>
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
