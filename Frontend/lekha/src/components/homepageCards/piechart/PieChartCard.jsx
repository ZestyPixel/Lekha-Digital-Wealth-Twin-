import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
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
      <div className="pie card">
        <div className="heading-networth" >
            Net Worth
        </div>

        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={chartData}
              cx="40%"
              cy="42%"          
              innerRadius="70%"  
              outerRadius="89%"  
              paddingAngle={5}
              dataKey="value"
            >
              <Label
              content={({ viewBox }) => {
                const { cx, cy } = viewBox;
                return (
                <>
                <text x={cx+32} y={cy - 22} textAnchor="middle" fill="white" fontSize={15} fontWeight={600}>
                  Total:
                </text>
                <text x={cx+29} y={cy + 2} textAnchor="middle" fill="white" fontSize={18} fontWeight={700}>
                  {formatCurrency(total)}
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
              formatter={(value) => <span className="legend-label">{value}</span>}
              wrapperStyle={{ marginLeft: '5px', paddingLeft: '0px', marginTop: '20px' }}
            />
            
          </PieChart>
        </ResponsiveContainer>
      </div>
  );
}