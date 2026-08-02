import "./Footer.css";
import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation("translation", {
    keyPrefix: "dashboard.footer",
  });

  return (
    <div className="main-footer">
      <div className="footer">
        <div className="Useful-links">
          <div className="usfl-links">
            <p>{t("usefulLinks")}</p>
          </div>
          <div className="links">
            <p>{t("about")}</p>
            <p>{t("services")}</p>
            <p>{t("contact")}</p>
            <p>{t("blog")}</p>
          </div>
        </div>
        <div className="contact">
          <div className="contacts">
            <p>{t("contactUs")}</p>
          </div>
          <div className="address">
            <p>{t("address")}</p>
          </div>
        </div>
        <div className="policy">
          <div className="Policy">
            <p>{t("policy")}</p>
          </div>
          <div className="policies">
            <p>{t("cookiePolicy")}</p>
            <p>{t("returnPolicy")}</p>
            <p>{t("securityPolicy")}</p>
          </div>
        </div>
      </div>
      <hr className="divider" />
      <div className="social-media">
        <button className="facebook">
          <img
            className="facebook-icon"
            src="images/facebook-circular-logo.png"
          />
        </button>
        <button className="x">
          <img className="x-icon" src="images/32px-X_icon.svg.png" />
        </button>
        <button className="youtube">
          <img className="youtube-icon" src="images/youtube.png" />
        </button>
      </div>
      <p className="copyright">{t("copyright")}</p>
    </div>
  );
}

export default Footer;
