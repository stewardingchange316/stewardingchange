import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Bank() {
  const navigate = useNavigate();
  const [isFinishing, setIsFinishing] = useState(false); // ✅ Added

  useEffect(() => {
    async function validateStep() {
      if (isFinishing) return; // ✅ Prevent redirect race

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("onboarding_step")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) {
        navigate("/church-select", { replace: true });
        return;
      }

      if (
        data.onboarding_step !== "bank" &&
        data.onboarding_step !== "done"
      ) {
        navigate("/dashboard", { replace: true });
      }
    }

    validateStep();
  }, [navigate, isFinishing]); // ✅ Added dependency

  async function finishOnboarding(bankConnected) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsFinishing(true); // ✅ lock redirects

    const { error } = await supabase
      .from("users")
      .update({
        onboarding_step: "done",
        bank_connected: bankConnected
      })
      .eq("id", user.id)
      .select() // ✅ Force DB commit to return updated row

    if (!error) {
      navigate("/dashboard", { replace: true });
    } else {
      console.error("Failed to finish onboarding:", error);
      setIsFinishing(false);
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
