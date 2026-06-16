import './LandingPage.css'
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";

export default function LandingPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleDemoLogin() {
        const email = "demouser@mail.com";
        const password = "123";

        try {
            await login(email, password);
            navigate('/homepage');
        } catch (error) {
            console.log(error);
        }
    }

    return (
    <div className="body-landing-page">
        <div className="header-landing-page">
            <p className="texts">Welcome To Lekha !</p>
        </div>
        <div className="container">
            <div>
                <Link to={'/login'}>
                <button className='sign-Up'>
                    <span>Login</span>
                </button>
                </Link>
            </div>
            <div>
                <button className="demo" onClick={handleDemoLogin}>
                    <span className="text-demo" onClick={handleDemoLogin}>Use Demo Account</span>
                </button>
            </div>
            <div>
                <Link to={'/signUpForm'}>
                <button className="sign-Up">
                    <span>Sign Up</span>
                </button>
                </Link>
            </div>
        </div>    
    </div>
    );
}