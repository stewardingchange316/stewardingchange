import { useNavigate } from "react-router-dom";
import { IconCheckCircle } from "../components/Icons";

export default function Verified() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="brand-header">Stewarding Change</h2>

        <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          Email Verified <span style={{ color: "var(--color-success)" }}><IconCheckCircle size={28} /></span>
        </h1>

        <p className="auth-subtitle">
          Your account has been successfully confirmed.
          <br /><br />
          You're ready to complete your setup and begin rounding up your everyday purchases.
        </p>

        <button
          className="btn btn-primary btn-wide"
          style={{ marginTop: "var(--s-5)" }}
          onClick={() => navigate("/church-select")}
        >
          Start Setup
        </button>
      </div>
    </div>
  );
}
