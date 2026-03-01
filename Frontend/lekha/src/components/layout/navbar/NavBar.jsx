import { useAuth } from '../../../context/useAuth';
import './NavBar.css';
import { Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="header">
      <div className="left">
        <button className="hamburger-button" onClick={onToggleSidebar}>
          <img className="hamburger-icon" src="/images/dehaze_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" alt="menu" />
          <div className="tooltip">Menu</div>
        </button>
      </div>
      <div className="middle">
        <p className="title">Lekha</p>
      </div>
      <div className="right">
        <Link to={'/profile'}>
        <button className="profile-button">
          <img className="profile-icon" src="/images/Fa-Team-Fontawesome-FontAwesome-Circle-User.svg" alt="profile" />
          <div className="tooltip">Profile</div>
        </button>
        </Link>
        <button className="log" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}