import { formatCurrency } from "../../utils/functions";
import { useTranslation } from "react-i18next";

export default function DebtCard({ Name, Total, Remaining, EMI, Progress }) {
  const { t } = useTranslation("translation", { keyPrefix: "debt" });
  return (
    <div className="Total-expenses-trans card-trans card">
      <div className="heading-trans">{Name}</div>
      <p className="Total-expense-amount-trans">
        {t("totalAmount")} {formatCurrency(Total)} <br />
        {t("remainingBalance")} {formatCurrency(Remaining)} <br />
        {t("monthlyEmi")} {formatCurrency(EMI)} <br />
        {t("paidOff")} {Progress}%
      </p>
    </div>
  );
}
