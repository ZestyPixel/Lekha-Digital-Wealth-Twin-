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
        <div>
            <button className='landing-button' onClick={handleDemoLogin}>
                Use Demo Account
            </button>
            <Link to={'/signUpForm'}>
                <button className='landing-button'>
                    Create New Account
                </button>
            </Link>
            <Link to={'/login'}>
                <button className='landing-button'>
                    Login
                </button>
            </Link>
        </div>
    );
}