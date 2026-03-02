import "./Profile.css";
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";

const validate = values => {
    const errors = {};

    if (!values.monthlyIncome) {
        errors.monthlyIncome = 'Required';
    }
    if (!values.bills) errors.bills = 'Required';
    if (!values.food) errors.food = 'Required';
    if (!values.health) errors.health = 'Required';
    if (!values.lifestyle) errors.lifestyle = 'Required';
    if (!values.misc) errors.misc = 'Required';
    if (!values.obligations) errors.obligations = 'Required';
    if (!values.savings) errors.savings = 'Required';
    if (!values.transport) errors.transport = 'Required';

    return errors;
};

export default function Profile() {
    const navigate = useNavigate();
    const { requestWithAuth } = useAuth();

    const formik = useFormik({
        initialValues: {
            monthlyIncome: '',
            bills: '',
            food: '',
            health: '',
            lifestyle: '',
            misc: '',
            obligations: '',
            savings: '',
            transport: '',
        },
        validate,
        onSubmit: async (values) => {
            try {
                const response = await requestWithAuth('/setprofile', {
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
                console.error("Set Budget failed:", error);
                alert("Set Budget failed");
            }
        },
    });

    return (
        <div>
            <div className="box">
                <div className="login-title">Set Monthly Budget</div>
                <form className="login-box" onSubmit={formik.handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="monthlyIncome" className="email-and-password">Monthly Income:</label>
                        <input
                            id="monthlyIncome"
                            name="monthlyIncome"
                            className="email-bar"
                            type="number"
                            placeholder="Enter your monthly income"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.monthlyIncome}
                        />
                        {formik.errors.monthlyIncome && <div className="error">{formik.errors.monthlyIncome}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="bills" className="email-and-password">Bills Budget:</label>
                        <input
                            id="bills"
                            name="bills"
                            className="email-bar"
                            type="number"
                            placeholder="Enter budget for Bills"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.bills}
                        />
                        {formik.errors.bills && <div className="error">{formik.errors.bills}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="food" className="email-and-password">Food Budget:</label>
                        <input
                            id="food"
                            name="food"
                            className="email-bar"
                            type="number"
                            placeholder="Enter budget for Food"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.food}
                        />
                        {formik.errors.food && <div className="error">{formik.errors.food}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="health" className="email-and-password">Health Budget:</label>
                        <input
                            id="health"
                            name="health"
                            className="email-bar"
                            type="number"
                            placeholder="Enter budget for Health"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.health}
                        />
                        {formik.errors.health && <div className="error">{formik.errors.health}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="lifestyle" className="email-and-password">Lifestyle Budget:</label>
                        <input
                            id="lifestyle"
                            name="lifestyle"
                            className="email-bar"
                            type="number"
                            placeholder="Enter budget for Lifestyle"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.lifestyle}
                        />
                        {formik.errors.lifestyle && <div className="error">{formik.errors.lifestyle}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="obligations" className="email-and-password">Obligations Budget:</label>
                        <input
                            id="obligations"
                            name="obligations"
                            className="email-bar"
                            type="number"
                            placeholder="Enter budget for Obligations"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.obligations}
                        />
                        {formik.errors.obligations && <div className="error">{formik.errors.obligations}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="savings" className="email-and-password">Savings/Investments Budget:</label>
                        <input
                            id="savings"
                            name="savings"
                            className="email-bar"
                            type="number"
                            placeholder="Enter budget for Savings/Investments"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.savings}
                        />
                        {formik.errors.savings && <div className="error">{formik.errors.savings}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="transport" className="email-and-password">Transport Budget:</label>
                        <input
                            id="transport"
                            name="transport"
                            className="email-bar"
                            type="number"
                            placeholder="Enter budget for Transport"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.transport}
                        />
                        {formik.errors.transport && <div className="error">{formik.errors.transport}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="misc" className="email-and-password">Misc Budget:</label>
                        <input
                            id="misc"
                            name="misc"
                            className="email-bar"
                            type="number"
                            placeholder="Enter budget for Misc"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.misc}
                        />
                        {formik.errors.misc && <div className="error">{formik.errors.misc}</div>}
                    </div>

                    <button type="submit" className="sign-up">Save</button>

                </form>
            </div>
        </div>
    );
}