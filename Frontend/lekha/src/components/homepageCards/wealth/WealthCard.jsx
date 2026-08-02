import "./WealthCard.css";
import { useTranslation } from "react-i18next";

export default function WealthCard({ Advice }) {
  const { t } = useTranslation("translation", { keyPrefix: "dashboard" });

  return (
    <div className="Total-expenses-wealth card">
      <div className="heading">{t("manageWealth")}</div>
      <p className="Total-expense-amount-wealth ">{Advice}</p>
    </div>
  );
}
