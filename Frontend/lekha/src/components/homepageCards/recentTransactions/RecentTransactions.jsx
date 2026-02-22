import "./RecentTransactions.css"

export default function RecentTransactions({Title, data}){
    return(
    <div className="card-grid">
        <div className="Total-expenses card">
            <div className="heading">
                {Title}
            </div>
            <p id="total-expense-value" className="Total-expense-amount">
            Type: {data?.category} <br></br>
            Amount: &#x20B9; {data?.amount}
            </p>
        </div>
    </div>
    );
}