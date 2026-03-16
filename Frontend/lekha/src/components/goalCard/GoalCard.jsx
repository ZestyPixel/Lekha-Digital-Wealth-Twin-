import { formatCurrency } from "../../utils/functions";

export default function LastTransaction({Goal, Target, Date, Progress, Priority}){
    return(
        <div className="Total-expenses-trans card-trans">
            <div className="heading-trans">
                {Goal}
            </div>
            <p className="Total-expense-amount-trans">
                Target Amount : {formatCurrency(Target)} <br></br>
                Deadline : {Date} <br></br>
                Progress : {Progress}% <br></br>
                Priority : {Priority}
            </p>
    </div>
    );
}