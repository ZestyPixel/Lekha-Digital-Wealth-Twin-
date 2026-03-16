import "./Goals.css";
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";
import { useEffect } from "react";
import GoalCard from "../../components/goalCard/GoalCard";

const validate = values => {
    const errors = {};

    if (!values.goalName) {
        errors.goalName = 'Required';
    } else if (values.goalName.length > 50) {
        errors.goalName = 'Must be 50 characters or less';
    }

    if (!values.targetAmount) {
        errors.targetAmount = 'Required';
    } else if (values.targetAmount <= 0) {
        errors.targetAmount = 'Amount must be greater than 0';
    }

    if (values.currentProgress === '' || values.currentProgress === null) {
        errors.currentProgress = 'Required';
    } else if (values.currentProgress < 0) {
        errors.currentProgress = 'Cannot be negative';
    }

    if (!values.targetDate) {
        errors.targetDate = 'Required';
    }

    if (!values.priority) {
        errors.priority = 'Required';
    }

    return errors;
};

export default function SetGoal() {
    useEffect(()=>{
        window.scroll({
            top: '0',
            behavior: 'smooth'
        })
    },[])
    const navigate = useNavigate();
    const { requestWithAuth } = useAuth();
    const protectedData = JSON.parse(localStorage.getItem('protectedData'));

    const formik = useFormik({
        initialValues: {
            goalName: '',
            targetAmount: '',
            currentProgress: 0, 
            targetDate: '',
            priority: 'Medium', 
        },
        validate,
        onSubmit: async (values) => {
            try {
                const response = await requestWithAuth('/addgoal', {
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
                console.error("Add Goal failed:", error);
                alert("Add Goal failed");
            }
        },
    });

    return (
        <div>
            <div className="card-container">
                {protectedData.goal.map((point)=>(
                    <GoalCard
                        key={point._id}
                        Goal={point.goalName}
                        Target={point.targetAmount}
                        Date={new Date(point.targetDate).toLocaleDateString()}
                        Progress={Math.round((point.currentProgress / point.targetAmount) * 100)}
                        Priority={point.priority}
                    />
            ))}
            </div>
            <div className="box">
                <div className="login-title">Set Financial Goal</div>
                <form className="login-box" onSubmit={formik.handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="goalName" className="email-and-password">Goal Name:</label>
                        <input
                            id="goalName"
                            name="goalName"
                            className="email-bar"
                            type="text"
                            placeholder="Ex: Emergency Fund, Car Downpayment"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.goalName}
                        />
                        {formik.touched.goalName && formik.errors.goalName ? (
                            <div className="error">{formik.errors.goalName}</div>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label htmlFor="targetAmount" className="email-and-password">Target Amount:</label>
                        <input
                            id="targetAmount"
                            name="targetAmount"
                            className="email-bar"
                            type="number"
                            placeholder="Ex: 50000"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.targetAmount}
                        />
                        {formik.touched.targetAmount && formik.errors.targetAmount ? (
                            <div className="error">{formik.errors.targetAmount}</div>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label htmlFor="currentProgress" className="email-and-password">Current Saved:</label>
                        <input
                            id="currentProgress"
                            name="currentProgress"
                            className="email-bar"
                            type="number"
                            placeholder="Ex: 5000"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.currentProgress}
                        />
                        {formik.touched.currentProgress && formik.errors.currentProgress ? (
                            <div className="error">{formik.errors.currentProgress}</div>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label htmlFor="targetDate" className="email-and-password">Target Date:</label>
                        <input
                            id="targetDate"
                            name="targetDate"
                            className="email-bar"
                            type="date"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.targetDate}
                        />
                        {formik.touched.targetDate && formik.errors.targetDate ? (
                            <div className="error">{formik.errors.targetDate}</div>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label htmlFor="priority" className="email-and-password">Priority Level:</label>
                        <select
                            id="priority"
                            name="priority"
                            className="email-bar"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.priority}
                        >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        {formik.touched.priority && formik.errors.priority ? (
                            <div className="error">{formik.errors.priority}</div>
                        ) : null}
                    </div>

                    <button type="submit" className="sign-up">Set Goal</button>

                </form>
            </div>
        </div>
    );
}