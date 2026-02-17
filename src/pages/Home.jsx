import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const nav = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 CLEAN STRAY SUPABASE AUTH PARAMS (FIXES PKCE ERROR)
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

  // Auto-redirect if already signed in
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

  return (
    <div className="bg-wrap">
      {/* HEADER */}
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

      {/* HERO */}
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
                onClick={() => setShowLogin(true)}
              >
                Sign in
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
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

      {/* PREMIUM LOGIN MODAL */}
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

            <h2 className="modal-title">Welcome back</h2>
            <p className="modal-subtitle">
              Sign in to continue stewarding with clarity.
            </p>

            <form onSubmit={handleLogin} className="modal-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
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
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>© {new Date().getFullYear()} Stewarding Change</div>
          <div className="row">
            <span className="muted">Secure • Transparent • Simple</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
