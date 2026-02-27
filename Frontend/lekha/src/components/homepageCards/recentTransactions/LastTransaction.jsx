import "./LastTransaction.css"
import { formatCurrency } from "../../../utils/functions";

export default function LastTransaction({Title, data}){
    return(
        <div className="Total-expenses card">
            <div className="heading">
                {Title}
            </div>
            <p id="total-expense-value" className="Total-expense-amount">
            Type: {data?.category} <br></br>
            Amount: {formatCurrency(data?.amount)}
            </p>
    </div>
    );
}