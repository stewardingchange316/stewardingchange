// web/src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [churchUserCount, setChurchUserCount] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) return; // 🔥 RequireAuth handles redirect

      setUser(data.user);

      const raw = localStorage.getItem("sc_onboarding");
      if (!raw) return;

      let onboarding = null;
      try {
        onboarding = JSON.parse(raw);
      } catch {
        return;
      }

      if (!onboarding?.church?.id) return;

      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("church_id", onboarding.church.id);

      if (count !== null) {
        setChurchUserCount(count);
      }
    };

    loadUser();
  }, []);

  // ✅ Onboarding data (unchanged)
  let onboarding = null;
  const raw = localStorage.getItem("sc_onboarding");

  if (raw) {
    try {
      onboarding = JSON.parse(raw);
    } catch {
      onboarding = null;
    }
  }

  const churchName = onboarding?.church?.name || "Not selected";

  const givingCap =
    onboarding?.weeklyCap === null
      ? "No limit"
      : typeof onboarding?.weeklyCap === "number"
      ? `$${onboarding.weeklyCap} per week`
      : "Not set";

  const bankStatus =
    onboarding?.bankConnected === true
      ? "Connected"
      : onboarding?.bankConnected === false
      ? "Not connected"
      : "Pending";

  // Mock Impact Numbers
  const familiesHelped = 148;
  const monthlyGoal = 10000;
  const currentImpact = 6420;

  const impactPercent = Math.min(
    Math.round((currentImpact / monthlyGoal) * 100),
    100
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-pill">
          <h1>
            Welcome: Stewarding {user?.email}
          </h1>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            nav("/");
          }}
        >
          Sign out
        </button>
      </div>

      <section className="card">
        <h3>Church</h3>
        <p>{churchName}</p>
      </section>

      <section className="card">
        <h3>Giving Cap</h3>
        <p>{givingCap}</p>
      </section>

      <section className="card">
        <h3>Bank Connected</h3>
        <p>{bankStatus}</p>
      </section>

      <section className="card">
        <h3>Community Participation</h3>
        <p>
          {churchUserCount} members from your church are stewarding with clarity.
        </p>
      </section>

      <section className="card">
        <h3>Helping Hands – Clearwater, FL</h3>
        <p>
          {familiesHelped} families supported this year.
        </p>
        <a
          href="https://countrysidecares.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more about Helping Hands
        </a>
      </section>

      <section className="card">
        <h3>Impact Progress</h3>
        <p>
          ${currentImpact.toLocaleString()} raised toward $
          {monthlyGoal.toLocaleString()} monthly goal.
        </p>

        <div
          style={{
            height: "12px",
            background: "#1e1e1e",
            borderRadius: "6px",
            overflow: "hidden",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              width: `${impactPercent}%`,
              background: "#4ade80",
              height: "100%",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p style={{ marginTop: "6px", fontSize: "0.9rem", opacity: 0.7 }}>
          {impactPercent}% of monthly impact goal achieved
        </p>
      </section>
    </div>
  );
}
