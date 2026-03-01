import "./BudgetCard.css"
import { formatCurrency } from "../../../utils/functions";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";

export default function BudgetCard({DataP, DataT}){
    const expenses = useMemo(() => {
            const result = {
                houUtil: 0,
                foodDin: 0,
                trans: 0,
                lifeLeis: 0,
                healthWell: 0,
                finObl: 0,
                savInv: 0,
                misc: 0,
            };
    
            (DataT ?? []).forEach((point) => {
                switch (point.category) {
                    case "Housing": result.houUtil += point.amount; break;
                    case "Food": result.foodDin += point.amount; break;
                    case "Transportation": result.trans += point.amount; break;
                    case "Lifestyle": result.lifeLeis += point.amount; break;
                    case "Health": result.healthWell += point.amount; break;
                    case "Financial": result.finObl += point.amount; break;
                    case "Savings": result.savInv += point.amount; break;
                    case "Misc": result.misc += point.amount; break;
                    default: break;
                }
            });
    
            return result;
        }, [DataT]);
    
        const totalWorth = (DataT ?? []).reduce((acc, el) => acc + el.amount, 0);
    
        const chartData = [
            { name: "Bills", value: expenses.houUtil },
            { name: "Food", value: expenses.foodDin },
            { name: "Transport", value: expenses.trans },
            { name: "Lifestyle", value: expenses.lifeLeis },
            { name: "Health", value: expenses.healthWell },
            { name: "Obligations", value: expenses.finObl },
            { name: "Savings/Investments", value: expenses.savInv },
            { name: "Misc", value: expenses.misc },
        ];
        
    return(
        <div className="Total-expenses card">
            <div className="heading">
                {JSON.stringify()}
            </div>
            <p id="total-expense-value" className="Total-expense-amount">
                {formatCurrency("50000")}
            </p>
        </div>
    );
}