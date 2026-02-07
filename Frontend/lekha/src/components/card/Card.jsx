import "./Card.css"

export default function Card({Title}){
    return(
    <div className="card-grid">
        <div className="Total-expenses card">
            <div className="heading">
                {Title}
            </div>
            <p id="total-expense-value" className="Total-expense-amount">
            &#x20B9; 50000
            </p>
        </div>
    </div>
    );
}