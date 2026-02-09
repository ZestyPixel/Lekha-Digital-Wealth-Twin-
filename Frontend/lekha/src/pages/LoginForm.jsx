import "./LoginPage.css";
import { useFormik } from 'formik';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

    const validate = values => {
        const errors = {};

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
 
        return errors;
    };

    export default function LoginForm(){
        const navigate = useNavigate();
        const { login } = useAuth();

        const formik = useFormik({
            initialValues: {
            email: '',
            password: '',
            },
            validate,
            onSubmit: async (values) => {
                try {
                    const result = await login(values.email, values.password);
                
                    if (result.success) {
                        console.log("Login successful");
                        navigate('/homepage');
                    } else {
                        alert(result.error);
                    }
                } catch(err) {
                    console.log(err);
                    alert("Login failed");
                }
            },
    });
        return (
        <div className="">
            <div>
                <Link to="/">Have not made an account ? <i><b>Sign Up!</b></i></Link>
            </div>
            <form onSubmit={formik.handleSubmit}>
                <label htmlFor="email">Email: </label> <br />
                <input
                    id="email"
                    name="email"
                    type="text"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                /> 
                {formik.errors.email ? <div>{formik.errors.email}</div> : null}
                <br /><br />
                <label htmlFor="password">Password: </label> <br />
                <input
                    id="password"
                    name="password"
                    type="password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                />
                {formik.errors.password ? <div>{formik.errors.password}</div> : null}
            <br /> <br />
                <button type="submit">Submit</button>
            </form>
        </div>
        );
    };
