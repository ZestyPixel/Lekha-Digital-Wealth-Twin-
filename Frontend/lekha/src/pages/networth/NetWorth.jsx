import "./NetWorth.css";
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";
import { useLocation } from "react-router-dom";

const validate = values => {
    const errors = {};

    if (!values.type) {
        errors.type = 'Required';
    } else if (values.type.length > 50) {
        errors.type = 'Must be 50 characters or less';
    }

    if (!values.currentValue) {
        errors.currentValue = 'Required';
    }

    if (!values.institution) {
        errors.institution = 'Required';
    }

    return errors;
};

export default function AddAssetForm() {
    const location = useLocation();
    const asset = location.state;
    const navigate = useNavigate();
    const { requestWithAuth } = useAuth();

    const formik = useFormik({
        initialValues: {
            type: '',
            currentValue: 0,
            institution: '',
        },
        validate,
        onSubmit: async (values) => {
            try {
                const response = await requestWithAuth('/addasset', {
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
                console.error("Add Asset failed:", error);
                alert("Add Asset failed");
            }
        },
    });

    return (
    <div>
        
        {asset.map((el)=>(
            <p className="text-xl"> Type: {el.type} <br/> Value: {el.currentValue} <br/> Held By: {el.institution} <br/><br/></p>
        ))}
        <div className="box">
            <div className="login-title">Add Asset</div>
            <form className="login-box" onSubmit={formik.handleSubmit}>

                <div className="form-group">
                    <label htmlFor="type" className="email-and-password">Asset Type:</label>
                    <input
                        id="type"
                        name="type"
                        className="email-bar"
                        type="text"
                        placeholder="Enter asset type (Ex- Gold, Money, etc)"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.type}
                    />
                    {formik.errors.type && <div className="error">{formik.errors.type}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="currentValue" className="email-and-password">Asset Value:</label>
                    <input
                        id="currentValue"
                        name="currentValue"
                        className="email-bar"
                        type="number"
                        placeholder="Enter asset value (Ex- 20000)"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.currentValue}
                    />
                    {formik.errors.currentValue && <div className="error">{formik.errors.currentValue}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="institution" className="email-and-password">Holding Institution:</label>
                    <input
                        id="institution"
                        name="institution"
                        className="email-bar"
                        type="text"
                        placeholder="Enter asset holder (Ex- Bank, Personal, etc)"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.institution}
                    />
                    {formik.errors.institution && <div className="error">{formik.errors.institution}</div>}
                </div>

                <button type="submit" className="sign-up">Add Asset</button>

            </form>
        </div>
    </div>
    );
}