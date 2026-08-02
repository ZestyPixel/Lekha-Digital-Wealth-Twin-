import "./BudgetCard.css";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const localeMap = {
  en: "en-IN",
  hi: "hi-IN-u-nu-deva",
  bn: "bn-IN-u-nu-beng",
  mr: "mr-IN-u-nu-deva",
};

export default function BudgetCard({ DataP, DataT }) {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "dashboard" });
  const locale = localeMap[i18n.language] || "en-IN";

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

    (DataT ?? []).forEach(({ category, amount }) => {
      switch (category) {
        case "Housing":
          result.houUtil += amount;
          break;
        case "Food":
          result.foodDin += amount;
          break;
        case "Transportation":
          result.trans += amount;
          break;
        case "Lifestyle":
          result.lifeLeis += amount;
          break;
        case "Health":
          result.healthWell += amount;
          break;
        case "Financial":
          result.finObl += amount;
          break;
        case "Savings":
          result.savInv += amount;
          break;
        case "Miscellaneous":
          result.misc += amount;
          break;
        default:
          break;
      }
    });

    return result;
  }, [DataT]);

  const chartData = [
    {
      name: t("bills"),
      icon: "",
      spent: expenses.houUtil,
      budget: DataP?.bills ?? 0,
    },
    {
      name: t("food"),
      icon: "",
      spent: expenses.foodDin,
      budget: DataP?.food ?? 0,
    },
    {
      name: t("transport"),
      icon: "",
      spent: expenses.trans,
      budget: DataP?.transport ?? 0,
    },
    {
      name: t("lifestyle"),
      icon: "",
      spent: expenses.lifeLeis,
      budget: DataP?.lifestyle ?? 0,
    },
    {
      name: t("health"),
      icon: "",
      spent: expenses.healthWell,
      budget: DataP?.health ?? 0,
    },
    {
      name: t("obligations"),
      icon: "",
      spent: expenses.finObl,
      budget: DataP?.obligations ?? 0,
    },
    {
      name: t("savingsInvestments"),
      icon: "",
      spent: expenses.savInv,
      budget: DataP?.savings ?? 0,
    },
    {
      name: t("misc"),
      icon: "",
      spent: expenses.misc,
      budget: DataP?.misc ?? 0,
    },
  ].map((d) => ({
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
    <div className="Total-expenses-budget card">
      <div className="budget-grid">
        {chartData.map((d) => {
          const status = statusClass(d.pct);
          const cappedPct = Math.min(d.pct, 100);
          const overflowPct = d.pct > 100 ? Math.min(d.pct - 100, 50) : 0;
          const formattedPct = new Intl.NumberFormat(locale).format(d.pct);

          return (
            <div key={d.name} className="budget-item">
              <div className="budget-header">
                <span className="budget-title">
                  {d.icon} {d.name}
                </span>
                <span className={`budget-percent ${status}`}>
                  {formattedPct}%
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