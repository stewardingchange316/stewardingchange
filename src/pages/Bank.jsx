import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Bank() {
  const navigate = useNavigate();

  async function finishOnboarding(bankConnected) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ onboarding_step: "done", bank_connected: bankConnected })
      .eq("id", user.id)
      .select();

    if (!error) {
      navigate("/dashboard", { replace: true });
    } else {
      console.error("Failed to finish onboarding:", error);
    }
  }

  async function handleSkipForNow() {
    await finishOnboarding(false);
  }

  async function handleConnectBank() {
    await finishOnboarding(true);
  }

  return (
    <div className="page">
      <div className="container-narrow">

        <div className="kicker mb-6">
          <span className="dot" />
          Step 3 of 3
        </div>

        <h1 className="page-title">
          Connect your bank
        </h1>

        <p className="page-subtitle">
          Stewarding Change uses bank-level encryption to securely manage
          donations. You remain fully in control at all times.
        </p>

        <div className="glass card stack-6 mt-8">

          {/* Top nav — Back and Skip */}
          <div className="cap-nav">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate("/giving-cap", { replace: true })}
            >
              ← Back
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSkipForNow}
            >
              Skip for now →
            </button>
          </div>

          <div>
            <h3 className="mb-2">Bank connection coming soon</h3>
            <p className="muted">
              For this pilot, you can continue without linking a bank.
              When connections go live, you'll be able to securely add one here.
            </p>
          </div>

          <div className="divider" />

          <div className="row-between">
            <span className="muted">
              You can add a bank at any time from your dashboard.
            </span>

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
  );
}