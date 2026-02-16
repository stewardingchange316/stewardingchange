import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Bank() {
  const navigate = useNavigate();

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

    const step = ob?.step;

    if (step !== "bank" && step !== "done") {
      const stepRouteMap = {
        church: "/church-select",
        cap: "/giving-cap",
      };

      const target = stepRouteMap[step] || "/church-select";
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
    finishSetup({ bankConnected: true });
  }

  return (
    <div className="page">
      <div className="container-narrow">

        {/* Step indicator */}
        <div className="kicker mb-6">
          <span className="dot" />
          Step 3 of 3
        </div>

        {/* Title */}
        <h1 className="page-title">
          Connect your bank
        </h1>

        <p className="page-subtitle">
          Stewarding Change uses bank-level encryption to securely manage
          donations. You remain fully in control at all times.
        </p>

        {/* Glass Card */}
        <div className="glass card stack-6 mt-8">

          <div>
            <h3 className="mb-2">Bank connection coming soon</h3>
            <p className="muted">
              For this pilot, you can continue without linking a bank.
              When connections go live, you’ll be able to securely add one here.
            </p>
          </div>

          <div className="divider" />

          <div className="row-between">
            <span className="muted">
              You can add a bank at any time from your dashboard.
            </span>

            <div className="row">
              <button
                className="btn btn-secondary"
                onClick={handleSkipForNow}
              >
                Skip for now
              </button>

              <button
                className="btn btn-primary"
                onClick={handleConnectBank}
              >
                Connect bank
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
