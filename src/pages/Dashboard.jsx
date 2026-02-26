import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";

const CHURCH_MAP = {
  countryside: "Countryside Christian Church",
  grace: "Grace Community Church",
};

export default function Dashboard() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        nav("/", { replace: true });
        return;
      }

      const user = session.user;
      setAuthUser(user);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to load profile:", error);
        nav("/", { replace: true });
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    load();
  }, [nav]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    nav("/");
  }

  if (loading || !profile) {
    return (
      <>
        <header className="header">
          <div className="header-inner">
            <Link to="/" className="brand">
              <img src="/logo.png" alt="Stewarding Change" className="brand-mark" style={{ height: "36px", width: "36px", objectFit: "contain" }} />
              <span className="brand-name">Stewarding Change</span>
            </Link>
          </div>
        </header>
        <div className="center" style={{ minHeight: "60vh" }}>
          <div className="spinner" />
        </div>
      </>
    );
  }

  /* ── Derived values ── */
  const churchName   = CHURCH_MAP[profile.church_id] || "Not selected";
  const bankConnected = profile.bank_connected === true;
  const firstName    = profile.first_name
    || authUser?.user_metadata?.first_name
    || authUser?.email?.split("@")[0]
    || "Friend";

  const givingCap = profile.weekly_cap === null
    ? "No limit"
    : typeof profile.weekly_cap === "number"
    ? `$${profile.weekly_cap} / week`
    : "Not set";

  const initials = firstName.charAt(0).toUpperCase();

  /* ── UI ── */
  return (
    <div className="dash-root">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <img
              src="/logo.png"
              alt="Stewarding Change"
              className="brand-mark"
              style={{ height: "36px", width: "36px", objectFit: "contain" }}
            />
            <span className="brand-name">Stewarding Change</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <div className="dash-avatar">{initials}</div>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <div className="dash-body">
        <div className="container-narrow stack-7">

          {/* ── Welcome ── */}
          <div className="stack-1">
            <h2 style={{ margin: 0 }}>Welcome back, {firstName}</h2>
            <p className="muted" style={{ margin: 0 }}>
              Stewarding with {churchName}
            </p>
          </div>

          {/* ── Giving stats row ── */}
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-label">This Month</div>
              <div className="dash-stat-value">$0.00</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-label">All Time</div>
              <div className="dash-stat-value">$0.00</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-label">Transactions</div>
              <div className="dash-stat-value">0</div>
            </div>
          </div>

          {/* ── Giving status banner (when bank connected) ── */}
          {bankConnected && (
            <div className={`dash-status-banner ${paused ? "is-paused" : "is-active"}`}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <div className={`status-dot ${paused ? "is-paused" : "is-active"}`} />
                <div>
                  <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)" }}>
                    {paused ? "Giving Paused" : "Giving Active"}
                  </div>
                  <div className="small muted">
                    {paused
                      ? "Resume to continue rounding up purchases"
                      : "Rounding up purchases automatically"}
                  </div>
                </div>
              </div>
              <button
                className={`btn btn-sm ${paused ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setPaused(!paused)}
              >
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
          )}

          {/* ── Bank connect prompt (when not connected) ── */}
          {!bankConnected && (
            <div className="dash-status-banner is-pending">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <div className="status-dot is-pending" />
                <div>
                  <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)" }}>
                    Bank not connected
                  </div>
                  <div className="small muted">Connect your bank to start giving</div>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => nav("/bank")}>
                Connect Now
              </button>
            </div>
          )}

          {/* ── Account card ── */}
          <div className="card stack-5">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>Account</h3>
            </div>

            <div className="dash-row">
              <div>
                <div className="dash-row-label">Church</div>
                <div className="dash-row-value">{churchName}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => nav("/church-select")}>Edit</button>
            </div>

            <div className="dash-divider" />

            <div className="dash-row">
              <div>
                <div className="dash-row-label">Weekly Cap</div>
                <div className="dash-row-value">{givingCap}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => nav("/giving-cap")}>Edit</button>
            </div>

            <div className="dash-divider" />

            <div className="dash-row">
              <div>
                <div className="dash-row-label">Bank Account</div>
                <div className="dash-row-value">
                  {bankConnected ? "Connected securely" : "Not connected"}
                </div>
              </div>
              {bankConnected
                ? <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (confirm("Disconnect your bank account? You can reconnect at any time.")) {
                        nav("/bank");
                      }
                    }}
                  >
                    Disconnect
                  </button>
                : <button className="btn btn-primary btn-sm" onClick={() => nav("/bank")}>
                    Connect
                  </button>
              }
            </div>

            <p className="small muted" style={{ margin: 0 }}>
              All donations are 100% tax-deductible. Weekly statements and an annual giving
              summary are provided automatically.
            </p>
          </div>

          {/* ── Mission card ── */}
          <div className="card stack-5">
            <div className="stack-1">
              <div className="kicker" style={{ marginBottom: 0 }}>
                <span className="dot" />
                {churchName}
              </div>
              <h3 style={{ margin: 0 }}>Food Truck Outreach Initiative</h3>
            </div>

            <p className="muted" style={{ margin: 0, fontSize: "var(--fs-2)" }}>
              Our church is working toward launching a food truck that will serve warm meals
              across Clearwater to families in need. Once funded, outreach days will be
              shared so you can see the impact firsthand.
            </p>

            <div className="stack-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="small muted">Progress toward goal</span>
                <span className="small" style={{ color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}>64%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "64%" }} />
              </div>
              <p className="small muted" style={{ margin: 0 }}>Every purchase rounded up moves this forward.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
