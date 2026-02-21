import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PRESETS = [10, 25, 50];

export default function GivingCap() {
  const navigate = useNavigate();
  const [weeklyCap, setWeeklyCap] = useState(25);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset saving state if user leaves mid-save and comes back
  useEffect(() => {
    return () => {
      setSaving(false);
    };
  }, []);

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          navigate("/", { replace: true });
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("weekly_cap")
          .eq("id", authUser.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError);
        } else if (profile?.weekly_cap !== null && profile?.weekly_cap !== undefined) {
          setWeeklyCap(profile.weekly_cap);
        }
      } catch (err) {
        console.error("Error in loadUserData:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [navigate]);

  function setNoLimit() {
    setWeeklyCap(null);
  }

  async function handleContinue() {
    setError("");
  
    setSaving(true);
    const saveTimeout = setTimeout(() => setSaving(false), 8000);

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        throw new Error("Not authenticated");
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          weekly_cap: weeklyCap,
          onboarding_step: "bank",
        })
        .eq("id", authUser.id);

      if (updateError) {
        throw updateError;
      }

      const { data: { user: freshUser } } = await supabase.auth.getUser();
      const { data: freshProfile } = await supabase
        .from("users")
        .select("onboarding_step")
        .eq("id", freshUser.id)
        .single();
        clearTimeout(saveTimeout);
      if (freshProfile?.onboarding_step === "done") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/bank", { replace: true });
      }

    

     } catch (err) {
      console.error("Error saving weekly cap:", err);
      clearTimeout(saveTimeout);
      setError("Unable to save your selection. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container-narrow center" style={{ minHeight: "60vh" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container-narrow stack-8">

        <div className="kicker">
          <span className="dot" />
          Step 2 of 3
        </div>

        <div className="stack-3">
          <h1 className="page-title">
            Set your weekly giving cap
          </h1>
          <p className="page-subtitle">
            Choose the maximum amount you'd like your spare change to
            support your church each week. You remain in control at all times.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <div className="glass card stack-6">

          {/* Back and Continue at top of card */}
          <div className="cap-nav">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate("/church-select", { replace: true })}
            >
              ← Back
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleContinue}
              disabled={saving}
            >
              {saving ? "Saving..." : "Continue →"}
            </button>
          </div>

          <div className="text-center">
            {weeklyCap === null ? (
              <div className="h2">No limit</div>
            ) : (
              <div className="h2">
                ${weeklyCap}
                <span className="muted small"> / week</span>
              </div>
            )}
          </div>

          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={weeklyCap ?? 50}
            disabled={weeklyCap === null}
            onChange={(e) => setWeeklyCap(Number(e.target.value))}
            className="sc-giving-slider"
          />

          {/* Preset buttons in a row */}
          <div className="cap-presets">
            {PRESETS.map((amount) => (
              <button
                key={amount}
                className={`btn btn-secondary btn-sm ${weeklyCap === amount ? "btn-primary" : ""}`}
                onClick={() => setWeeklyCap(amount)}
              >
                ${amount}
              </button>
            ))}
            <button
              className={`btn btn-secondary btn-sm ${weeklyCap === null ? "btn-primary" : ""}`}
              onClick={setNoLimit}
            >
              No limit
            </button>
          </div>

        </div>

        <div className="glass card-tight stack-3">
          <strong>100% Tax-Deductible Donations</strong>
          <div className="small">
            Every cent given through Stewarding Change is a tax-deductible
            contribution to your selected church. Detailed giving statements
            are delivered weekly, with a consolidated annual statement
            provided at year end.
          </div>
        </div>

      </div>
    </div>
  );
}