import { useState, useEffect } from "react";
import "./HamburgerMenu.css";
import { Link } from "react-router-dom";

function Hamburger({ isOpen }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    if (saved) {
      document.body.classList.add("dark-theme");
      setIsDark(true);
    }
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    document.body.classList.toggle("dark-theme", next);
    localStorage.setItem("darkMode", String(next));
    setIsDark(next);
  };

  return (
    <div className={`sidebar ${isOpen ? "active" : ""}`}>
      <div className="home">
        <Link to={"/homepage"}>
          <button className="home-button">
            <img className="home-icon" src="/images/home.svg" alt="home" />
            <div className="tooltip">Home</div>
          </button>
        </Link>
        <div className="goals">
          <Link to={"/goals"}>
            <button className="goals-button">
              <img
                className="goals-icon"
                src="/images/GoalsIcon - Copy.jpeg"
                alt="goals"
              />
              <div className="tooltip">Goals</div>
            </button>
          </Link>
        </div>
        <div className="dark-mode">
          <button className="dark-mode-button " onClick={toggleDark}>
            <img
              className="dark-icon"
              src="/images/dark-mode-6682.svg"
              alt="dark mode"
            />
            <div className="tooltip">{isDark ? "Light Mode" : "Dark Mode"}</div>
          </button>
        </div>
        <div className="debt-mode">
          <Link to={"/debt"}>
            <button className="debt-mode-button ">
              <i className="fa-solid fa-money-check-dollar"></i>
              <div className="tooltip">Debt</div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Hamburger;
