import { useState } from "react";
import "./ReportModal.css";

export default function ReportModal({
  status,
  onClose,
  onDownload,
  onSubmitExplanation,
}) {
  const [explanation, setExplanation] = useState("");

  if (status === "closed") return null;

  function handleSubmit() {
    onSubmitExplanation(explanation);
  }

  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div className="report-modal-box" onClick={(e) => e.stopPropagation()}>
        {status === "explaining" && (
          <>
            <h3>What Happened?</h3>
            <p>
              Briefly describe the incident — how you were contacted, what was
              shared, or anything else relevant. This will be included in your
              report.
            </p>
            <textarea
              className="report-modal-textarea"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. Received a call claiming to be from my bank asking to verify my UPI PIN..."
              rows={5}
            />
            <button
              className="report-modal-download-btn"
              onClick={handleSubmit}
              disabled={!explanation.trim()}
            >
              Continue
            </button>
          </>
        )}

        {status === "loading" && (
          <>
            <div className="report-modal-spinner" />
            <p>Generating your incident report...</p>
          </>
        )}

        {status === "success" && (
          <>
            <h3>Report Generated</h3>
            <p>
              Your fraud incident report is ready. Download it to file a
              complaint.
            </p>
            <button className="report-modal-download-btn" onClick={onDownload}>
              Download PDF
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <h3>Something Went Wrong</h3>
            <p>We couldn't generate your report. Please try again.</p>
          </>
        )}

        <button className="report-modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
