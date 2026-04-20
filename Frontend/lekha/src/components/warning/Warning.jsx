import './Warning.css';
import { useEffect } from 'react';

export default function Warning({ message, reasons }) {

    useEffect(()=>{
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    },[]);

    return (
        <div className="success-screen">
            <svg className="success-check" viewBox="0 0 120 120">
                <circle className="success-circle" cx="60" cy="60" r="54" fill="none"/>
                <path className="success-tick" fill="none" d="M35 65 L55 85 L90 40"/>
            </svg>

            <h1 className='message'>{message}</h1>
            <div className="reasons">
                <h2>Reasons:</h2>
                <ul>
                    {reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}