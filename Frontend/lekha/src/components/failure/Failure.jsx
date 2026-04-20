import './Failure.css';
import { useEffect } from 'react';

export default function Failure({ message, reasons }) {

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className="failure-screen">
            <svg className="failure-check" viewBox="0 0 120 120">
                <circle className="failure-circle" cx="60" cy="60" r="54" fill="none"/>
                <path className="failure-cross" fill="none" d="M40 40 L80 80 M80 40 L40 80"/>
            </svg>

            <h1 className='message-failure'>{message}!</h1>
            <div className="reasons">
                <ul>
                    {reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}