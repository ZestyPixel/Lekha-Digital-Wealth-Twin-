import "./WealthCard.css"


export default function WealthCard({Title, Advice}){
    return(
        <div className="Total-expenses card">
            <div className="heading">
                {Title}
            </div>
            <p className="Total-expense-amount-trans ">
                {Advice}
            </p>
        </div>
    );
}