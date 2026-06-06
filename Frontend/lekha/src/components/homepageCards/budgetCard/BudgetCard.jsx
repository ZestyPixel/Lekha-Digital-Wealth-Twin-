import "./BudgetCard.css";
import { useMemo } from "react";

export default function BudgetCard({ DataP, DataT }) {
    const expenses = useMemo(() => {
        const result = {
            houUtil: 0, foodDin: 0, trans: 0, lifeLeis: 0,
            healthWell: 0, finObl: 0, savInv: 0, misc: 0,
        };

        (DataT ?? []).forEach(({ category, amount }) => {
            switch (category) {
                case "Housing":        result.houUtil    += amount; break;
                case "Food":           result.foodDin    += amount; break;
                case "Transportation": result.trans      += amount; break;
                case "Lifestyle":      result.lifeLeis   += amount; break;
                case "Health":         result.healthWell += amount; break;
                case "Financial":      result.finObl     += amount; break;
                case "Savings":        result.savInv     += amount; break;
                case "Miscellaneous":  result.misc       += amount; break;
                default: break;
            }
        });

        return result;
    }, [DataT]);

    const chartData = [
        { name: "Bills", icon: "", spent: expenses.houUtil, budget: DataP?.bills ?? 0 },
        { name: "Food", icon: "", spent: expenses.foodDin, budget: DataP?.food ?? 0 },
        { name: "Transport", icon: "", spent: expenses.trans, budget: DataP?.transport ?? 0 },
        { name: "Lifestyle", icon: "", spent: expenses.lifeLeis, budget: DataP?.lifestyle ?? 0 },
        { name: "Health", icon: "", spent: expenses.healthWell, budget: DataP?.health ?? 0 },
        { name: "Obligations", icon: "", spent: expenses.finObl, budget: DataP?.obligations ?? 0 },
        { name: "Savings", icon: "", spent: expenses.savInv, budget: DataP?.savings ?? 0 },
        { name: "Misc", icon: "", spent: expenses.misc, budget: DataP?.misc ?? 0 },
    ].map(d => ({
        ...d,
        pct: d.budget > 0 ? Math.round((d.spent / d.budget) * 100) : 0,
        over: d.spent > d.budget,
    }));

    function statusClass(pct) {
        if (pct >= 100) return "danger";
        if (pct >= 80) return "warning";
        if (pct >= 60) return "caution";
        return "good";
    }

    return (
        <div className="Total-expenses-budget card-budget card">
            <div className="budget-grid">
                {chartData.map((d) => {
                    const status = statusClass(d.pct);
                    const cappedPct = Math.min(d.pct, 100);
                    const overflowPct = d.pct > 100 ? Math.min(d.pct - 100, 50) : 0;

                    return (
                        <div key={d.name} className="budget-item">
                            <div className="budget-header">
                                <span className="budget-title">
                                    {d.icon} {d.name}
                                </span>
                                <span className={`budget-percent ${status}`}>
                                    {d.pct}%
                                </span>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${status}`}
                                    style={{ width: `${cappedPct}%` }}
                                />
                                {overflowPct > 0 && (
                                    <div
                                        className="progress-overflow"
                                        style={{ width: `${overflowPct}%` }}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}