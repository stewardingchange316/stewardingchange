import { useNavigate } from "react-router-dom";
import { auth } from "../utils/auth";

export default function Bank() {
  const navigate = useNavigate();
  const ob = auth.getOnboarding();

  function finish() {
    auth.setOnboarding({ ...ob, step: 5, bankConnected: true });
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="container narrow">
      <div className="stepHead">
        <span className="pill">Step 3 of 3</span>
        <h1 className="stepTitle">Add your banking info</h1>
        <p className="muted">
          Placeholder for secure bank connection (Plaid/Stripe) later. For now, we’ll complete onboarding.
        </p>
      </div>

      <div className="panel">
        <div className="bankMock">
          <div className="bankIcon" />
          <div>
            <div className="cardTitle">Secure connection (coming soon)</div>
            <div className="muted">
              You’ll connect once, and we’ll handle weekly giving within your cap.
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="btn ghost" onClick={() => navigate("/onboarding/cap")}>
            Back
          </button>
          <button className="btn primary" onClick={finish}>
            Finish & go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
