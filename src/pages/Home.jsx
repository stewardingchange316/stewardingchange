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

      {/* ── Hero ── */}
      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="kicker">
              <span className="dot" />
              For churches and their members
            </div>

            <h1 className="hero-title">
              Your spare change,<br />
              <span className="text-brand">purposefully given.</span>
            </h1>

            <p className="lede" style={{ maxWidth: "46ch", margin: "0 auto var(--s-7)" }}>
              Stewarding Change rounds up your everyday purchases and
              donates the difference to your church — automatically,
              securely, and tax-deductibly.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => nav("/signup")}
              >
                Start Giving
              </button>

              <button
                className="btn btn-secondary btn-lg"
                onClick={() => { setMode("login"); setShowLogin(true); }}
              >
                Sign in
              </button>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="steps-section">
          <h2>How it works</h2>

          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-body">
              <h4>Select your church</h4>
              <p>Choose the congregation you want to support. Your giving goes directly to their active mission.</p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-body">
              <h4>Set a weekly cap</h4>
              <p>You decide the maximum amount per week — as little as $5. You're always in control.</p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-body">
              <h4>Give as you live</h4>
              <p>Every purchase rounds up. The change accumulates and is donated weekly on your behalf.</p>
            </div>
          </div>
        </section>

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

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div>© {new Date().getFullYear()} Stewarding Change</div>
          <div className="footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <div>Secure · Transparent · Simple</div>
        </div>
      </footer>

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
