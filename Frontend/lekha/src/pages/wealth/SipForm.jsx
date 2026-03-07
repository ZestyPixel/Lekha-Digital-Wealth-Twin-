import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";

const validate = values => {
    const errors = {};

    if (!values.monthlyAmount || values.monthlyAmount <= 0) {
        errors.monthlyAmount = 'Enter a valid monthly amount';
    }

    if (!values.assetType) {
        errors.assetType = 'Required';
    }

    if (!values.fundName) {
        errors.fundName = 'Required';
    } else if (values.fundName.length > 100) {
        errors.fundName = 'Must be 100 characters or less';
    }

    if (!values.sipDate) {
        errors.sipDate = 'Required';
    }

    if (!values.startDate) {
        errors.startDate = 'Required';
    }

    if (values.tenure && (values.tenure < 1 || values.tenure > 360)) {
        errors.tenure = 'Tenure must be between 1 and 360 months';
    }

    return errors;
};

export default function SIPInvestment() {
    const navigate = useNavigate();
    const { requestWithAuth } = useAuth();

    const formik = useFormik({
        initialValues: {
            monthlyAmount: '',
            assetType: '',
            fundName: '',
            sipDate: '',
            startDate: '',
            tenure: '',
            notes: '',
        },
        validate,
        onSubmit: async (values) => {
            try {
                const response = await requestWithAuth('/addsip', {
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
                console.error("SIP setup failed:", error);
                alert("SIP setup failed");
            }
        },
    });

    return (
        <div>
            <div className="box">
                <div className="login-title">Setup SIP</div>
                <form className="login-box" onSubmit={formik.handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="monthlyAmount" className="email-and-password">Monthly SIP Amount (₹):</label>
                        <input
                            id="monthlyAmount"
                            name="monthlyAmount"
                            className="email-bar"
                            type="number"
                            placeholder="Enter monthly amount (Ex: 5000)"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.monthlyAmount}
                        />
                        {formik.touched.monthlyAmount && formik.errors.monthlyAmount && (
                            <div className="error">{formik.errors.monthlyAmount}</div>
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
                            <option value="Stocks">Stocks</option>
                            <option value="Gold">Digital Gold</option>
                            <option value="ETF">ETF</option>
                            <option value="Other">Other</option>
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
                            placeholder="Ex: Mirae Asset Large Cap Fund"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.fundName}
                        />
                        {formik.touched.fundName && formik.errors.fundName && (
                            <div className="error">{formik.errors.fundName}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="sipDate" className="email-and-password">Monthly SIP Debit Date:</label>
                        <select
                            id="sipDate"
                            name="sipDate"
                            className="email-bar"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.sipDate}
                        >
                            <option value="" disabled>Select date of month</option>
                            {[1,5,7,10,15,20,25,28].map(d => (
                                <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of every month</option>
                            ))}
                        </select>
                        {formik.touched.sipDate && formik.errors.sipDate && (
                            <div className="error">{formik.errors.sipDate}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="startDate" className="email-and-password">SIP Start Date:</label>
                        <input
                            id="startDate"
                            name="startDate"
                            className="email-bar"
                            type="date"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.startDate}
                        />
                        {formik.touched.startDate && formik.errors.startDate && (
                            <div className="error">{formik.errors.startDate}</div>
                        )}
                    </div>

                    <button type="submit" className="sign-up">Start SIP</button>

                </form>
            </div>
        </div>
    );
}