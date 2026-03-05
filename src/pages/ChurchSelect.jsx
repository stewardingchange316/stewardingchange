import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ChurchSelect() {
  const navigate = useNavigate();

  const [churches, setChurches] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data: existing } = await supabase
        .from("users")
        .select("church_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("users").upsert(
          {
            id: user.id,
            email: user.email,
            onboarding_step: "church",
            church_id: null,
            weekly_cap: null,
            bank_connected: false,
          },
          { onConflict: "id" }
        );
      } else if (existing?.church_id) {
        setSelected(existing.church_id);
      }

      const { data: churchList } = await supabase
        .from("churches")
        .select("id, name, mission_label, mission_goal, giving_cadence")
        .eq("active", true)
        .order("name");
      setChurches(churchList ?? []);

      setLoading(false);
    }

    init();
  }, [navigate]);

  async function continueNext() {
    if (!selected) return;

    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error, data } = await supabase
        .from("users")
        .update({ church_id: selected, onboarding_step: "cap", church_joined_at: new Date().toISOString() })
        .eq("id", user.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update did not persist");

      navigate("/giving-cap", { replace: true });
    } catch (err) {
      console.error("Church save error:", err);
      setError("Unable to save your selection. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="onboarding-page">
        <div className="center" style={{ minHeight: "60vh" }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="progress-indicator">
        <div className="progress-dot is-active" />
        <div className="progress-dot" />
        <div className="progress-dot" />
      </div>

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

              <p className="church-mission">{church.mission_label}</p>

              <div className="church-meta">
                <div>
                  <span className="label">Monthly goal</span>
                  <strong>{church.mission_goal}</strong>
                </div>
                <div>
                  <span className="label">Updates</span>
                  <strong>{church.giving_cadence}</strong>
                </div>
              </div>

              {isSelected && (
                <button
                  className="church-continue-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    continueNext();
                  }}
                >
                  Continue →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}