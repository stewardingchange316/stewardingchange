import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Bank() {
  const navigate = useNavigate();

  // Make sure we're on the right step (and that onboarding exists)
  useEffect(() => {
    const raw = localStorage.getItem("sc_onboarding");
    if (!raw) {
      navigate("/church-select", { replace: true });
      return;
    }

    let ob;
    try {
      ob = JSON.parse(raw);
    } catch {
      localStorage.removeItem("sc_onboarding");
      navigate("/church-select", { replace: true });
      return;
    }

    // If someone hits /bank too early (or state got weird), send them to the correct step
    const step = ob?.step;
    const stepRouteMap = {
      church: "/church-select",
      cap: "/giving-cap",
      bank: "/bank",
      done: "/dashboard",
    };

    const target = stepRouteMap[step] || "/church-select";
    if (target !== "/bank") {
      navigate(target, { replace: true });
    }
  }, [navigate]);

  function finishSetup({ bankConnected }) {
    const raw = localStorage.getItem("sc_onboarding");
    if (!raw) {
      navigate("/church-select", { replace: true });
      return;
    }

    let ob;
    try {
      ob = JSON.parse(raw);
    } catch {
      localStorage.removeItem("sc_onboarding");
      navigate("/church-select", { replace: true });
      return;
    }

    const updated = {
      ...ob,
      step: "done",
      bankConnected: !!bankConnected,
    };

    localStorage.setItem("sc_onboarding", JSON.stringify(updated));
    navigate("/dashboard", { replace: true });
  }

  function handleSkipForNow() {
    finishSetup({ bankConnected: false });
  }

  function handleConnectBank() {
    // Placeholder until Plaid is wired:
    // For now we just mark connected = true and continue.
    finishSetup({ bankConnected: true });
  }

  return (
    <div className="page">
      <span className="step-pill">Step 3 of 3</span>

      <h1>Connect your bank</h1>
      <p className="subtext">
        Stewarding Change uses bank-level encryption to securely change
        donations. You’ll always stay in control.
      </p>

      <div className="card">
        <h3>Bank connection coming soon</h3>
        <p className="muted">
          For this pilot, you can continue without linking a bank. When
          connections go live, you’ll be able to add one here.
        </p>
      </div>

      <div className="footer-row">
        <div className="footer-text">
          You can add a bank at any time from your dashboard.
        </div>

        <div className="footer-actions">
          <button className="btn-secondary" onClick={handleSkipForNow}>
            Skip for now
          </button>

          <button className="btn-primary" onClick={handleConnectBank}>
            Connect bank
          </button>
        </div>
      </div>
    </div>
  );
}