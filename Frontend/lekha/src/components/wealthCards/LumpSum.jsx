import "./LumpSum.css"

export default function LumpSum({Title}){
    return(
        <div className="Total-expenses card">
            <div className="heading">
                {Title}
            </div>
            <label htmlFor="category" className="heading-label">Expense Category:</label> <br />
                    <select
                        id="category"
                        name="category"
                        className="source"
                    >
                        <option value="" disabled>Select Source</option>
                        <option value="Food">Food & Dining</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Lifestyle">Lifestyle & Leisure</option>
                        <option value="Health">Health & Wellness</option>
                        <option value="Financial">Financial Obligations</option>
                        <option value="Savings">Savings & Investments</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                    </select>
        </div>
    );
}