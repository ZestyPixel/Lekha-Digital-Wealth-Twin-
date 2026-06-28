import { useFormik } from 'formik';
import { useState, useEffect } from 'react';
import { useAuth } from "../../context/useAuth";
import Loading from '../../components/loading/Loading';
import Success from '../../components/success/Success';
import Failure from '../../components/failure/Failure';
import Warning from '../../components/warning/Warning';
import "./LumpForm.css"

const validate = values => {
    const errors = {};

    if (!values.amount || values.amount <= 0) {
        errors.amount = 'Enter a valid amount';
    }

    if (!values.assetType) {
        errors.assetType = 'Required';
    }

    if (!values.fundName) {
        errors.fundName = 'Required';
    } else if (values.fundName.length > 100) {
        errors.fundName = 'Must be 100 characters or less';
    }

    if (!values.purchaseDate) {
        errors.purchaseDate = 'Required';
    }

    if (!values.pin) {
        errors.pin = 'Required';
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
                message={`Transaction Blocked`}
                reasons={reasons}
            />
        );
    }
}

export default function LumpsumInvestment() {
    const { requestWithAuth } = useAuth();
    const [resultComponent, setResultComponent] = useState(null);
    const [asked, setAsked] = useState(false);
    const [answer, setAnswer] = useState('');

    useEffect(()=>{
        window.scrollTo({
            top: 120,
            behavior: 'smooth',
        });
    },[]);

    async function askHisaab(){
        setAsked(true);  
        setAnswer('');      
        const { amount, assetType, fundName } = formik.values;
        const query = {
            action: "lumpsum investment",
            amount,
            assetType,
            fundName,
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
            transactionType: 'lumpsum',
            amount: '',
            assetType: '',
            fundName: '',
            purchaseDate: '',
            pin: '',
        },
        validate,
        onSubmit: async (values, {setSubmitting}) => { //what setSubmitting does is it sets formik.isSubmitting to true, 
        // which we can use to conditionally render the loading component. 
        // We set it back to false when our operation is done.
            try {
                const response = await requestWithAuth('/addlumpsum', {
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
                }, 5000); // Show result for 5 seconds
                
            } catch (error) {
                console.error("Lumpsum Investment failed:", error);
                alert(error);
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
                <div className="login-title">Lumpsum Investment</div>
                <form className="login-box" onSubmit={formik.handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="amount" className="email-and-password">Investment Amount (₹):</label>
                        <input
                            id="amount"
                            name="amount"
                            className="email-bar"
                            type="number"
                            placeholder="Enter amount (Ex: 50000)"
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
                            <option value="Gold">Gold (Digital)</option>
                            <option value="Stocks">Stocks</option>
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
                            placeholder="Ex: Axis Bluechip Fund, Reliance, SGB"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.fundName}
                        />
                        {formik.touched.fundName && formik.errors.fundName && (
                            <div className="error">{formik.errors.fundName}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="purchaseDate" className="email-and-password">Purchase Date:</label>
                        <input
                            id="purchaseDate"
                            name="purchaseDate"
                            className="email-bar"
                            type="date"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.purchaseDate}
                        />
                        {formik.touched.purchaseDate && formik.errors.purchaseDate && (
                            <div className="error">{formik.errors.purchaseDate}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="pin" className="email-and-password">Pin:</label>
                        <input
                            id="pin"
                            name="pin"
                            className="email-bar"
                            type="password"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.pin}
                        />
                        {formik.touched.pin && formik.errors.pin && (
                            <div className="error">{formik.errors.pin}</div>
                        )}
                    </div>

                    <div className="sign">
                        <button type="submit" className="sign-in">Invest Lumpsum</button>
                        <button className="ask-hisaab" onClick={askHisaab} type='button'> Ask Hisaab before transaction ! </button>
                        {/* Have to write type = 'button' otherwise it is treated as submit by default. */}
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