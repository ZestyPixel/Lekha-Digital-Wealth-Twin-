import Card from "../components/card/Card";
import "./Homepage.css";
export default function HomePage(){
    return(
        <div>
            <h1>Welcome to Homepage!</h1>
            <p>You successfully logged in and navigated here.</p>
            <div className="card-container">
                <Card Title={"Total Expenses This Month"}/>
                <Card Title={"Recent Transaction"}/>
                <Card Title={"Health Score"}/>
                <Card/>
                <Card/>
                <Card/>
            </div>
        </div>
    );
}