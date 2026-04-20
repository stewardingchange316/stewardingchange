import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { writeProfileCache } from "../lib/profileCache";

export default function AllSet() {
  const navigate = useNavigate();
  const [churchName, setChurchName] = useState("");
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("users")
          .select("first_name, church_id")
          .eq("id", user.id)
          .single();

        if (profile?.first_name) setFirstName(profile.first_name);

        if (profile?.church_id) {
          const { data: church } = await supabase
            .from("churches")
            .select("name")
            .eq("id", profile.church_id)
            .single();
          if (church) setChurchName(church.name);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    }
    load();
  }, []);

  async function goToDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ onboarding_step: "done" })
          .eq("id", user.id);

        writeProfileCache(user.id, "done");
      }
    } catch (err) {
      console.error("Error finishing onboarding:", err);
    }
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="onboarding-page" style={{ textAlign: "center" }}>
      <div className="progress-indicator">
        <div className="progress-dot" />
        <div className="progress-dot" />
        <div className="progress-dot" />
        <div className="progress-dot is-active" />
      </div>

      <div className="stack-6" style={{ marginTop: "var(--s-6)" }}>
        <div style={{ fontSize: "64px", lineHeight: 1 }}>🎉</div>

        <div className="stack-2">
          <h1 style={{ margin: 0 }}>
            You're all set{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="onboarding-subtext" style={{ maxWidth: "42ch", margin: "0 auto" }}>
            You're officially stewarding change.
            {churchName ? ` Your round-ups will go directly to ${churchName}.` : ""}
          </p>
        </div>

        <div className="card stack-4" style={{ textAlign: "left", maxWidth: "380px", margin: "0 auto" }}>
          <div className="dash-row">
            <div>
              <div className="small muted">Church</div>
              <div style={{ fontWeight: "var(--fw-semibold)" }}>{churchName || "Selected"}</div>
            </div>
            <span style={{ color: "var(--color-success)", fontSize: "18px" }}>✓</span>
          </div>
          <div className="dash-divider" />
          <div className="dash-row">
            <div>
              <div className="small muted">Spending card</div>
              <div style={{ fontWeight: "var(--fw-semibold)" }}>Connected</div>
            </div>
            <span style={{ color: "var(--color-success)", fontSize: "18px" }}>✓</span>
          </div>
          <div className="dash-divider" />
          <div className="dash-row">
            <div>
              <div className="small muted">Bank account</div>
              <div style={{ fontWeight: "var(--fw-semibold)" }}>Connected</div>
            </div>
            <span style={{ color: "var(--color-success)", fontSize: "18px" }}>✓</span>
          </div>
        </div>

        <p className="muted" style={{ fontSize: "var(--fs-1)", maxWidth: "40ch", margin: "0 auto" }}>
          Your round-ups will start being tracked and your first donation
          will be collected at the end of the month.
        </p>

        <button
          className="btn btn-primary btn-lg btn-wide"
          onClick={goToDashboard}
          style={{ maxWidth: "380px", margin: "0 auto" }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
