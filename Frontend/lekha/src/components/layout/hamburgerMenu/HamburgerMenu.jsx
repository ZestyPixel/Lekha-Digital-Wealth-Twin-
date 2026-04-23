import './HamburgerMenu.css'
import { Link } from 'react-router-dom';

function Hamburger({ isOpen }) {
  const toggleDark = () => {
    document.body.classList.toggle("dark-theme");
  }

  return (
    <div className={`sidebar ${isOpen ? 'active' : ''}`}>
      <div className="home">
        <Link to={'/homepage'}>
        <button className="home-button">
          <img className="home-icon" src="/images/home.svg" alt="home" />
          <div className="tooltip">Home</div>
        </button>
        </Link>
        <div className="goals">
          <Link to={'/goals'}>
          <button className="goals-button">
            <img className="goals-icon" src="/images/GoalsIcon - Copy.jpeg" alt="goals" />
            <div className="tooltip">Goals</div>
          </button>
          </Link>
        </div>
        <div className="dark-mode">
          <button className="dark-mode-button " onClick={toggleDark}>
            <img className="dark-icon" src="/images/dark-mode-6682.svg" alt="dark mode" />
            <div className="tooltip">Dark Mode</div>
          </button>
        </div>
        <div className="debt-mode">
          <Link to={'/debt'}>
          <button className="debt-mode-button ">
            <i className="fa-solid fa-money-check-dollar"></i>
            <div className="tooltip">
              Debt
              </div>
          </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Hamburger