import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PlaidLinkButton from "../components/PlaidLink";

export default function ConnectSpending() {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [accountName, setAccountName] = useState("");

  async function finishOnboarding() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("users")
        .update({ onboarding_step: "done" })
        .eq("id", user.id);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Error finishing onboarding:", err);
      navigate("/dashboard", { replace: true });
    }
  }

  function handleSuccess({ metadata }) {
    const account = metadata?.accounts?.[0];
    const institution = metadata?.institution;
    setAccountName(
      [institution?.name, account?.name].filter(Boolean).join(" — ") || "Account connected"
    );
    setConnected(true);
  }

  return (
    <div className="onboarding-page">
      <div className="progress-indicator">
        <div className="progress-dot" />
        <div className="progress-dot" />
        <div className="progress-dot is-active" />
      </div>

      <h1>Connect your spending</h1>
      <p className="onboarding-subtext">
        Link the accounts you spend with — debit cards, credit cards, or checking
        accounts. We'll track your purchases and round up each one to the nearest
        dollar. Your spare change goes straight to your church.
      </p>

      {!connected ? (
        <div className="stack-4" style={{ textAlign: "center" }}>
          <PlaidLinkButton
            onSuccess={handleSuccess}
            buttonText="Connect a Spending Account"
          />

          <button
            className="link-button"
            onClick={finishOnboarding}
            style={{ marginTop: "var(--s-4)" }}
          >
            Skip for now
          </button>

          <p className="small muted" style={{ maxWidth: "44ch", margin: "0 auto" }}>
            You can always connect accounts later from your dashboard.
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
              Connected successfully. We'll start tracking your round-ups.
            </p>
          </div>

          <button
            className="btn btn-primary btn-lg btn-wide"
            onClick={finishOnboarding}
          >
            Go to Dashboard
          </button>

          <PlaidLinkButton
            onSuccess={handleSuccess}
            buttonText="+ Connect another account"
            buttonClass="btn btn-secondary btn-sm"
          />
        </div>
      )}
    </div>
  );
}
