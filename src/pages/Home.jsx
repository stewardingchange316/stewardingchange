import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const nav = useNavigate();

  const [showLogin, setShowLogin] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "reset"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [churches, setChurches] = useState([]);

  // Clean URL after auth (but NOT during password recovery)
  useEffect(() => {
    if (window.location.pathname === "/update-password") return;

    const url = new URL(window.location.href);
    const hasAuthParams =
      url.searchParams.has("code") ||
      url.searchParams.has("access_token") ||
      url.hash.includes("access_token") ||
      url.hash.includes("error");

    if (hasAuthParams) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (
        data.session?.user &&
        window.location.pathname !== "/update-password"
      ) {
        nav("/dashboard", { replace: true });
      }
    };
    checkUser();
  }, [nav]);

  // Load churches for spotlight section
  useEffect(() => {
    supabase
      .from("churches")
      .select("id, name, mission_label, mission_title, mission_description, mission_progress")
      .eq("active", true)
      .order("name")
      .then(({ data }) => { if (data) setChurches(data); });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    nav("/dashboard");
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setResetLoading(true);

    const redirectUrl = `${window.location.origin}/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: redirectUrl,
    });

    setResetLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  return (
    <div className="bg-wrap">
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

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setMode("login"); setShowLogin(true); }}
          >
            Sign in
          </button>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero home-hero">
          <div className="home-glow" />

          <div className="home-hero-grid">
            {/* Left: copy */}
            <div className="home-hero-copy">
              <div className="kicker">
                <span className="dot" />
                Effortless church giving
              </div>

              <h1 className="hero-title home-hero-title">
                Your spare change,<br />
                <span className="text-brand">purposefully given.</span>
              </h1>

              <p className="lede home-hero-lede">
                Every purchase rounds up automatically. The difference goes
                straight to your church's active mission — tax-deductible,
                every week.
              </p>

              <div className="hero-actions home-hero-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => nav("/signup")}
                >
                  Start giving in 3 minutes
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => { setMode("login"); setShowLogin(true); }}
                >
                  Sign in
                </button>
              </div>
            </div>

            {/* Right: product preview card */}
            <div className="home-preview-wrap">
              <div className="home-preview-card">
                <div className="home-preview-header">
                  <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-1)", color: "var(--color-text-primary)" }}>
                    Stewarding Change
                  </span>
                  <div className="home-preview-avatar">T</div>
                </div>

                <div className="home-preview-status">
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                    <div className="status-dot is-active" />
                    <span style={{ fontSize: "var(--fs-1)", fontWeight: "var(--fw-semibold)", color: "var(--color-text-primary)" }}>
                      Giving Active
                    </span>
                  </div>
                  <span style={{ fontSize: "var(--fs-0)", color: "var(--color-text-muted)" }}>
                    Countryside Christian
                  </span>
                </div>

                <div className="home-preview-divider" />

                <div style={{ marginBottom: "var(--s-3)" }}>
                  <div style={{ fontSize: "var(--fs-0)", color: "var(--color-text-muted)", marginBottom: "var(--s-1)" }}>
                    This week
                  </div>
                  <div style={{ fontSize: "var(--fs-5)", fontWeight: "var(--fw-bold)", color: "var(--color-brand)", lineHeight: 1.1 }}>
                    +$2.47
                  </div>
                </div>

                <div className="home-preview-txns">
                  {[
                    { name: "Coffee Shop", amt: "+$0.73" },
                    { name: "Gas Station",  amt: "+$0.41" },
                    { name: "Grocery Store", amt: "+$1.33" },
                  ].map((t) => (
                    <div key={t.name} className="home-preview-txn">
                      <span style={{ fontSize: "var(--fs-0)", color: "var(--color-text-muted)" }}>{t.name}</span>
                      <span style={{ fontSize: "var(--fs-0)", color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}>{t.amt}</span>
                    </div>
                  ))}
                </div>

                <div className="home-preview-divider" />

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--s-2)" }}>
                    <span style={{ fontSize: "var(--fs-0)", color: "var(--color-text-muted)" }}>Mission progress</span>
                    <span style={{ fontSize: "var(--fs-0)", color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}>64%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: "64%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <div className="home-stats-bar">
          {[
            { val: "2 min",  label: "to set up" },
            { val: "$0",     label: "in fees" },
            { val: "100%",   label: "tax-deductible" },
            { val: "Cancel", label: "any time" },
          ].map((s) => (
            <div key={s.label} className="home-stat-item">
              <div className="home-stat-val">{s.val}</div>
              <div className="home-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── How it works ── */}
        <section className="steps-section">
          <h2>How it works</h2>

          <div className="home-features-grid">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                ),
                title: "Choose your church",
                body: "Pick the congregation you want to support. Your giving flows directly to their active mission — not a general fund.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: "Set your weekly limit",
                body: "Start at $5 or more. Pause, adjust, or disconnect any time — you're always in full control.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
                title: "Give as you live",
                body: "Every coffee, every errand rounds up. The spare change accumulates and is donated to your church weekly.",
              },
            ].map((f) => (
              <div key={f.title} className="home-feature-card">
                <div className="home-feature-icon">{f.icon}</div>
                <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "var(--fs-2)" }}>{f.title}</h4>
                <p className="muted" style={{ margin: 0, fontSize: "var(--fs-1)" }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Church spotlight ── */}
        {churches.length > 0 && (
          <section className="steps-section" style={{ paddingBottom: "var(--s-10)" }}>
            <h2>Missions you'll support</h2>
            <div className="home-spotlight-grid">
              {churches.map((c) => (
                <div key={c.id} className="card stack-4">
                  <div className="stack-1">
                    <div className="kicker" style={{ marginBottom: 0 }}>
                      <span className="dot" />
                      {c.mission_label || c.name}
                    </div>
                    <h4 style={{ margin: 0 }}>{c.mission_title || "Mission"}</h4>
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: "var(--fs-1)" }}>
                    {c.mission_description}
                  </p>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--s-2)" }}>
                      <span className="small muted">Progress toward goal</span>
                      <span className="small" style={{ color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}>
                        {c.mission_progress ?? 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${c.mission_progress ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Trust line ── */}
        <div className="trust-line" style={{ padding: "var(--s-5) var(--s-4) var(--s-10)" }}>
          <span>Bank-grade security</span>
          <span className="trust-dot" />
          <span>100% tax-deductible</span>
          <span className="trust-dot" />
          <span>Cancel any time</span>
          <span className="trust-dot" />
          <span>No hidden fees</span>
        </div>
      </main>

      {/* ── Login Modal ── */}
      {showLogin && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowLogin(false)}
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="modal-title">
              {mode === "login" ? "Welcome back" : "Reset your password"}
            </h2>

            <p className="modal-subtitle">
              {mode === "login"
                ? "Sign in to continue stewarding with clarity."
                : "Enter your email and we'll send you a reset link."}
            </p>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="modal-form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="input-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.42 1.47-2.73 2.57-3.86M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.08 5.08M1 1l22 22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary btn-wide"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMode("reset");
                      setResetEmail(email);
                      setResetSent(false);
                      setError("");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="modal-footer">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => { setShowLogin(false); nav("/signup"); }}
                  >
                    Sign up
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleReset} className="modal-form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>

                {!resetSent ? (
                  <button
                    type="submit"
                    className="btn btn-primary btn-wide"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Sending…" : "Send reset link"}
                  </button>
                ) : (
                  <div className="alert alert-success">
                    Reset link sent. Check your email/spam.
                  </div>
                )}

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => { setMode("login"); setResetSent(false); setError(""); }}
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
