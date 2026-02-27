import "./Card.css"
import { formatCurrency } from "../../utils/functions";

export default function Card({Title}){
    return(
        <div className="Total-expenses card">
            <div className="heading">
                {Title}
            </div>
            <p id="total-expense-value" className="Total-expense-amount">
                {formatCurrency("50000")}
            </p>
        </div>
    );
}