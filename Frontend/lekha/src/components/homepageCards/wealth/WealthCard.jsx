import "./WealthCard.css"


export default function WealthCard({Title, Advice}){
    return(
        <div className="Total-expenses-wealth card">
            <div className="heading">
                {Title}
            </div>
            <p className="Total-expense-amount-wealth ">
                {Advice}
            </p>
        </div>
    );
}