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

  // Load existing weekly cap from Supabase
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
        } else if (profile?.weekly_cap) {
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

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error("Not authenticated");
      }

      console.log("Saving weekly cap:", weeklyCap); // DEBUG

      // Save to Supabase
      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({
          weekly_cap: weeklyCap,
          onboarding_step: "bank",
        })
        .eq("id", authUser.id)
        .select();

      console.log("Update response:", { data: updateData, error: updateError }); // DEBUG

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      if (!updateData || updateData.length === 0) {
        throw new Error("Update affected 0 rows");
      }

      console.log("Update successful, navigating..."); // DEBUG

      // Navigate to next step
      navigate("/bank");
      
    } catch (err) {
      console.error("Error saving weekly cap:", err);
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

        {/* Step Indicator */}
        <div className="kicker">
          <span className="dot" />
          Step 2 of 3
        </div>

        {/* Headline */}
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

        {/* Cap Card */}
        <div className="glass card stack-6">

          {/* Big Value Display */}
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

          {/* Slider */}
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

          {/* Presets */}
          <div className="row center">
            {PRESETS.map((amount) => (
              <button
                key={amount}
                className={`btn btn-secondary btn-sm ${
                  weeklyCap === amount ? "btn-primary" : ""
                }`}
                onClick={() => setWeeklyCap(amount)}
              >
                ${amount}
              </button>
            ))}

            <button
              className={`btn btn-secondary btn-sm ${
                weeklyCap === null ? "btn-primary" : ""
              }`}
              onClick={setNoLimit}
            >
              No limit
            </button>
          </div>
        </div>

        {/* Tax Deductible Trust Block */}
        <div className="glass card-tight stack-3">
          <strong>100% Tax-Deductible Donations</strong>
          <div className="small">
            Every cent given through Stewarding Change is a tax-deductible
            contribution to your selected church. Detailed giving statements
            are delivered weekly, with a consolidated annual statement
            provided at year end.
          </div>
        </div>

        {/* Continue Section */}
        <div className="row-between mt-6">
          <div className="muted small">
            Next: Securely connect your bank account
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleContinue}
            disabled={saving}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>

      </div>
    </div>
  );
}