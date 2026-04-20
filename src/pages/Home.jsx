import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import WaveBackground from "../components/WaveBackground";

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

  const [menuOpen, setMenuOpen] = useState(false);

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
      setError("Invalid email or password.");
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
      setError("Unable to send reset link. Please check your email and try again.");
    } else {
      setResetSent(true);
    }
  }

  return (
    <div className="landing">

      {/* ── Background effects ── */}
      <div className="landing-flow" aria-hidden="true">
        <div className="landing-orb landing-orb-a" />
        <div className="landing-orb landing-orb-b" />
        <div className="landing-orb landing-orb-c" />
        <svg className="landing-stroke landing-s1" viewBox="0 0 1600 600" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#7DB7FF" stopOpacity="0"/>
              <stop offset="45%" stopColor="#7DB7FF" stopOpacity="0.55"/>
              <stop offset="100%" stopColor="#A98BFF" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M-100,320 C200,140 420,520 780,300 C1120,90 1300,440 1700,260" stroke="url(#g1)" strokeWidth="2.2" fill="none"/>
          <path d="M-100,360 C220,200 440,560 780,340 C1140,120 1320,480 1700,300" stroke="url(#g1)" strokeWidth="1.2" strokeOpacity="0.6" fill="none"/>
        </svg>
        <svg className="landing-stroke landing-s2" viewBox="0 0 1600 500" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="g2" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#A98BFF" stopOpacity="0"/>
              <stop offset="55%" stopColor="#CFE0FF" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#7DB7FF" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0,200 C300,60 600,380 900,200 C1200,20 1400,340 1600,160" stroke="url(#g2)" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      <WaveBackground />

      {/* ── Nav ── */}
      <nav className="landing-nav" style={{ position: "relative" }}>
        <div className="landing-brand">
          <div className="landing-brand-mark">
            <img src="/logo.png" alt="Stewarding Change" />
          </div>
          <span>Stewarding Change</span>
        </div>
        <div className="landing-nav-cta">
          <button className="landing-btn-sm" onClick={() => { setMode("login"); setShowLogin(true); }}>
            Sign in
          </button>
          <button className="landing-btn-sm landing-btn-sm-primary" onClick={() => nav("/signup")}>
            Create account
          </button>
          <button
            className={`landing-menu-btn ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span className="landing-menu-bars"><span /><span /><span /></span>
          </button>
        </div>

        {/* Menu panel */}
        <div className={`landing-menu-panel ${menuOpen ? "open" : ""}`} role="menu">
          <Link to="/faq" role="menuitem" onClick={() => setMenuOpen(false)}>
            FAQ
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <a href="#how-it-works" role="menuitem" onClick={() => setMenuOpen(false)}>
            How it works
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
          <Link to="/tithe-calculator" role="menuitem" onClick={() => setMenuOpen(false)}>
            Tithe Calculator
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link to="/about" role="menuitem" onClick={() => setMenuOpen(false)}>
            About us
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link to="/help" role="menuitem" onClick={() => setMenuOpen(false)}>
            Help
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link to="/add-church" role="menuitem" onClick={() => setMenuOpen(false)}>
            Add your church
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          {/* Left: copy */}
          <div className="landing-copy">
            <span className="landing-eyebrow">
              <span className="landing-eyebrow-dot" />
              Effortless church giving
            </span>

            <h1 className="landing-headline">
              Your spare change, <span className="landing-serif">purposefully</span> given.
            </h1>

            <p className="landing-sub">
              Every purchase rounds up automatically. The difference goes straight to your church's active mission<span className="landing-hide-mobile"> — tax-deductible, every month</span>.
            </p>

            <div className="landing-cta-row">
              <button className="landing-btn landing-btn-primary" onClick={() => nav("/signup")}>
                Create an Account
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="landing-btn landing-btn-ghost" onClick={() => { setMode("login"); setShowLogin(true); }}>
                Sign in
              </button>
            </div>

            <div className="landing-powered">
              <span className="landing-powered-label">Powered by</span>
              <span className="landing-powered-sep" aria-hidden="true" />
              <span className="landing-powered-logo">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Stripe
              </span>
              <span className="landing-powered-dot" aria-hidden="true" />
              <span className="landing-powered-logo">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3"/></svg>
                Plaid
              </span>
              <span className="landing-powered-note">Bank-grade security</span>
            </div>
          </div>

          {/* Right: Phone */}
          <div className="landing-phone-wrap">
            {/* Floating chips */}
            <div className="landing-chip landing-chip-1">
              <div className="landing-chip-icon">☕</div>
              <div>
                <div style={{ fontSize: "11px", opacity: 0.75, lineHeight: 1 }}>Coffee Shop</div>
                <div style={{ lineHeight: 1 }}>$4.20 → <span className="landing-chip-amt">+$0.80</span></div>
              </div>
            </div>
            <div className="landing-chip landing-chip-2">
              <div className="landing-chip-icon">⛽</div>
              <div>
                <div style={{ fontSize: "11px", opacity: 0.75, lineHeight: 1 }}>Gas Station</div>
                <div style={{ lineHeight: 1 }}>$38.59 → <span className="landing-chip-amt">+$0.41</span></div>
              </div>
            </div>
            <div className="landing-chip landing-chip-3" style={{ padding: "10px 14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontSize: "10px", opacity: 0.7, letterSpacing: "0.04em", textTransform: "uppercase" }}>Mission</div>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>64% funded</div>
              </div>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "conic-gradient(#6BF0B2 0 64%, rgba(255,255,255,0.18) 64% 100%)",
                display: "grid", placeItems: "center"
              }}>
                <div style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: "#0B1A46", display: "grid", placeItems: "center",
                  fontSize: "9px", fontWeight: 700, color: "#6BF0B2"
                }}>64</div>
              </div>
            </div>

            <div className="landing-phone">
              <div className="landing-phone-screen">
                <div className="landing-phone-notch" />

                {/* Status bar */}
                <div className="landing-status-bar">
                  <span>9:41</span>
                  <div className="landing-status-icons">
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="5" width="3" height="5" rx="0.5"/><rect x="4.3" y="3" width="3" height="7" rx="0.5"/><rect x="8.7" y="1" width="3" height="9" rx="0.5"/><rect x="13" y="0" width="3" height="10" rx="0.5" opacity=".4"/></svg>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M7 2.5c2 0 3.7.8 5 2M7 2.5c-2 0-3.7.8-5 2M7 5.5c1 0 2 .4 2.8 1.1M7 5.5c-1 0-2 .4-2.8 1.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><circle cx="7" cy="8.5" r="0.9" fill="currentColor"/></svg>
                    <svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="15" height="7" rx="1.2" fill="currentColor"/><rect x="21" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity=".45"/></svg>
                  </div>
                </div>

                {/* App content */}
                <div className="landing-app">
                  <div className="landing-app-top">
                    <div className="landing-app-logo">
                      <div className="landing-app-mark"><img src="/logo.png" alt="" /></div>
                      Stewarding Change
                    </div>
                    <div className="landing-app-avatar">TH</div>
                  </div>

                  {/* Hero card (dark gradient) */}
                  <div className="landing-hero-card">
                    <div className="landing-hero-card-row">
                      <span className="landing-hero-pill"><span className="landing-hero-live" /> Active</span>
                      <span style={{ opacity: 0.75 }}>Grace Community</span>
                    </div>
                    <div className="landing-hero-amount">
                      <span className="landing-hero-big"><span style={{ opacity: 0.9, fontWeight: 500 }}>+</span>$1.72</span>
                      <span className="landing-hero-label">today</span>
                    </div>
                    <div className="landing-hero-sub-row">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 7l3-3 3 3" stroke="#6BF0B2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="landing-hero-trend">+$21.46</span><span>this month</span>
                    </div>
                    <div className="landing-hero-progress">
                      <div className="landing-hero-progress-bar"><div className="landing-hero-progress-fill" /></div>
                      <div className="landing-hero-progress-meta">
                        <span>Roof Restoration Fund</span>
                        <span>$21.46 / $33.42</span>
                      </div>
                    </div>
                  </div>

                  {/* Round-ups */}
                  <div className="landing-section-title">
                    <span>Round-ups</span>
                    <span className="landing-seeall">See all</span>
                  </div>

                  <div className="landing-txns">
                    {[
                      {
                        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5h7v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5zM10 6h1.5a1.5 1.5 0 0 1 0 3H10M4 1v2M7 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                        name: "Coffee Shop", detail: "Today · $4.27", amt: "+$0.73"
                      },
                      {
                        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M9 6h2l1 1v3a1 1 0 0 1-1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="11" cy="8" r="0.6" fill="currentColor"/></svg>,
                        name: "Gas Station", detail: "Yesterday · $38.59", amt: "+$0.41"
                      },
                      {
                        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 6h4M5 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M3 1v2M11 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                        name: "Theater Tickets", detail: "Apr 18 · $24.42", amt: "+$0.58"
                      },
                    ].map((t) => (
                      <div key={t.name} className="landing-txn">
                        <div className="landing-txn-icon">{t.icon}</div>
                        <div className="landing-txn-meta">
                          <div className="landing-txn-name">{t.name}</div>
                          <div className="landing-txn-detail">{t.detail}</div>
                        </div>
                        <div className="landing-txn-amt">
                          {t.amt}
                          <span className="landing-txn-round">rounded</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tab bar */}
                  <div className="landing-tab-bar">
                    <div className="landing-tab landing-tab-active">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 7l6-5 6 5v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                      Home
                    </div>
                    <div className="landing-tab">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14c.8-2.4 3.2-4 6-4s5.2 1.6 6 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      Mission
                    </div>
                    <div className="landing-tab">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      Settings
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Indicators ── */}
      <section className="landing-trust">
        <div className="landing-trust-inner">
          <div className="landing-trust-cell">
            <div className="landing-trust-num">2 <span className="landing-trust-unit">min</span></div>
            <div className="landing-trust-lbl">to set up</div>
          </div>
          <div className="landing-trust-cell">
            <div className="landing-trust-num"><span className="landing-trust-unit">$</span>0</div>
            <div className="landing-trust-lbl">in fees</div>
          </div>
          <div className="landing-trust-cell">
            <div className="landing-trust-num">100<span className="landing-trust-unit">%</span></div>
            <div className="landing-trust-lbl">tax-deductible</div>
          </div>
          <div className="landing-trust-cell">
            <div className="landing-trust-num" style={{ fontSize: "clamp(20px, 3.8vw, 28px)" }}>Cancel</div>
            <div className="landing-trust-lbl">any time</div>
          </div>
        </div>
      </section>

      {/* ── Signal row ── */}
      <div className="landing-signals">
        <span className="landing-signal-item">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l5 2v4c0 3-2.2 5.4-5 6-2.8-.6-5-3-5-6V3l5-2z" stroke="currentColor" strokeWidth="1.2"/></svg>
          Bank-grade encryption
        </span>
        <span className="landing-signal-item">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          IRS-compliant receipts
        </span>
        <span className="landing-signal-item">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 6h10" stroke="currentColor" strokeWidth="1.2"/></svg>
          Plaid-secured connections
        </span>
        <span className="landing-signal-item">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Cancel anytime
        </span>
      </div>

      {/* ── How it works ── */}
      <section className="landing-features" id="how-it-works">
        <h2 className="landing-section-heading">How it works</h2>
        <p className="landing-section-sub">Three simple steps to start giving effortlessly.</p>
        <div className="landing-features-grid">
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ),
              title: "Choose your church",
              body: "Select the congregation you want to give to. Every dollar goes directly to their active mission — not a general fund.",
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              title: "Spend normally, give automatically",
              body: "Link your bank and keep spending like you always do. Every purchase rounds up — those extra cents go straight to your church's mission.",
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ),
              title: "Watch your impact grow",
              body: "Your church shares mission updates, milestones, and video updates in the app — so you see the real difference your giving makes.",
            },
          ].map((f) => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.body}</p>
            </div>
          ))}
        </div>

        <div className="landing-calc-callout">
          <div>
            <h4>Wondering what your tithe should be?</h4>
            <p>Use our free calculator to see your 10% tithe broken down monthly.</p>
          </div>
          <Link to="/tithe-calculator" className="landing-btn landing-btn-ghost" style={{ flexShrink: 0 }}>
            Try the Calculator
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-brand" style={{ fontSize: "15px" }}>
            <div className="landing-brand-mark" style={{ width: "24px", height: "24px" }}>
              <img src="/logo.png" alt="" />
            </div>
            Stewarding Change
          </div>
          <div className="landing-footer-links">
            <Link to="/faq">FAQ</Link>
            <Link to="/about">About</Link>
            <Link to="/help">Help</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          <div className="landing-footer-copy">
            © {new Date().getFullYear()} Stewarding Change
          </div>
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
