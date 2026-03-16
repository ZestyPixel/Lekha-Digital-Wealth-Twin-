import "./SignUp.css";
import { useFormik } from 'formik';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";
import { useEffect } from "react";

const validate = values => {
    const errors = {};

    if (!values.name) {
        errors.name = 'Required';
    } else if (values.name.length > 50) {
        errors.name = 'Must be 50 characters or less';
    }

    if (!values.email) {
        errors.email = 'Required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
        errors.email = 'Invalid email address';
    }

    if (!values.password) {
        errors.password = 'Required';
    } else if (values.password.length > 20) {
        errors.password = 'Must be 20 characters or less';
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = 'Required';
    } else if (values.confirmPassword !== values.password) {
        errors.confirmPassword = 'Passwords must match';
    }

    return errors;
};

export default function SignupForm(){
    useEffect(()=>{
        window.scroll({
            top: '130',
            behavior: 'smooth'
        })
    },[])
    const navigate = useNavigate();
    const { register } = useAuth();

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        validate,
        onSubmit: async (values) => {
            try {
                const result = await register(values.name, values.email, values.password);
                
                if (result.success) {
                    navigate("/login");
                } else {
                    alert(result.error);
                }
            } catch(error) {
                console.error("Registration failed:", error);
                alert("Registration failed");
            }
        },
    });

    return (
    <div className="box">
        <div className="login-title">Sign Up</div>
            <form className="login-box" onSubmit={formik.handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name" className="email-and-password">Name:</label>
                    <input
                        id="name"
                        name="name"
                        className="email-bar"
                        type="text"
                        placeholder="Enter name"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.name}
                    />
                    {formik.errors.name && <div className="error">{formik.errors.name}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="email" className="email-and-password">Email:</label>
                    <input
                        id="email"
                        name="email"
                        className="email-bar"
                        type="text"
                        placeholder="Enter email"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.email}
                    />
                    {formik.errors.email && <div className="error">{formik.errors.email}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="email-and-password">Password:</label>
                    <input
                        id="password"
                        name="password"
                        className="email-bar"
                        type="password"
                        placeholder="Enter password"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.password}
                    />
                    {formik.errors.password && <div className="error">{formik.errors.password}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword" className="email-and-password">Confirm Password:</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        className="email-bar"
                        type="password"
                        placeholder="Confirm password"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.confirmPassword}
                    />
                    {formik.errors.confirmPassword && <div className="error">{formik.errors.confirmPassword}</div>}
                </div>

                <div className="show-password">
                    <input type="checkbox" id="remember-me" />
                    <label htmlFor="remember-me">Remember Me</label>
                </div>

                <button type="submit" className="sign-up">SIGN UP</button>

                <div className="forgot">
                    <p>Already have an account? <Link to="/login"><span className="Login">Login</span></Link></p>
                </div>

            </form>
    </div>
    );
}