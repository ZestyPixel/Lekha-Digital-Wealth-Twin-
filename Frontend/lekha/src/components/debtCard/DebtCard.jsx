import { formatCurrency } from "../../utils/functions";

export default function DebtCard({ Name, Total, Remaining, EMI, Progress }) {
    return (
        <div className="Total-expenses-trans card-trans">
            <div className="heading-trans">
                {Name}
            </div>
            <p className="Total-expense-amount-trans">
                Total Amount: {formatCurrency(Total)} <br />
                Remaining Balance: {formatCurrency(Remaining)} <br />
                Monthly EMI: {formatCurrency(EMI)} <br />
                Paid Off: {Progress}%
            </p>
        </div>
    );
}