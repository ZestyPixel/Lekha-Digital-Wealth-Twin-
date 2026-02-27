import Card from "../../components/card/Card";
import "./Homepage.css";
import { Link } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";
import { useState, useEffect } from 'react';
import NetWorthCard from "../../components/homepageCards/netWorth/NetWorthCard"
import LastTransaction from "../../components/homepageCards/recentTransactions/LastTransaction";
import PieChartCard from "../../components/homepageCards/piechart/PieChartCard";
import MonthlyExpensesCard from "../../components/homepageCards/monthExpenses/MonthlyExpenses";

export default function HomePage(){
  const { user, requestWithAuth } = useAuth();
  const [protectedData, setProtectedData] = useState({data: {name: ''}, asset: [], transaction: null});
  
  useEffect(() => {
  const fetchProtectedData = async () => {
    try {
      const response = await requestWithAuth('/getUserData');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProtectedData(data);
    } catch (err) {
      console.error('Error fetching protected data:', err);
    }
  };

  if (user) {
    fetchProtectedData();
  } else {
    setProtectedData(null);
  }
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
              <Link to={'/monthlyexpenses'} state={protectedData?.asset ?? []}><MonthlyExpensesCard Data={protectedData?.transaction}/></Link>
              <Link to={'/networth'} state={protectedData?.asset ?? []}><NetWorthCard Title={"Net Worth"} Data={protectedData?.asset} /></Link> 
              <PieChartCard Data={protectedData?.asset} />
              <Link to={'/lastttransaction'}> <LastTransaction Title={"Last Transaction"} data={protectedData?.transaction?.[0]} /> </Link>
              {/* Question mark is optional chaining, it checks if protectedData is not null before trying to access the transaction property. 
              If protectedData is null, it will return undefined instead of throwing an error. */}
              <Card Title={"Health Score"}/>
              <Card Title={"Goals"}/>
            </div>
            
            <div className="navigation-links">
            </div>
        </div>
    );
}