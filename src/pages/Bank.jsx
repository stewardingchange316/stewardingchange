import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Bank() {
  const navigate = useNavigate();
  const [isFinishing, setIsFinishing] = useState(false);
  const abortRef = useRef(null);

  // Abort in-flight save when user switches apps — fixes iOS frozen "Saving..." state.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        abortRef.current?.abort();
        setIsFinishing(false);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);



  async function finishOnboarding(bankConnected) {
    setIsFinishing(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const safetyTimer = setTimeout(() => {
      controller.abort();
      setIsFinishing(false);
    }, 8000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (controller.signal.aborted) return;
      if (!user) {
        setIsFinishing(false);
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({ onboarding_step: "done", bank_connected: bankConnected })
        .eq("id", user.id)
        .select()
        .abortSignal(controller.signal);

      if (controller.signal.aborted) return;
      if (error) throw error;

      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (controller.signal.aborted || err.name === "AbortError") return;
      console.error("Failed to finish onboarding:", err);
      setIsFinishing(false);
    } finally {
      clearTimeout(safetyTimer);
      abortRef.current = null;
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
              disabled={isFinishing}
            >
              ← Back
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSkipForNow}
              disabled={isFinishing}
            >
              {isFinishing ? "Saving..." : "Skip for now →"}
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
              disabled={isFinishing}
            >
              {isFinishing ? "Saving..." : "Connect bank"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}