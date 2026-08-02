export default function WithdrawTransfer({ Title }) {
  return (
    <div className="Total-expenses card">
      <div className="heading">{Title}</div>
      <p id="total-expense-value" className="Total-expense-amount"></p>
    </div>
  );
}
