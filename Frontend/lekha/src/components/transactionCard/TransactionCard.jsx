import { formatCurrency } from "../../utils/functions";
import "./TransactionCard.css";

export default function LastTransaction({
  Key,
  Amount,
  Category,
  CreatedAt,
  Status,
  onReport,
}) {
  return (
    <div className="Total-expenses-trans card-trans">
      <div className="heading-trans">{Category}</div>
      <p className="Total-expense-amount-trans">
        Amount : {formatCurrency(Amount)} <br></br>
        Date : {new Date(CreatedAt).toLocaleDateString()} <br />
        {Status === "Completed" ? (
          <>Status : {Status}</>
        ) : (
          <>
            <b>
              <i>Status : {Status}</i>
            </b>
          </>
        )}
        <br />
        <button className="report-button" onClick={() => onReport(Key)}>
          Report Transaction
          <div className="report-tooltip">Report Transaction As Fraud</div>
        </button>
      </p>
    </div>
  );
}
