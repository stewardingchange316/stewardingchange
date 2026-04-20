import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PlaidLinkButton from "../components/PlaidLink";

export default function ConnectCard() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const [advancing, setAdvancing] = useState(false);

  async function goToBank() {
    if (advancing) return;
    setAdvancing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("users")
        .update({ onboarding_step: "bank" })
        .eq("id", user.id);

      navigate("/connect-bank", { replace: true });
    } catch (err) {
      console.error("Error advancing onboarding:", err);
      navigate("/connect-bank", { replace: true });
    }
  }

  function handleSuccess({ metadata }) {
    const account = metadata?.accounts?.[0];
    const institution = metadata?.institution;
    setAccountName(
      [institution?.name, account?.name].filter(Boolean).join(" — ") || "Card connected"
    );
    setConnected(true);
  }

  return (
    <div className="onboarding-page">
      <div className="progress-indicator">
        <div className="progress-dot" />
        <div className="progress-dot is-active" />
        <div className="progress-dot" />
        <div className="progress-dot" />
      </div>

      <h1>Connect your card</h1>
      <p className="onboarding-subtext">
        Link the debit or credit card you use every day. We'll track your
        purchases and round up the spare change — those extra cents go straight
        to your church's mission.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      {!connected ? (
        <div className="stack-4" style={{ textAlign: "center" }}>
          <PlaidLinkButton
            onSuccess={handleSuccess}
            buttonText="Connect My Card"
          />

          <button
            className="link-button"
            onClick={goToBank}
            style={{ marginTop: "var(--s-4)" }}
          >
            Skip for now
          </button>

          <p className="small muted" style={{ maxWidth: "44ch", margin: "0 auto" }}>
            You can connect multiple cards later from your dashboard.
            We never store your login credentials — connections are handled
            securely through Plaid.
          </p>
        </div>
      ) : (
        <div className="stack-5" style={{ textAlign: "center" }}>
          <div className="card stack-3" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px" }}>✅</div>
            <h3 style={{ margin: 0 }}>{accountName}</h3>
            <p className="muted" style={{ margin: 0 }}>
              Connected! We'll track your purchases for round-ups.
            </p>
          </div>

          <PlaidLinkButton
            onSuccess={handleSuccess}
            buttonText="+ Connect another card"
            buttonClass="btn btn-secondary btn-sm"
          />

          <button
            className="btn btn-primary btn-lg btn-wide"
            onClick={goToBank}
            disabled={advancing}
          >
            {advancing ? "Continuing..." : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
