import { useNavigate } from "react-router-dom";

export default function Verified() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="brand-header">Stewarding Change</h2>

        <h1>Email Verified ✅</h1>

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
