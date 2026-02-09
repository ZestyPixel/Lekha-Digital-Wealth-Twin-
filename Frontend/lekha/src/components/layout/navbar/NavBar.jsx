import { useAuth } from '../../../context/useAuth';
import './NavBar.css';

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
        </button>
      </div>
      <div className="middle">
        <p className="title">Lekha</p>
      </div>
      <div className="right">
        <button className="profile-button">
          <img className="profile-icon" src="/images/Fa-Team-Fontawesome-FontAwesome-Circle-User.svg" alt="profile" />
        </button>
        <button className="log" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}