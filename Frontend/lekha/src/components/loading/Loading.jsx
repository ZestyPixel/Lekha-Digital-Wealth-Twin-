import "./Loading.css";
import { useEffect } from "react";

export default function Loading() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="page">
      <div className="rotate"></div>
      <div className="loading">Loading...</div>
    </div>
  );
}
