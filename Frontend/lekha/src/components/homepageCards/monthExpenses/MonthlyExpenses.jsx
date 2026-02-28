import "./MonthlyExpenses.css"
import { formatCurrency } from "../../../utils/functions";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';

const COLORS = ['#39FF14', '#FDD017', '#f59e0b', '#10b981', '#f43f5e', '#a855f7'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="pie-tooltip">
        <p className="pie-tooltip-label">{name}</p>
        <p className="pie-tooltip-value">{formatCurrency(value)}</p>
      </div>
    );
  }
  return null;
};

export default function MonthlyExpenses({Data = []}){

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

        (Data ?? []).forEach((point) => {
            switch (point.category) {
                case "housing": result.houUtil += point.amount; break;
                case "food": result.foodDin += point.amount; break;
                case "transportation": result.trans += point.amount; break;
                case "lifestyle": result.lifeLeis += point.amount; break;
                case "health": result.healthWell += point.amount; break;
                case "financial": result.finObl += point.amount; break;
                case "savings": result.savInv += point.amount; break;
                case "misc": result.misc += point.amount; break;
                default: break;
            }
        });

        return result;
    }, [Data]);

    const totalWorth = (Data ?? []).reduce((acc, el) => acc + el.amount, 0);

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
        <div className="expen-pie">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="52%"
                  innerRadius="70%"
                  outerRadius="100%"
                  paddingAngle={1}
                  dataKey="value"
                >
                <Label //label has a content prop which can be a function that receives the viewBox(coordinates) of the pie chart 
                    // and returns custom JSX to render as the label. Here, we are using it to display the total expenses in the center of the pie chart.
                content={({ viewBox }) => {
                    const { cx, cy } = viewBox;
                    return (
                    <>
                        <text x={cx+75} y={cy - 8} textAnchor="middle" fill="white" fontSize={16} fontWeight={600}>
                        Total Expenses
                        </text>
                        <text x={cx+75} y={cy + 10} textAnchor="middle" fill="white" fontSize={18} fontWeight={700}>
                        {formatCurrency(totalWorth)}
                        </text>
                    </>
                    );
                }}
                />
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                layout="vertical"
                align="left"
                verticalAlign="left"
                iconType="circle"
                formatter={(value) => <span className="expen-legend-label">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
    );
}