import Card from "../components/card/Card";
import "./Homepage.css";
import { Link } from 'react-router-dom';
import { useAuth } from "../context/useAuth";
import { useState, useEffect, useRef } from 'react';

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
      console.log(data);
      setProtectedData(data);
    } catch (err) {
      console.error('Error fetching protected data:', err);
    } 
  };

const hasFetched = useRef(false);

useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchProtectedData();
    }
    
    if (!user) {
      hasFetched.current = false;
      setProtectedData(null);
    }
  }, [user?.userId]); // Only care about userId changes (actual login/logout)
    return(
        <div className="homepage-container">
            <h1>Welcome to Homepage!</h1>
            <p>You successfully logged in and navigated here.</p>
            
            {user && (
              <div className="user-info-section">
                <h2>User Information</h2>
                {protectedData ? (
                  <>
                  <p><strong>Email:</strong> {protectedData.email}</p>
                  <p><strong>Name:</strong> {protectedData.name || 'Not provided'}</p>
                  </>
                ) : (
                <p>Loading user data...</p>
                )}
              </div>
)}
            
            {/* <h1><b>Full DATA: {JSON.stringify(protectedData, null, 2)}</b></h1> */}
            
            <div className="card-container">
                <Card Title={"Total Expenses This Month"}/>
                <Card Title={"Recent Transaction"}/>
                <Card Title={"Health Score"}/>
                <Card/>
                <Card/>
                <Card/>
            </div>
            
            <div className="navigation-links">
                <Link to={'/newpage'} className="nav-link">Go to new page</Link>
                <Link to={'/profile'} className="nav-link">View Profile</Link>
            </div>
        </div>
    );
}