// web/src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;
      setUser(data.user);
    };
    loadUser();
  }, []);

  // Onboarding data
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

  const bankConnected = onboarding?.bankConnected === true;

  const firstName =
    user?.email?.split("@")[0]?.replace(/[0-9]/g, "") || "Friend";

  return (
    <div className="page">
      <div className="container-narrow stack-8">

        {/* Welcome */}
        <div className="row-between">
          <div className="stack-2">
            <h2>Welcome back, {firstName} 👋</h2>
            <div className="muted">
              You’re stewarding with {churchName}.
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              await supabase.auth.signOut();
              nav("/");
            }}
          >
            Sign out
          </button>
        </div>

        {/* Profile Card */}
        <div className="glass card stack-6">
          <h3>Your Stewarding Profile</h3>

          <div className="row-between">
            <div>
              <div className="muted small">Church</div>
              <div>{churchName}</div>
            </div>
          </div>

          <div className="row-between">
            <div>
              <div className="muted small">Weekly Cap</div>
              <div>{givingCap}</div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => nav("/giving-cap")}
            >
              Edit
            </button>
          </div>

          <div className="row-between">
            <div>
              <div className="muted small">Bank Status</div>
              <div>
                {bankConnected ? "Connected securely" : "Not connected"}
              </div>
            </div>

            {!bankConnected && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => nav("/bank")}
              >
                Connect Now
              </button>
            )}
          </div>

          <div className="small muted">
            Every cent given is a tax-deductible donation.
            Weekly statements and an annual giving summary
            are automatically provided.
          </div>
        </div>

        {/* Mission Card */}
        <div className="glass card stack-6">
          <div className="stack-2">
            <h3>Current Church Goal</h3>
            <h2>Food Truck Outreach Initiative</h2>
          </div>

          <div className="muted">
            Our church is working toward launching a food truck
            that will serve warm meals across Clearwater to families in need.
            Once funded, outreach days will be shared so you can see
            the impact firsthand.
          </div>

          {/* Vague Progress */}
          <div className="stack-2">
            <div className="muted small">
              We’re making meaningful progress toward this mission.
            </div>

            <div
              style={{
                height: "10px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "64%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, rgba(17,240,180,1), rgba(47,128,255,1))",
                  borderRadius: "999px",
                }}
              />
            </div>

            <div className="muted small">
              Every swipe helps move this goal forward.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
