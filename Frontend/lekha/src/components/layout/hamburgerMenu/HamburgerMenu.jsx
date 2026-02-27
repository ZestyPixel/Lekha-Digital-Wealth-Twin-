import './HamburgerMenu.css'

function Hamburger({ isOpen }) {
  const toggleDark = () => {
    document.body.classList.toggle("dark-theme");
  }

  return (
    <div className={`sidebar ${isOpen ? 'active' : ''}`}>
      <div className="home">
        <button className="home-button">
          <img className="home-icon" src="/images/home.svg" alt="home" />
          <div className="tooltip">Home</div>
        </button>
        <div className="goals">
          <button className="goals-button">
            <img className="goals-icon" src="/images/GoalsIcon - Copy.jpeg" alt="goals" />
            <div className="tooltip">Goals</div>
          </button>
        </div>
        <div className="dark-mode">
          <button className="dark-mode-button" onClick={toggleDark}>
            <img className="dark-icon" src="/images/dark-mode-6682.svg" alt="dark mode" />
            <div className="tooltip">Dark Mode</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Hamburger