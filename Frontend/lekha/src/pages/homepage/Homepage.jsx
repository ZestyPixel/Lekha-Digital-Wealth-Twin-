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

export default function HomePage(){
  const { user, requestWithAuth } = useAuth();
  const [protectedData, setProtectedData] = useState({data: {name: ''}, asset: [], transaction: null});
  const [advice, setAdvice] = useState('');
  
  useEffect(() => {
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

useEffect(() => {
    const storedAdvice = localStorage.getItem("advice");

    if (storedAdvice && storedAdvice !== "undefined") {
        setAdvice(storedAdvice);
        return;
    }

    const fetchAdvice = async () => {
        const res = await requestWithAuth('/advice');
        const data = await res.json();

        if (data) {
            setAdvice(data);
            localStorage.setItem("advice", data);
        }
    };

    fetchAdvice();
}, [user]);
 
    return(
        <div className="homepage-container">
            {user && (
              <div className="user-info-section">
                {protectedData ? (
                  <>
                  <h1 className="text-6xl">Welcome, {protectedData.data.name}</h1> <br /><br />
                  </>
                ) : (
                <p>Loading user data...</p>
                )}
              </div>
            )}
            
            <div className="card-container">
              <Card Title={"Health Score"}/>
              <Link to={'/networth'} state={protectedData?.asset ?? []}><PieChartCard Data={protectedData?.asset} /></Link>
              <Link to={'/wealth'} ><WealthCard Title={"Manage Wealth"} Advice={advice}/></Link>
              <Link to={'/lastttransaction'}> <LastTransaction Title={"Last Transaction"} data={protectedData?.transaction?.[protectedData.transaction.length-1]} /> </Link>
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