import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const nav = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
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

         <nav className="nav">
  <button
    className="btn btn-ghost btn-sm"
    onClick={() => setShowLogin(true)}
  >
    Sign in
  </button>
</nav>

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
                  <div className="name">Average setup time</div>
                  <div className="value">≈ 5 minutes</div>
                </div>

                <div className="metric">
                  <div className="name">Audit clarity</div>
                  <div className="value">100%</div>
                </div>

                <div className="metric">
                  <div className="name">Giving transparency</div>
                  <div className="value">Weekly Updates</div>
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
        <div className="login-overlay">
          <div className="login-modal glass">
            <button
              className="login-close"
              onClick={() => setShowLogin(false)}
            >
              ✕
            </button>

            <h2>Welcome back</h2>
            <p className="muted mb-4">
              Sign in to continue stewarding with clarity.
            </p>

            <form onSubmit={handleLogin} className="stack-4">
              <input
                type="email"
                placeholder="Email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-wide">
                Sign in
              </button>
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
