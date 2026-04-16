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

  const [churches, setChurches] = useState([]);
  const [faqOpen, setFaqOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "What is a tithe?",
      a: "A tithe is a biblical practice of giving 10% of your income to your church. The word \"tithe\" literally means \"a tenth.\" It's referenced throughout the Bible as a way to honor God with your finances and support the work of the church.",
    },
    {
      q: "How does Stewarding Change work?",
      a: "You link your bank account, choose your church, and set a monthly cap. Every time you make a purchase, the amount rounds up to the nearest dollar. That spare change goes directly to your church's active mission — automatically.",
    },
    {
      q: "Should I tithe on gross or net income?",
      a: "This is a personal decision. Some people tithe on their gross (pre-tax) income, while others tithe on their net (after-tax) income. Both are valid — what matters most is giving cheerfully and consistently.",
    },
    {
      q: "Do I have to give exactly 10%?",
      a: "No. A tithe of 10% is a biblical guideline, not a strict requirement. Many Christians use it as a starting point. You're free to give any amount you're comfortable with — even small, consistent giving makes an impact.",
    },
    {
      q: "Is my giving tax-deductible?",
      a: "Yes. Donations made through Stewarding Change to your church are tax-deductible. You'll receive records of your giving that you can use when filing your taxes.",
    },
    {
      q: "What if I want to stop or pause?",
      a: "You're always in full control. You can pause giving, adjust your monthly cap, or disconnect your bank at any time from your dashboard — no questions asked.",
    },
    {
      q: "Is my bank information safe?",
      a: "Absolutely. We use bank-grade encryption and never store your banking credentials. Your financial data is handled securely through trusted, industry-standard providers.",
    },
    {
      q: "How much does it cost to use Stewarding Change?",
      a: "Stewarding Change is completely free for givers. There are no fees or deductions from your donations — 100% of your round-ups go directly to your church.",
    },
    {
      q: "My church isn't listed — can I still use it?",
      a: "Yes! If your church isn't on the platform yet, just email us at info@stewardingchange.org and let us know. We'll reach out to your church and work to get them set up so you can start giving.",
    },
    {
      q: "Do you have access to my bank account?",
      a: "No. We never hold your money and we never have access to your bank login or account details. Your round-ups are calculated once a week and transferred directly to your church — we simply facilitate the connection. Your information is handled securely through trusted, bank-level providers.",
    },
    {
      q: "What happens to my money if my church leaves the platform?",
      a: "If your church ever leaves Stewarding Change, all giving is immediately paused. No money is taken without an active church to receive it. Any funds already in transit go directly to your church as intended, and if anything can't be delivered, it's returned to you.",
    },
    {
      q: "Can I see where my money actually goes?",
      a: "Absolutely. Your church updates their active mission and goals on a regular basis, and many churches post video updates directly on the mission feed so you can see the real-world impact of your giving. You'll always know exactly what your spare change is helping accomplish.",
    },
    {
      q: "I already give at church on Sundays. Is this a replacement?",
      a: "Not at all — Stewarding Change is designed to complement your existing giving, not replace it. Think of it as an easy way to give a little extra throughout the week without even thinking about it. Whether you give at church, here, or both, every bit makes a difference. There's no pressure either way.",
    },
    {
      q: "How do I get my tax receipt?",
      a: "At the end of each year, a tax receipt summarizing all of your donations will be sent to the email address on your account. You can use it when filing your taxes — no need to track anything yourself.",
    },
    {
      q: "Who is behind Stewarding Change?",
      a: "Stewarding Change was founded by Terence and Andrew — two friends who met working at Waffle House. Terence is a father of one, a restaurant GM, and a lifelong entrepreneur. Andrew is a father of three and a lead pastor at Countryside Christian in Clearwater, FL. They built this because they believe giving should be simple, honest, and something everyone can do — no matter how small the amount.",
    },
  ];

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

  // Add reveal visibility after first paint so content is always scrollable
  useEffect(() => {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.classList.add("is-visible");
    });
  }, [churches]);

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
    <div className="bg-wrap">
      <WaveBackground />
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

          <div className="header-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => nav("/signup")}
            >
              Start Giving
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setMode("login"); setShowLogin(true); }}
            >
              Sign in
            </button>
          </div>
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
                every month.
              </p>

              <div className="hero-actions home-hero-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => nav("/signup")}
                >
                  Create an Account
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => { setMode("login"); setShowLogin(true); }}
                >
                  Sign in
                </button>
              </div>
            </div>

            {/* Right: product preview in phone frame */}
            <div className="home-preview-wrap">
              <div className="phone-frame">
                <div className="phone-notch" />
                <div className="home-preview-card">

                  {/* Status bar */}
                  <div className="phone-status-bar">
                    <span>9:41</span>
                    <div className="phone-status-icons">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="1" y="6" width="4" height="12" rx="1" opacity=".3"/><rect x="7" y="4" width="4" height="14" rx="1" opacity=".5"/><rect x="13" y="2" width="4" height="16" rx="1" opacity=".7"/><rect x="19" y="0" width="4" height="18" rx="1"/></svg>
                      <svg width="18" height="14" viewBox="0 0 28 14" fill="currentColor"><rect x="0" y="1" width="24" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="25" y="4.5" width="2.5" height="5" rx="1" opacity=".4"/><rect x="2" y="3" width="16" height="8" rx="1.5" fill="var(--color-brand)"/></svg>
                    </div>
                  </div>

                  {/* App header */}
                  <div className="home-preview-header">
                    <span style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-1)", color: "var(--color-text-primary)" }}>
                      Stewarding Change
                    </span>
                    <div className="home-preview-avatar">T</div>
                  </div>

                  {/* Status */}
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

                  {/* Monthly amount */}
                  <div style={{ marginBottom: "var(--s-3)" }}>
                    <div style={{ fontSize: "var(--fs-0)", color: "var(--color-text-muted)", marginBottom: "var(--s-1)" }}>
                      This month
                    </div>
                    <div style={{ fontSize: "var(--fs-5)", fontWeight: "var(--fw-bold)", color: "var(--color-brand)", lineHeight: 1.1 }}>
                      +$1.72
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="home-preview-txns">
                    {[
                      { name: "Coffee Shop", amt: "+$0.73" },
                      { name: "Gas Station",  amt: "+$0.41" },
                      { name: "Grocery Store", amt: "+$0.58" },
                      { name: "Restaurant",     amt: "+$0.22" },
                      { name: "Pharmacy",       amt: "+$0.37" },
                    ].map((t) => (
                      <div key={t.name} className="home-preview-txn">
                        <span style={{ fontSize: "var(--fs-0)", color: "var(--color-text-muted)" }}>{t.name}</span>
                        <span style={{ fontSize: "var(--fs-0)", color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}>{t.amt}</span>
                      </div>
                    ))}
                  </div>

                  <div className="home-preview-divider" />

                  {/* Mission progress */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--s-2)" }}>
                      <span style={{ fontSize: "var(--fs-0)", color: "var(--color-text-muted)" }}>Mission progress</span>
                      <span style={{ fontSize: "var(--fs-0)", color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}>64%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: "64%" }} />
                    </div>
                  </div>

                  <div className="home-preview-divider" />

                  {/* Weekly cap */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "var(--fs-0)", color: "var(--color-text-muted)" }}>Monthly cap</div>
                      <div style={{ fontSize: "var(--fs-2)", fontWeight: "var(--fw-semibold)", color: "var(--color-text-primary)" }}>$25.00</div>
                    </div>
                    <div style={{ fontSize: "var(--fs-0)", padding: "4px 10px", borderRadius: "var(--r-full)", background: "rgba(26, 158, 74, 0.08)", color: "var(--color-success)", fontWeight: "var(--fw-semibold)" }}>
                      $23.28 left
                    </div>
                  </div>

                  {/* Bottom tab bar */}
                  <div className="phone-tab-bar">
                    <div className="phone-tab is-active">
                      <div className="phone-tab-dot">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                      </div>
                      <span>Home</span>
                    </div>
                    <div className="phone-tab">
                      <div className="phone-tab-dot">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <span>Social</span>
                    </div>
                    <div className="phone-tab">
                      <div className="phone-tab-dot">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      </div>
                      <span>Settings</span>
                    </div>
                  </div>

                </div>
                <div className="phone-home-bar" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <div className="home-stats-bar reveal">
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
        <section className="steps-section reveal">
          <h2>How it works</h2>
          <p className="muted" style={{ textAlign: "center", margin: "-20px auto var(--s-7)", maxWidth: "48ch", fontSize: "var(--fs-2)", lineHeight: "var(--lh-relaxed)" }}>
            Three simple steps to start giving effortlessly.
          </p>

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
                body: "Select the congregation you want to give to. Every dollar goes directly to their active mission — not a general fund.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
                title: "Spend normally, give automatically",
                body: "Link your bank account and keep spending like you always do. Every purchase rounds up to the nearest dollar — those extra cents go straight to your church’s mission. A $4.20 coffee becomes $5.00, and the $0.80 difference is your donation.",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                title: "Watch your impact grow",
                body: "No guessing where your money goes. Your church shares mission updates, progress milestones, and video updates right in the app — so you can see the real difference your giving makes, in real time.",
              },
            ].map((f) => (
              <div key={f.title} className="home-feature-card">
                <div className="home-feature-icon">{f.icon}</div>
                <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "var(--fs-2)" }}>{f.title}</h4>
                <p className="muted" style={{ margin: 0, fontSize: "var(--fs-1)" }}>{f.body}</p>
              </div>
            ))}
          </div>

          <div className="tithe-calc-callout">
            <div className="tithe-calc-callout-text">
              <h4 style={{ margin: "0 0 var(--s-1)", fontSize: "var(--fs-2)" }}>
                Wondering what your tithe should be?
              </h4>
              <p className="muted" style={{ margin: 0, fontSize: "var(--fs-1)" }}>
                Use our free calculator to see your 10% tithe broken down monthly.
              </p>
            </div>
            <Link to="/tithe-calculator" className="btn btn-secondary">
              Try the Calculator
            </Link>
          </div>
        </section>


        {/* ── Trust line ── */}
        <div className="trust-line reveal" style={{ padding: "var(--s-5) var(--s-4) var(--s-10)" }}>
          <span className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Bank-grade security
          </span>
          <span className="trust-dot" />
          <span className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            100% tax-deductible
          </span>
          <span className="trust-dot" />
          <span className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Cancel any time
          </span>
          <span className="trust-dot" />
          <span className="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            No hidden fees
          </span>
        </div>

        {/* ── FAQs ── */}
        <section className="home-faq-section reveal">
          <button
            className="home-faq-toggle"
            onClick={() => setFaqOpen(!faqOpen)}
            aria-expanded={faqOpen}
          >
            <h2 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 28px)" }}>FAQs</h2>
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`home-faq-toggle-icon ${faqOpen ? "is-open" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className={`home-faq-body ${faqOpen ? "is-open" : ""}`}>
            <div className="tithe-faq-list">
              {faqs.map((faq, i) => (
                <div key={i} className={`tithe-faq-item ${openFaq === i ? "is-open" : ""}`}>
                  <button
                    className="tithe-faq-question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.q}</span>
                    <svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="tithe-faq-chevron"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="tithe-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ structured data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            }),
          }}
        />
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
