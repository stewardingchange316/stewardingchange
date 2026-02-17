import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ChurchSelect() {
  const navigate = useNavigate();

  const churches = useMemo(
    () => [
      {
        id: "countryside",
        name: "Countryside Christian Church",
        mission: "Helping Hands Foundation",
        goal: "120 families",
        cadence: "Weekly",
      },
      {
        id: "grace",
        name: "Grace Community Church",
        mission: "Local Food Relief",
        goal: "90 families",
        cadence: "Weekly",
      },
    ],
    []
  );

  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Load existing selection
  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("church_id")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.church_id) {
        setSelected(data.church_id);
      }

      setLoading(false);
    }

    loadUserData();
  }, [navigate]);

  async function continueNext() {
    if (!selected) return;

    setError("");
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({
          church_id: selected,
          onboarding_step: "cap",
        })
        .eq("id", user.id)
        .select();

      if (updateError) throw updateError;

      if (!updateData || updateData.length === 0) {
        throw new Error("Update affected 0 rows");
      }

      navigate("/giving-cap");

    } catch (err) {
      console.error("Error saving church:", err);
      setError("Unable to save your selection. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="onboarding-page">
        <div className="center" style={{ minHeight: "60vh" }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-step">Step 1 of 3</div>

      <h1>Select your church</h1>
      <p className="onboarding-subtext">
        This sets your dashboard context. You can add more churches later.
      </p>

      {error && (
        <div className="alert alert-danger mb-4">
          {error}
        </div>
      )}

      <div className="church-list">
        {churches.map((church) => {
          const isSelected = selected === church.id;

          return (
            <div
              key={church.id}
              className={`church-card ${isSelected ? "selected" : ""}`}
              onClick={() => setSelected(church.id)}
            >
              <div className="church-card-header">
                <h3>{church.name}</h3>
                {isSelected && <span className="checkmark">✓</span>}
              </div>

              <p className="church-mission">{church.mission}</p>

              <div className="church-meta">
                <div>
                  <span className="label">Monthly goal</span>
                  <strong>{church.goal}</strong>
                </div>
                <div>
                  <span className="label">Updates</span>
                  <strong>{church.cadence}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-next">
          <div>
            <strong>Next:</strong> set your weekly giving cap
            <div className="muted">
              You stay in control. This can be changed anytime.
            </div>
          </div>

          <button
            className="primary"
            disabled={!selected || saving}
            onClick={continueNext}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
