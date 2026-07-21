import { useFormik } from 'formik';
import { useState, useEffect } from 'react';
import { useAuth } from "../../context/useAuth";
import Loading from '../../components/loading/Loading';
import Success from '../../components/success/Success';
import Failure from '../../components/failure/Failure';
import Warning from '../../components/warning/Warning';
import "./SipForm.css"

const validate = values => {
    const errors = {};

    if (!values.amount || values.amount <= 0) {
        errors.amount = 'Enter a valid monthly amount';
    }

    if (!values.assetType) {
        errors.assetType = 'Required';
    }

    if (!values.fundName) {
        errors.fundName = 'Required';
    } else if (values.fundName.length > 100) {
        errors.fundName = 'Must be 100 characters or less';
    }

    if (!values.sipDate) {
        errors.sipDate = 'Required';
    }

    if (!values.startDate) {
        errors.startDate = 'Required';
    }

    return errors;
};

function Result({ decision, reasons }) {

    if (decision === "ALLOW") {
        return <Success message={`Transaction Successful`} />;
    }

    if (decision === "WARN") {
        return (
            <Warning 
                message={`Try again after 1 minute`}
                reasons={reasons}
            />
        );
    }

    if (decision === "BLOCK") {
        return (
            <Failure 
                message={`Transaction blocked`}
                reasons={reasons}
            />
        );
    }
}

export default function SIPInvestment() {
    const { requestWithAuth } = useAuth();
    const [resultComponent, setResultComponent] = useState(null);
    const [asked, setAsked] = useState(false);
    const [answer, setAnswer] = useState('');

    useEffect(()=>{
        window.scrollTo({
            top: 100,
            behavior: 'smooth',
        });
    },[]);

    async function askHisaab(){
        setAsked(true);  
        setAnswer('');
        const { amount, assetType, fundName, reason } = formik.values;
        const query = {
            action: "start sip",
            amount,
            assetType,
            fundName,
            reason,
        };
        const response = await requestWithAuth('/askHisaab', {
            method: 'POST',
            body: JSON.stringify({query})
        })
        const message = await response.json();
        const advice = message.finalData;
        setAnswer(advice);
    }

    const formik = useFormik({
        initialValues: {
            transactionType: 'sip',
            amount: '',
            assetType: '',
            fundName: '',
            sipDate: '',
            reason: '',
        },
        validate,
        onSubmit: async (values, {setSubmitting}) => {
            try {
                const response = await requestWithAuth('/addsip', {
                    method: 'POST',
                    body: JSON.stringify(values),
                });

                const result = await response.json();
                if (response.ok) {
                    setResultComponent(
                        <Result 
                            decision={result.security.decision} 
                            reasons={result.security.reasons} 
                            riskScore={result.security.riskScore}
                        />
                    );
                } 

                setTimeout(() => {
                    setResultComponent(null); // Reset to show form again
                }, 500); // Show result for 5 seconds

            } catch (error) {
                console.error("SIP setup failed:", error);
                alert("SIP setup failed");
            }

            setSubmitting(false);
        },
    });

    if(formik.isSubmitting) { // Show loading while waiting for response
        return <Loading/>
    }

    if (resultComponent) return resultComponent; //We render it. This will get rendered and the form will not cause a react component can only return one thing
    // at a time so when this is truthy, the code will never reach the form's return below. 

    return (
        <div className='form-container'>
            <div className="box">
                <div className="login-title">Setup SIP</div>
                <form className="login-box" onSubmit={formik.handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="amount" className="email-and-password">Monthly SIP Amount (₹):</label>
                        <input
                            id="amount"
                            name="amount"
                            className="email-bar"
                            type="number"
                            placeholder="Enter monthly amount (Ex: 5000)"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.amount}
                        />
                        {formik.touched.amount && formik.errors.amount && (
                            <div className="error">{formik.errors.amount}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="assetType" className="email-and-password">Asset Type:</label>
                        <select
                            id="assetType"
                            name="assetType"
                            className="email-bar"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.assetType}
                        >
                            <option value="" disabled>Select asset type</option>
                            <option value="MutualFund">Mutual Fund</option>
                            <option value="Stocks">Stocks</option>
                            <option value="Gold">Gold</option>
                        </select>
                        {formik.touched.assetType && formik.errors.assetType && (
                            <div className="error">{formik.errors.assetType}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="fundName" className="email-and-password">Fund / Asset Name:</label>
                        <input
                            id="fundName"
                            name="fundName"
                            className="email-bar"
                            type="text"
                            placeholder="Ex: Mirae Asset Large Cap Fund"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.fundName}
                        />
                        {formik.touched.fundName && formik.errors.fundName && (
                            <div className="error">{formik.errors.fundName}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reason" className="email-and-password">Reason:</label>
                        <input
                            id="reason"
                            name="reason"
                            className="email-bar"
                            placeholder="Enter reason"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.reason}
                        />
                        {formik.touched.reason && formik.errors.reason && (
                            <div className="error">{formik.errors.reason}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="sipDate" className="email-and-password">Monthly SIP Debit Date:</label>
                        <select
                            id="sipDate"
                            name="sipDate"
                            className="email-bar"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.sipDate}
                        >
                            <option value="" disabled>Select date of month</option>
                            {[1,5,7,10,15,20,25,28].map(d => (
                                <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of every month</option>
                            ))}
                        </select>
                        {formik.touched.sipDate && formik.errors.sipDate && (
                            <div className="error">{formik.errors.sipDate}</div>
                        )}
                    </div>

                    <div className="sign">
                        <button type="submit" className="sign-in">Invest Lumpsum</button>
                        <button className="ask-hisaab" onClick={askHisaab}> Ask Hisaab before transaction ! </button>
                    </div>

                </form>
            </div>
            {asked && !answer && (
                <div className="hisaab-loader">
                    <p>Hisaab is reviewing your transaction</p>
                    <div className="hisaab-line"></div>
                </div>
            )}

            {asked && answer && (
                <div className='text'>
                    <p><strong>Decision:</strong> {answer.decision}</p>
                    <p><strong>Risk:</strong> {answer.risk}</p>
                    <p><strong>Reason:</strong> {answer.reason}</p>
                    <p><strong>Alternative:</strong> {answer.alternative}</p>
                </div>
            )}
        </div>
    );
}