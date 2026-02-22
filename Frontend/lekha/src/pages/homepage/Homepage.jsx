import Card from "../../components/card/Card";
import "./Homepage.css";
import { Link } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";
import { useState, useEffect } from 'react';
import NetWorthCard from "../../components/homepageCards/netWorth/NetWorthCard"
import RecentTransactions from "../../components/homepageCards/recentTransactions/RecentTransactions";

export default function HomePage(){
  const { user, requestWithAuth } = useAuth();
  const [protectedData, setProtectedData] = useState(null);

  const fetchProtectedData = async () => {
    try {
      const response = await requestWithAuth('/getUserData');
      
      if (!response.ok) {
        throw new Error('Failed to fetch protected data');
      }
      
      const data = await response.json();
      setProtectedData(data);
    } catch (err) {
      console.error('Error fetching protected data:', err);
    } 
  };

useEffect(() => {
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
                  <h1>Welcome, {protectedData.data.name}</h1>
                  <p>{JSON.stringify(protectedData.transaction, null, 2)}</p>
                  </>
                ) : (
                <p>Loading user data...</p>
                )}
              </div>
            )}
            
            <div className="card-container">
              <Link to={'/newpage'} ><Card Title={"Total Expenses This Month"}/></Link>
              <Link to={'/networth'} state={protectedData?.asset} ><NetWorthCard Title={"Net Worth"} /></Link>
              <Link to={'/recenttransactions'}> <RecentTransactions Title={"Recent Transactions"} data={protectedData?.transaction} /> </Link>
              {/* Question mark is optional chaining, it checks if protectedData is not null before trying to access the transaction property. 
              If protectedData is null, it will return undefined instead of throwing an error. */}
              <Card Title={"Health Score"}/>
            </div>
            
            <div className="navigation-links">
            </div>
        </div>
    );
}