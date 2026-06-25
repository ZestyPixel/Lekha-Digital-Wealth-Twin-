import Card from "../../components/card/Card";
import "./Homepage.css";
import { Link } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";
import { useState, useEffect } from 'react';
import LastTransaction from "../../components/homepageCards/recentTransactions/LastTransaction";
import PieChartCard from "../../components/homepageCards/piechart/PieChartCard";
import MonthlyExpensesCard from "../../components/homepageCards/monthExpenses/MonthlyExpenses";
import BudgetCard from "../../components/homepageCards/budgetCard/BudgetCard";
import WealthCard from "../../components/homepageCards/wealth/WealthCard";
import HealthScore from "../../components/homepageCards/healthScore/HealthScore";

export default function HomePage(){
  const { user, requestWithAuth } = useAuth();
  const [protectedData, setProtectedData] = useState({data: {name: ''}, asset: [], transaction: null});
  const [advice, setAdvice] = useState('');
  const [score, setScore] = useState('');
  
  useEffect(() => { //To get all the required data for the homepage.
  const fetchProtectedData = async () => {
    try {
      const response = await requestWithAuth('/getUserData');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProtectedData(data);
      localStorage.setItem('protectedData', JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching protected data:', err);
    }};
  if (user) {
    fetchProtectedData();
  } else {
    setProtectedData(null);
  }
}, [user]);

// Wealth card advice — fetches once per browser session
useEffect(() => {
    const storedAdvice = sessionStorage.getItem("advice");
    if (storedAdvice && storedAdvice !== "undefined") {
        setAdvice(storedAdvice);
        return;
    }

    const fetchAdvice = async () => {
        try {
            const res = await requestWithAuth('/advice');
            const data = await res.json();
            if (data) {
                setAdvice(data);
                sessionStorage.setItem("advice", data);
            }
        } catch (error) {
            console.error("Failed to fetch advice:", error);
        }
    };

    fetchAdvice();
}, [user]);

// Health score — fetches once per browser session
useEffect(() => {
    const storedScore = sessionStorage.getItem("score");
    if (storedScore) {
        try {
            setScore(JSON.parse(storedScore));
            return;
        } catch {
            sessionStorage.removeItem("score"); // evict corrupted entry
        }
    }

    const fetchScore = async () => {
        try {
            const res = await requestWithAuth('/getFinancialScore');
            const data = await res.json();
            setScore(data);
            sessionStorage.setItem("score", JSON.stringify(data));
        } catch (error) {
            console.error("Failed to fetch score:", error);
        }
    };

    fetchScore();
}, [user]);

useEffect(()=>{
  window.scroll({
    top: '0',
    behavior: 'smooth'
  })
},[])

    return(
        <div >
            <div className="card-container">
              <Link to={'/score'} ><HealthScore Title={"Financial Health Score"} score={score}/></Link>
              <Link to={'/networth'} state={protectedData?.asset ?? []}><PieChartCard Data={protectedData?.asset} /></Link>
              <Link to={'/wealth'} ><WealthCard Title={"Manage Wealth"} Advice={advice}/></Link>
              <Link to={'/recenttransactions'} state={protectedData?.transaction ?? []}> <LastTransaction Title={"Last Transaction"} data={protectedData?.transaction?.[protectedData.transaction.length-1]} /> </Link> {/* To access the last element */}
              {/* Question mark is optional chaining, it checks if protectedData is not null before trying to access the transaction property. 
              If protectedData is null, it will return undefined instead of throwing an error. */}
              <Link to={'/monthlyexpenses'} ><MonthlyExpensesCard Data={protectedData?.transaction}/></Link>
              <BudgetCard DataP={protectedData?.profile} DataT={protectedData?.transaction}/>
            </div>
            
            <div className="navigation-links">
            </div>
        </div>
    );
}