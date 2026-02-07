import "./SignUp.css";
import { useFormik } from 'formik';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
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
        
        const navigate = useNavigate()
        const formik = useFormik({
            initialValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            },
            validate,
            onSubmit: async (values) => {
                console.log(values);
                await axios.post(`${import.meta.env.VITE_API_URL}/register`, values);
                navigate("/homepage");
            },
        });
        return (
        <div className="">
            <div>
                <Link to="/login">Already have an account ? <i><b>Log In!</b></i></Link>
            </div>
            <form onSubmit={formik.handleSubmit}>
                <label htmlFor="name">Name: </label> <br />
                <input
                    id="name"
                    name="name"
                    type="text"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.name}
                /> 
                {formik.errors.name ? <div>{formik.errors.name}</div> : null}
                <br /><br />
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
                <br /><br />
                <label htmlFor="confirmPassword">Confirm Password: </label> <br />
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.confirmPassword}
                />
                {formik.errors.confirmPassword ? <div>{formik.errors.confirmPassword}</div> : null}
            <br /> <br />
                <button type="submit">Submit</button>
            </form>
        </div>
        );
    };