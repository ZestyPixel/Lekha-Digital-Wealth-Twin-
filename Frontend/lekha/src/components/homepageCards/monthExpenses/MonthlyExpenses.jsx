import "./MonthlyExpenses.css"
import { formatCurrency } from "../../../utils/functions";

export default function MonthlyExpensesCard({Data}){

    const totalWorth = (Data ?? []).reduce((acc, el)=>acc + el.amount, 0)

    return(
        <div className="Total-expenses card">
            <div className="heading">
                Total Expenses This Month
            </div>
            <p id="total-expense-value" className="Total-expense-amount">
                {formatCurrency(totalWorth)}
                
            </p>
        </div>
    );
}