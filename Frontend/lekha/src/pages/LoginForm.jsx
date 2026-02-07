import "./LoginPage.css";
import { useFormik } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
        
        const navigate = useNavigate()
        const formik = useFormik({
            initialValues: {
            email: '',
            password: '',
            },
            validate,
            onSubmit: async (values) => {
                console.log(values);
                await axios.post(`${import.meta.env.VITE_API_URL}/login`, values);
                navigate("/homepage");
            },
        });
        return (
        <div className="">
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
