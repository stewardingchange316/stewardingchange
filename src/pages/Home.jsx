import { useNavigate } from "react-router-dom";
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

  // Clean URL after auth
  useEffect(() => {
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
      if (data.session?.user) {
        nav("/dashboard", { replace: true });
      }
    };
    checkUser();
  }, [nav]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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

    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      {
        redirectTo: `${window.location.origin}/update-password`,
      }
    );

    setResetLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  return (
    <div className="bg-wrap">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <img
              src="/logo.png"
              alt="Stewarding Change Logo"
              className="brand-mark"
              style={{ height: "170px", width: "170px", objectFit: "contain" }}
            />
            <div className="brand-name">Stewarding Change</div>
          </div>
        </div>
      </header>

      <main className="container hero">
        <div className="hero-grid">
          <div>
            <div className="kicker mb-6">
              <span className="dot" />
              Ministry-first financial infrastructure
            </div>

            <h1 className="hero-title">
              Stewarding <span className="accent">Change</span>
            </h1>

            <p className="lede">
              A transparent giving platform designed for YOUR church —
              helping your spare change serve your mission and glorify God.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => nav("/signup")}
              >
                Get started
              </button>

              <button
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  setMode("login");
                  setShowLogin(true);
                }}
              >
                Sign in
              </button>
            </div>
          </div>

          {/* KEEPING YOUR ENTIRE HERO PANEL */}
          <div className="hero-panel">
            <div className="stack-6">
              <div className="hero-metric">
                <div className="metric">
                  <div className="name">Step 1</div>
                  <div className="value">Select your church</div>
                </div>

                <div className="metric">
                  <div className="name">Step 2</div>
                  <div className="value">Set a giving cap</div>
                </div>

                <div className="metric">
                  <div className="name">Step 3</div>
                  <div className="value">Connect your bank or card</div>
                </div>
              </div>

              <div className="alert alert-success">
                Turn your everyday CHANGE into lasting CHANGE.
              </div>
            </div>
          </div>
        </div>
      </main>

      {showLogin && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogin(false)}
        >
          <div
            className="modal-card glass"
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
              {mode === "login"
                ? "Welcome back"
                : "Reset your password"}
            </h2>

            <p className="modal-subtitle">
              {mode === "login"
                ? "Sign in to continue stewarding with clarity."
                : "Enter your email and we’ll send you a reset link."}
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

  <div style={{ position: "relative" }}>
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      autoComplete="current-password"
      style={{ paddingRight: "42px" }}
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        opacity: 0.8
      }}
      aria-label="Toggle password visibility"
    >
      {showPassword ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.42 1.47-2.73 2.57-3.86M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.08 5.08M1 1l22 22" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  </div>
</div>


                {error && (
                  <div className="alert alert-danger">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-wide"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <div style={{ marginTop: 14, textAlign: "center" }}>
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
                    onClick={() => {
                      setShowLogin(false);
                      nav("/signup");
                    }}
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
                    onChange={(e) =>
                      setResetEmail(e.target.value)
                    }
                    required
                  />
                </div>

                {!resetSent ? (
                  <button
                    type="submit"
                    className="btn btn-primary btn-wide"
                    disabled={resetLoading}
                  >
                    {resetLoading
                      ? "Sending..."
                      : "Send reset link"}
                  </button>
                ) : (
                  <div className="alert alert-success">
                    Reset link sent. Check your email/spam.
                  </div>
                )}

                <div style={{ marginTop: 14, textAlign: "center" }}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMode("login");
                      setResetSent(false);
                      setError("");
                    }}
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
