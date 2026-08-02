import { formatCurrency } from "../../utils/functions";

export default function LastTransaction({ Type, Value, HeldBy }) {
  return (
    <div className="Total-expenses-trans card-trans">
      <div className="heading-trans">{Type}</div>
      <p className="Total-expense-amount-trans">
        Value : {formatCurrency(Value)} <br></br>
        Held By : {HeldBy}
      </p>
    </div>
  );
}
