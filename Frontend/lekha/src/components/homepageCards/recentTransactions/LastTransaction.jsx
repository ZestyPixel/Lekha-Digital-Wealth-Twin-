import "./LastTransaction.css";
import { useTranslation } from "react-i18next";

const localeMap = {
  en: "en-IN",
  hi: "hi-IN-u-nu-deva",
  bn: "bn-IN-u-nu-beng",
  mr: "mr-IN-u-nu-deva",
};

export default function LastTransaction({ data }) {
  const { t, i18n } = useTranslation("translation", { keyPrefix: "dashboard" });

  const locale = localeMap[i18n.language] || "en-IN";
  const formattedTotal = new Intl.NumberFormat(locale).format(data?.amount);

  return (
    <div className="Total-expenses-trans card-trans card">
      <div className="heading-trans">{t("lastTransaction")}</div>
      <p className="Total-expense-amount-trans">
        {t("type")} {t(data?.category)} <br></br>
        {t("amount")} ₹{formattedTotal}
      </p>
    </div>
  );
}
