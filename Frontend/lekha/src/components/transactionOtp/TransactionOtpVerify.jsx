import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import './TransactionOtpVerify.css';

export default function TransactionOtpVerify({ message, reasons, onVerified, onCancel }) {
    const { verifyTransactionOtp } = useAuth();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setVerifying(true);
        try {
            const result = await verifyTransactionOtp(otp);
            if (!result.success) {
                setError(result.error || 'Verification failed');
                return;
            }
            onVerified(result.data);
        } finally {
            setVerifying(false);
        }
    }

    return (
        <div className="otp-verify-screen">
            <h1 className="otp-verify-title">Verify to Continue</h1>
            <p className="otp-verify-message">{message}</p>

            {reasons?.length > 0 && (
                <div className="otp-verify-reasons">
                    <ul>
                        {reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}

            <p className="otp-verify-subtext">
                We've emailed a verification code to confirm this transaction.
            </p>

            <form className="otp-verify-form" onSubmit={handleSubmit}>
                <input
                    id="transactionOtp"
                    name="transactionOtp"
                    className="email-bar"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                />
                {error ? <div className="error">{error}</div> : null}

                <div className="otp-verify-actions">
                    <button type="submit" className="sign-in" disabled={verifying || otp.length !== 6}>
                        {verifying ? 'Verifying...' : 'Verify'}
                    </button>
                    <button type="button" className="ask-hisaab" onClick={onCancel} disabled={verifying}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}