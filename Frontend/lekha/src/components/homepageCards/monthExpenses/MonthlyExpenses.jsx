import "./MonthlyExpenses.css";
import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import { useTranslation } from "react-i18next";

const COLORS = [
  "#39FF14",
  "#FDD017",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#a855f7",
];

const localeMap = {
  en: "en-IN",
  hi: "hi-IN-u-nu-deva",
  bn: "bn-IN-u-nu-beng",
  mr: "mr-IN-u-nu-deva",
};

const CustomTooltip = ({ active, payload }) => {
  const { i18n } = useTranslation("translation", { keyPrefix: "dashboard" });
  const locale = localeMap[i18n.language] || "en-IN";
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="pie-tooltip">
        <p className="pie-tooltip-label">{name}</p>
        <p className="pie-tooltip-value">
          ₹{new Intl.NumberFormat(locale).format(value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function MonthlyExpenses({ Data = [] }) {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "dashboard" });

  const expenses = useMemo(() => {
    //So that you can cache the computed values and dont have to compute them everytime a refresh happens.
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
      //If Data does not exist, use [] otherwise use Data
      switch (point.category) {
        case "Housing":
          result.houUtil += point.amount;
          break;
        case "Food":
          result.foodDin += point.amount;
          break;
        case "Transportation":
          result.trans += point.amount;
          break;
        case "Lifestyle":
          result.lifeLeis += point.amount;
          break;
        case "Health":
          result.healthWell += point.amount;
          break;
        case "Financial":
          result.finObl += point.amount;
          break;
        case "Savings":
        case "Investment":
          result.savInv += point.amount;
          break;
        case "Miscellaneous":
          result.misc += point.amount;
          break;
        default:
          break;
      }
    });

    return result;
  }, [Data]);

  const totalWorth = (Data ?? []).reduce((acc, el) => acc + el.amount, 0);

  const locale = localeMap[i18n.language] || "en-IN";
  const formattedTotal = new Intl.NumberFormat(locale).format(totalWorth);

  const chartData = [
    { name: t("bills"), value: expenses.houUtil },
    { name: t("food"), value: expenses.foodDin },
    { name: t("transport"), value: expenses.trans },
    { name: t("lifestyle"), value: expenses.lifeLeis },
    { name: t("health"), value: expenses.healthWell },
    { name: t("obligations"), value: expenses.finObl },
    { name: t("savingsInvestments"), value: expenses.savInv },
    { name: t("misc"), value: expenses.misc },
  ];

  return (
    <div className="expen-pie card">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={chartData}
            cx="28%"
            cy="55%"
            innerRadius="70%"
            outerRadius="89%"
            paddingAngle={5}
            dataKey="value"
          >
            <Label //label has a content prop which can be a function that receives the viewBox(coordinates) of the pie chart
              // and returns custom JSX to render as the label. Here, we are using it to display the total expenses in the center of the pie chart.
              content={({ viewBox }) => {
                const { cx, cy } = viewBox;
                return (
                  <>
                    <text
                      x={cx + 1}
                      y={cy + 0}
                      textAnchor="middle"
                      fill="white"
                      fontSize={17.1}
                      fontWeight={600}
                    >
                      {t("totalExpenses")}
                    </text>
                    <text
                      x={cx + 1}
                      y={cy + 23}
                      textAnchor="middle"
                      fill="white"
                      fontSize={18}
                      fontWeight={700}
                    >
                      ₹{formattedTotal}
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
            wrapperStyle={{ marginLeft: "5px", paddingLeft: "0px" }}
            formatter={(value) => (
              <span className="expen-legend-label">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}