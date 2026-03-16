import "./MonthlyExpenses.css";
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";
import { useEffect } from "react";

const validate = values => {
    const errors = {};

    if (!values.description) {
        errors.description = 'Required';
    } else if (values.description.length > 50) {
        errors.description = 'Must be 50 characters or less';
    }

    if (!values.amount) {
        errors.amount = 'Required';
    }

    return errors;
};

export default function MonthlyExpenses() {
    const navigate = useNavigate();
    const { requestWithAuth } = useAuth();

    const formik = useFormik({
        initialValues: {
            description: '',
            amount: 0,
            category: '',
        },
        validate,
        onSubmit: async (values) => {
            try {
                const response = await requestWithAuth('/addtransaction', {
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
                console.error("Add Transaction failed:", error);
                alert("Add Transaction failed");
            }
        },
    });

    useEffect(()=>{
        window.scroll({
            top: '100',
            behavior: 'smooth'
        })
    },[])

    return (
    <div>
        <div className="box">
            <div className="login-title">Track Expense</div>
            <form className="login-box" onSubmit={formik.handleSubmit}>

                <div className="form-group">
                    <label htmlFor="amount" className="email-and-password">Amount:</label>
                    <input
                        id="amount"
                        name="amount"
                        className="email-bar"
                        type="number"
                        placeholder="Enter asset value (Ex- 20000)"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.amount}
                    />
                    {formik.errors.amount && <div className="error">{formik.errors.amount}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="description" className="email-and-password">Description:</label>
                    <input
                        id="description"
                        name="description"
                        className="email-bar"
                        type="text"
                        placeholder="Ex: Chai Garam, Mall"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.description}
                    />
                    {formik.errors.description && <div className="error">{formik.errors.description}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="category" className="email-and-password">Expense Category:</label>
                    <select
                        id="category"
                        name="category"
                        className="email-bar"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.category}
                    >
                        <option value="" disabled>Select a category</option>
                        <option value="Housing">Housing & Utilities</option>
                        <option value="Food">Food & Dining</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Lifestyle">Lifestyle & Leisure</option>
                        <option value="Health">Health & Wellness</option>
                        <option value="Financial">Financial Obligations</option>
                        <option value="Savings">Savings & Investments</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                    {formik.errors.category && <div className="error">{formik.errors.category}</div>}
                </div>

                <button type="submit" className="sign-up">Track Expense</button>

            </form>
        </div>
    </div>
    );
}