import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";

const validate = values => {
    const errors = {};

    if (!values.transactionType) {
        errors.transactionType = 'Required';
    }

    if (!values.amount || values.amount <= 0) {
        errors.amount = 'Enter a valid amount';
    }

    if (!values.sourceType) {
        errors.sourceType = 'Required';
    }

    if (values.transactionType === 'Transfer') {
        if (!values.destinationType) {
            errors.destinationType = 'Required for transfers';
        }

        if (values.destinationType === 'BankAccount') {
            if (!values.destAccountNumber) errors.destAccountNumber = 'Required';
            if (!values.destIfsc) errors.destIfsc = 'Required';
            if (!values.destBankName) errors.destBankName = 'Required';
        }

        if (values.destinationType === 'Gold') {
            if (!values.destGoldGrams || values.destGoldGrams <= 0) errors.destGoldGrams = 'Enter valid grams';
            if (!values.destGoldPurity) errors.destGoldPurity = 'Required';
        }
    }

    if (!values.transactionDate) {
        errors.transactionDate = 'Required';
    }

    return errors;
};

function BankAccountFields({ formik }) {
    return (
        <>
            <div className="form-group">
                <label htmlFor="destAccountNumber" className="email-and-password">Account Number:</label>
                <input
                    id="destAccountNumber"
                    name="destAccountNumber"
                    className="email-bar"
                    type="text"
                    placeholder="Enter account number"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.destAccountNumber}
                />
                {formik.touched.destAccountNumber && formik.errors.destAccountNumber && (
                    <div className="error">{formik.errors.destAccountNumber}</div>
                )}
            </div>
            <div className="form-group">
                <label htmlFor="destIfsc" className="email-and-password">IFSC Code:</label>
                <input
                    id="destIfsc"
                    name="destIfsc"
                    className="email-bar"
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.destIfsc}
                />
                {formik.touched.destIfsc && formik.errors.destIfsc && (
                    <div className="error">{formik.errors.destIfsc}</div>
                )}
            </div>
            <div className="form-group">
                <label htmlFor="destBankName" className="email-and-password">Bank Name:</label>
                <input
                    id="destBankName"
                    name="destBankName"
                    className="email-bar"
                    type="text"
                    placeholder="e.g. State Bank of India"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.destBankName}
                />
                {formik.touched.destBankName && formik.errors.destBankName && (
                    <div className="error">{formik.errors.destBankName}</div>
                )}
            </div>
        </>
    );
}

function MutualFundFields({ formik }) {
    return (
        <>
            <div className="form-group">
                <label htmlFor="destFundName" className="email-and-password">Fund Name:</label>
                <input
                    id="destFundName"
                    name="destFundName"
                    className="email-bar"
                    type="text"
                    placeholder="e.g. Axis Bluechip Fund"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.destFundName}
                />
                {formik.touched.destFundName && formik.errors.destFundName && (
                    <div className="error">{formik.errors.destFundName}</div>
                )}
            </div>

        </>
    );
}

function GoldFields({ formik }) {
    return (
        <>
            <div className="form-group">
                <label htmlFor="destGoldGrams" className="email-and-password">Weight (grams):</label>
                <input
                    id="destGoldGrams"
                    name="destGoldGrams"
                    className="email-bar"
                    type="number"
                    placeholder="e.g. 5.5"
                    step="0.01"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.destGoldGrams}
                />
                {formik.touched.destGoldGrams && formik.errors.destGoldGrams && (
                    <div className="error">{formik.errors.destGoldGrams}</div>
                )}
            </div>
            <div className="form-group">
                <label htmlFor="destGoldPurity" className="email-and-password">Purity:</label>
                <select
                    id="destGoldPurity"
                    name="destGoldPurity"
                    className="email-bar"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.destGoldPurity}
                >
                    <option value="" disabled>Select purity</option>
                    <option value="24K">24K (99.9% Pure)</option>
                    <option value="22K">22K (91.6% Pure)</option>
                    <option value="18K">18K (75% Pure)</option>
                </select>
                {formik.touched.destGoldPurity && formik.errors.destGoldPurity && (
                    <div className="error">{formik.errors.destGoldPurity}</div>
                )}
            </div>
        </>
    );
}

function StockFields({ formik }) {
    return (
        <>
            <div className="form-group">
                <label htmlFor="destStockShares" className="email-and-password">Number of Shares:</label>
                <input
                    id="destStockShares"
                    name="destStockShares"
                    className="email-bar"
                    type="number"
                    placeholder="e.g. 10"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.destStockShares}
                />
                {formik.touched.destStockShares && formik.errors.destStockShares && (
                    <div className="error">{formik.errors.destStockShares}</div>
                )}
            </div>
        </>
    );
}

function DestinationDetailFields({ destinationType, formik }) {
    switch (destinationType) {
        case 'BankAccount': return <BankAccountFields formik={formik} />;
        case 'MutualFund':  return <MutualFundFields formik={formik} />;
        case 'Gold':        return <GoldFields formik={formik} />;
        case 'Stocks':      return <StockFields formik={formik} />;
        default:            return null;
    }
}

export default function TransferWithdraw() {
    const navigate = useNavigate();
    const { requestWithAuth } = useAuth();

    const formik = useFormik({
        initialValues: {
            transactionType: '',
            amount: '',
            sourceType: '',
            destinationType: '',
            destAccountNumber: '',
            destIfsc: '',
            destBankName: '',
            destFundName: '',
            destGoldGrams: '',
            destGoldPurity: '',
            destStockShares: '',
            transactionDate: '',
        },
        validate,
        onSubmit: async (values) => {
            try {
                const response = await requestWithAuth('/transferwithdraw', {
                    method: 'POST',
                    body: JSON.stringify(values),
                });

                const result = await response.json();

                if (result.success) {
                    navigate("/homepage");
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error("Transaction failed:", error);
                alert("Transaction failed");
            }
        },
    });

    const isTransfer = formik.values.transactionType === 'Transfer';

    return (
        <div>
            <div className="box">
                <div className="login-title">Transfer / Withdraw</div>
                <form className="login-box" onSubmit={formik.handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="transactionType" className="email-and-password">Transaction Type:</label>
                        <select
                            id="transactionType"
                            name="transactionType"
                            className="email-bar"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.transactionType}
                        >
                            <option value="" disabled>Select transaction type</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Redeem">Redeem (Mutual Fund / Gold)</option>
                        </select>
                        {formik.touched.transactionType && formik.errors.transactionType && (
                            <div className="error">{formik.errors.transactionType}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="amount" className="email-and-password">Amount (₹):</label>
                        <input
                            id="amount"
                            name="amount"
                            className="email-bar"
                            type="number"
                            placeholder="Enter amount (Ex: 10000)"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.amount}
                        />
                        {formik.touched.amount && formik.errors.amount && (
                            <div className="error">{formik.errors.amount}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="sourceType" className="email-and-password">Source Type:</label>
                        <select
                            id="sourceType"
                            name="sourceType"
                            className="email-bar"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.sourceType}
                        >
                            <option value="" disabled>Where is the money coming from?</option>
                            <option value="BankAccount">Bank Account</option>
                            <option value="MutualFund">Mutual Fund</option>
                            <option value="Gold">Gold</option>
                            <option value="Stocks">Stocks</option>
                        </select>
                        {formik.touched.sourceType && formik.errors.sourceType && (
                            <div className="error">{formik.errors.sourceType}</div>
                        )}
                    </div>

                    {isTransfer && (
                        <>
                            <div className="form-group">
                                <label htmlFor="destinationType" className="email-and-password">Destination Type:</label>
                                <select
                                    id="destinationType"
                                    name="destinationType"
                                    className="email-bar"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.destinationType}
                                >
                                    <option value="" disabled>Where is the money going to?</option>
                                    <option value="BankAccount">Bank Account</option>
                                    <option value="MutualFund">Mutual Fund</option>
                                    <option value="Gold">Gold (Digital)</option>
                                    <option value="Stocks">Stocks</option>
                                </select>
                                {formik.touched.destinationType && formik.errors.destinationType && (
                                    <div className="error">{formik.errors.destinationType}</div>
                                )}
                            </div>

                            <DestinationDetailFields
                                destinationType={formik.values.destinationType}
                                formik={formik}
                            />
                        </>
                    )}

                    <div className="form-group">
                        <label htmlFor="transactionDate" className="email-and-password">Transaction Date:</label>
                        <input
                            id="transactionDate"
                            name="transactionDate"
                            className="email-bar"
                            type="date"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.transactionDate}
                        />
                        {formik.touched.transactionDate && formik.errors.transactionDate && (
                            <div className="error">{formik.errors.transactionDate}</div>
                        )}
                    </div>

                    <button type="submit" className="sign-up">
                        {formik.values.transactionType === 'Transfer' ? 'Transfer Funds'
                            : formik.values.transactionType === 'Redeem' ? 'Redeem Asset'
                            : 'Withdraw Funds'}
                    </button>

                </form>
            </div>
        </div>
    );
}