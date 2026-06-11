import { formatCurrency } from "../../utils/functions";

export default function LastTransaction({Amount, Category, CreatedAt}){
    return(
        <div className="Total-expenses-trans card-trans">
            <div className="heading-trans">
                {Category}
            </div>
            <p className="Total-expense-amount-trans">
                Amount : {formatCurrency(Amount)} <br></br>
                Date : {new Date(CreatedAt).toLocaleDateString()}
            </p>
        </div>
    );
}