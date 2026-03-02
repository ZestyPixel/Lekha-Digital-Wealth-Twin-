import "./LastTransaction.css"
import { formatCurrency } from "../../../utils/functions";

export default function LastTransaction({Title, data}){
    return(
        <div className="Total-expenses-trans card-trans">
            <div className="heading-trans">
                {Title}
            </div>
            <p className="Total-expense-amount-trans">
            Type: {data?.category} <br></br>
            Amount: {formatCurrency(data?.amount)}
            </p>
    </div>
    );
}