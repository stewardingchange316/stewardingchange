import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="bg-wrap">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark" />
            <div className="brand-name">Stewarding Change</div>
          </div>

          <nav className="nav">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => nav("/signin")}
            >
              Sign in
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => nav("/signup")}
            >
              Create account
            </button>
          </nav>
        </div>
      </header>

      <main className="container hero">
        <div className="hero-grid">
          {/* LEFT SIDE */}
          <div>
            <div className="kicker mb-6">
              <span className="dot" />
              Ministry-first financial infrastructure
            </div>

            <h1 className="hero-title">
              Stewarding{" "}
              <span className="accent">Change</span>
            </h1>

            <p className="lede">
             A transparent giving platform designed for YOUR church — helping your spare change serve your mission and glorify God.
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
                onClick={() => nav("/signin")}
              >
                Sign in
              </button>
            </div>
          </div>

          {/* RIGHT SIDE */}
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
                Turn your everyday CHANGE into last CHANGE.
              </div>
            </div>
          </div>
        </div>
      </main>

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
