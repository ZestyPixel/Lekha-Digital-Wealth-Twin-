import "./Debt.css";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useEffect } from "react";
import DebtCard from "../../components/debtCard/DebtCard";
import { useTranslation } from "react-i18next";

export default function AddDebt() {
  const { t } = useTranslation("translation", { keyPrefix: "debt" });

  const validate = (values) => {
    const errors = {};

    if (!values.debtName) {
      errors.debtName = "Required";
    } else if (values.debtName.length > 50) {
      errors.debtName = "Must be 50 characters or less";
    }

    if (!values.totalAmount) {
      errors.totalAmount = "Required";
    } else if (values.totalAmount <= 0) {
      errors.totalAmount = "Amount must be greater than 0";
    }

    if (values.remainingBalance === "" || values.remainingBalance === null) {
      errors.remainingBalance = "Required";
    } else if (values.remainingBalance < 0) {
      errors.remainingBalance = "Cannot be negative";
    } else if (Number(values.remainingBalance) > Number(values.totalAmount)) {
      errors.remainingBalance = "Cannot exceed total amount";
    }

    if (!values.monthlyEMI) {
      errors.monthlyEMI = "Required";
    } else if (values.monthlyEMI <= 0) {
      errors.monthlyEMI = "EMI must be greater than 0";
    }

    return errors;
  };

  useEffect(() => {
    window.scroll({
      top: "0",
      behavior: "smooth",
    });
  }, []);

  const navigate = useNavigate();
  const { requestWithAuth } = useAuth();
  const protectedData = JSON.parse(localStorage.getItem("protectedData"));

  const formik = useFormik({
    initialValues: {
      debtName: "",
      totalAmount: "",
      remainingBalance: "",
      monthlyEMI: "",
    },
    validate,
    onSubmit: async (values) => {
      try {
        const response = await requestWithAuth("/adddebt", {
          method: "POST",
          body: JSON.stringify(values),
        });

        const result = await response.json();

        if (result.success) {
          navigate("/homepage");
        } else {
          alert(result.error);
        }
      } catch (error) {
        console.error("Add Debt failed:", error);
        alert("Add Debt failed");
      }
    },
  });

  return (
    <div>
      <div className="card-container">
        {protectedData.debt.map((item) => (
          <DebtCard
            key={item._id}
            Name={item.debtName}
            Total={item.totalAmount}
            Remaining={item.remainingBalance}
            EMI={item.monthlyEMI}
            Progress={Math.round(
              ((item.totalAmount - item.remainingBalance) / item.totalAmount) *
                100,
            )}
          />
        ))}
      </div>

      <div className="box">
        <div className="login-title">{t("title")}</div>
        <form className="login-box" onSubmit={formik.handleSubmit}>
          <div className="form-group">
            <label htmlFor="debtName" className="email-and-password">
              {t("debtName")}
            </label>
            <input
              id="debtName"
              name="debtName"
              className="email-bar"
              type="text"
              placeholder={t("debtNamePlaceholder")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.debtName}
            />
            {formik.touched.debtName && formik.errors.debtName ? (
              <div className="error">{formik.errors.debtName}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="totalAmount" className="email-and-password">
              {t("totalAmount")}
            </label>
            <input
              id="totalAmount"
              name="totalAmount"
              className="email-bar"
              type="number"
              placeholder={t("totalAmountPlaceholder")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.totalAmount}
            />
            {formik.touched.totalAmount && formik.errors.totalAmount ? (
              <div className="error">{formik.errors.totalAmount}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="remainingBalance" className="email-and-password">
              {t("remainingBalance")}
            </label>
            <input
              id="remainingBalance"
              name="remainingBalance"
              className="email-bar"
              type="number"
              placeholder={t("remainingBalancePlaceholder")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.remainingBalance}
            />
            {formik.touched.remainingBalance &&
            formik.errors.remainingBalance ? (
              <div className="error">{formik.errors.remainingBalance}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label htmlFor="monthlyEMI" className="email-and-password">
              {t("monthlyEmi")}
            </label>
            <input
              id="monthlyEMI"
              name="monthlyEMI"
              className="email-bar"
              type="number"
              placeholder={t("monthlyEmiPlaceholder")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.monthlyEMI}
            />
            {formik.touched.monthlyEMI && formik.errors.monthlyEMI ? (
              <div className="error">{formik.errors.monthlyEMI}</div>
            ) : null}
          </div>

          <button type="submit" className="sign-up">
            {t("submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
