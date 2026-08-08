import { useLocation } from "react-router-dom";
import { useState } from "react";
import TransactionCard from "../../components/transactionCard/TransactionCard";
import ReportModal from "../../components/reportModal/ReportModal";
import { useAuth } from "../../context/useAuth";

export default function RecentTransactions() {
  const location = useLocation();
  const transaction = location.state;
  const { requestWithAuth } = useAuth();

  const [modalStatus, setModalStatus] = useState("closed");
  const [reportedId, setReportedId] = useState(null);
  const [explanationText, setExplanationText] = useState("");

  function handleReportClick(id) {
    setReportedId(id);
    setModalStatus("explaining");
  }

  async function handleSubmitExplanation(explanation) {
    setExplanationText(explanation);
    setModalStatus("loading");

    try {
      const response = await requestWithAuth(
        `/downloadIncidentReport?id=${reportedId}`,
        {
          method: "POST",
          body: JSON.stringify({ explanation }),
        },
      );

      if (!response.ok) {
        setModalStatus("error");
        return;
      }

      setModalStatus("success");
    } catch (err) {
      console.error("Failed to generate incident report:", err);
      setModalStatus("error");
    }
  }

  async function handleDownload() {
    try {
      const response = await requestWithAuth(
        `/downloadIncidentReport?id=${reportedId}`,
        {
          method: "POST",
          body: JSON.stringify({ explanation: explanationText }),
        },
      );

      if (!response.ok) {
        setModalStatus("error");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "incident-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download incident report:", err);
      setModalStatus("error");
    }
  }

  function handleCloseModal() {
    setModalStatus("closed");
    setReportedId(null);
    setExplanationText("");
  }

  return (
    <div className="card-container">
      {transaction.map((el) => (
        <TransactionCard
          key={el._id}
          Key={el._id}
          Amount={el.amount}
          Category={el.category}
          CreatedAt={el.createdAt}
          Status={el.status}
          onReport={handleReportClick}
        />
      ))}

      <ReportModal
        status={modalStatus}
        onClose={handleCloseModal}
        onDownload={handleDownload}
        onSubmitExplanation={handleSubmitExplanation}
      />
    </div>
  );
}
