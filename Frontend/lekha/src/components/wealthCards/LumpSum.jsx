import "./LumpSum.css";

export default function LumpSum({ Title }) {
  return (
    <div className="Total-expenses card">
      <div className="heading">{Title}</div>
      <p className="Total-expense-amount-wealth ">
        Invest a lumpsum amount to grow your wealth over the long term.
      </p>
    </div>
  );
}
