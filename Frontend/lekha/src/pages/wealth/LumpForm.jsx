import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";

const validate = values => {
    const errors = {};

    if (!values.amount || values.amount <= 0) {
        errors.amount = 'Enter a valid amount';
    }

    if (!values.assetType) {
        errors.assetType = 'Required';
    }

    if (!values.fundName) {
        errors.fundName = 'Required';
    } else if (values.fundName.length > 100) {
        errors.fundName = 'Must be 100 characters or less';
    }

    if (!values.purchaseDate) {
        errors.purchaseDate = 'Required';
    }

    return errors;
};

export default function LumpsumInvestment() {
    const navigate = useNavigate();
    const { requestWithAuth } = useAuth();

    const formik = useFormik({
        initialValues: {
            amount: '',
            assetType: '',
            fundName: '',
            purchaseDate: '',
        },
        validate,
        onSubmit: async (values) => {
            try {
                const response = await requestWithAuth('/addlumpsum', {
                    method: 'POST',
                    body: JSON.stringify(values),
                });

                const result = await response.json();

                if (result.success) {
                    navigate("/homepage");
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error("Lumpsum Investment failed:", error);
                alert("Lumpsum Investment failed");
            }
        },
    });

    return (
        <div>
            <div className="box">
                <div className="login-title">Lumpsum Investment</div>
                <form className="login-box" onSubmit={formik.handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="amount" className="email-and-password">Investment Amount (₹):</label>
                        <input
                            id="amount"
                            name="amount"
                            className="email-bar"
                            type="number"
                            placeholder="Enter amount (Ex: 50000)"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.amount}
                        />
                        {formik.touched.amount && formik.errors.amount && (
                            <div className="error">{formik.errors.amount}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="assetType" className="email-and-password">Asset Type:</label>
                        <select
                            id="assetType"
                            name="assetType"
                            className="email-bar"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.assetType}
                        >
                            <option value="" disabled>Select asset type</option>
                            <option value="MutualFund">Mutual Fund</option>
                            <option value="Gold">Gold (Digital)</option>
                        </select>
                        {formik.touched.assetType && formik.errors.assetType && (
                            <div className="error">{formik.errors.assetType}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="fundName" className="email-and-password">Fund / Asset Name:</label>
                        <input
                            id="fundName"
                            name="fundName"
                            className="email-bar"
                            type="text"
                            placeholder="Ex: Axis Bluechip Fund, Reliance, SGB"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.fundName}
                        />
                        {formik.touched.fundName && formik.errors.fundName && (
                            <div className="error">{formik.errors.fundName}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="purchaseDate" className="email-and-password">Purchase Date:</label>
                        <input
                            id="purchaseDate"
                            name="purchaseDate"
                            className="email-bar"
                            type="date"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.purchaseDate}
                        />
                        {formik.touched.purchaseDate && formik.errors.purchaseDate && (
                            <div className="error">{formik.errors.purchaseDate}</div>
                        )}
                    </div>

                    <button type="submit" className="sign-up">Invest Lumpsum</button>

                </form>
            </div>
        </div>
    );
}