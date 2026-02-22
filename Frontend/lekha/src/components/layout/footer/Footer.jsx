import './Footer.css'

function Footer() {
  return (
  <div className="main-footer">
    <div className="footer">
      <div className="Useful-links">
        <div className="usfl-links">
          <p>Useful Links</p>
        </div>
        <div className="links">
          <p>About</p>
          <p>Services</p>
          <p>Contact</p>
          <p>Blog</p>
        </div>
      </div>
      <div className="contact">
        <div className="contacts">
          <p>Contact Us</p>
        </div>
        <div className="address">
          <p>221B Baker Street, London, NW1</p>
        </div>
      </div>
      <div className="policy">
        <div className="Policy">
          <p>Policy</p>
        </div>
        <div className="policies">
          <p>Cookie Policy</p>
          <p>Return Policy</p>
          <p>Security Policy</p>
        </div>
      </div>
    </div>
    <hr className="divider" />
    <div className="social-media">
      <button className="facebook">
        <img className="facebook-icon" src="images/facebook-circular-logo.png" />
      </button>
      <button className="x">
        <img className="x-icon" src="images/32px-X_icon.svg.png" />
      </button>
      <button className="youtube">
        <img className="youtube-icon" src="images/youtube.png" />
      </button>
    </div>
    <p className="copyright">&#169;Copyright All rights reserved</p>
  </div>
  );
}

export default Footer