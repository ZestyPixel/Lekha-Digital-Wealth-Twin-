import "./LoginPage.css";
import { useFormik } from "formik";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useEffect } from "react";

const validate = (values) => {
    const errors = {};
    if (!values.email) {
        errors.email = "Required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
        errors.email = "Invalid email address";
    }

    if (!values.password) {
        errors.password = "Required";
    } else if (values.password.length > 20) {
        errors.password = "Must be 20 characters or less";
    }

    return errors;
};

export default function LoginForm() {
    useEffect(() => {
        window.scroll({
        top: "40",
        behavior: "smooth",
        });
    }, []);
    const navigate = useNavigate();
    const { login } = useAuth();

    const formik = useFormik({
        initialValues: {
        email: "",
        password: "",
        },
        validate,
        onSubmit: async (values) => {
            try {
                const result = await login(values.email, values.password);
                if (result.success) {
                    console.log("Login successful");
                    navigate("/homepage");
                } else {
                    alert(result.error);
                }
            } catch (err) {
                console.log(err);
                alert("Login failed");
            }
        },
    });
    function showPass() {
        //Show pass function
        const x = document.getElementById("password");
        if (x.type === "password") {
            x.type = "text";
        } else {
            x.type = "password";
        }
    }

    return (
    <div className="box">
        <div className="login-title">Login</div>
        <form className="login-box" onSubmit={formik.handleSubmit}>
            <div className="form-group">
                <label htmlFor="email" className="email-and-password">
                    Email:
                </label>
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
                {formik.errors.email ? (
                    <div className="error">{formik.errors.email}</div>
                ) : null}
            </div>
            
            <div className="form-group">
                <label htmlFor="password" className="email-and-password">
                    Password:
                </label>
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
                {formik.errors.password ? (
                    <div className="error">{formik.errors.password}</div>
                ) : null}
            </div>
            <div className="show-password">
                <input type="checkbox" id="show-pass" onClick={showPass} />
                <label htmlFor="show-pass"> Show Password</label>
            </div>
            <button className="sign-in-in">SIGN IN</button>
            <div className="forgot">
                <p>
                    Forgot <span className="user-pass">Username / Password</span>?
                </p>
                <Link to="/">
                {" "}
                <p>
                    Don't have an account?{" "}
                    <span className="sign-up-link">Sign Up</span>
                </p>{" "}
                </Link>
            </div>
        </form>
    </div>
    );
}