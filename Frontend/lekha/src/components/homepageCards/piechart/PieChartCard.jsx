import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PieChartCard.css';
import { formatCurrency } from '../../../utils/functions';

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

export default function PieChartCard({ Data }) {
  const chartData = Data.map((item) => ({
    name: item.type,
    value: item.currentValue,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
      <div className="pie">
        <div className="heading">
            Net Worth
        </div>
        <p className="pie-total">Total: {formatCurrency(total)}</p>

        <ResponsiveContainer width="100%" height={135}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="48%"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              formatter={(value) => <span className="legend-label">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
  );
}