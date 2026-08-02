import "./Warning.css";
import { useEffect } from "react";

export default function Warning({ message, reasons }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="warning-screen">
      <svg className="warning-icon" viewBox="0 0 120 120">
        <circle className="warning-circle" cx="60" cy="60" r="54" fill="none" />
        <line className="warning-bang-body" x1="60" y1="38" x2="60" y2="70" />
        <circle className="warning-bang-dot" cx="60" cy="84" r="5" />
      </svg>

      <h1 className="warning-message">{message}</h1>

      {reasons?.length > 0 && (
        <div className="warning-reasons">
          <ul>
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
