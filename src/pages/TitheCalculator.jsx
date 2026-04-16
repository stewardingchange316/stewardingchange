import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import WaveBackground from "../components/WaveBackground";

export default function TitheCalculator() {
  const [salary, setSalary] = useState("");

  useEffect(() => {
    document.title = "Tithe Calculator — How Much Should I Tithe? | Stewarding Change";
  }, []);
  const [result, setResult] = useState(null);

  function calculate(e) {
    e.preventDefault();
    const yearly = parseFloat(salary.replace(/,/g, ""));
    if (!yearly || yearly <= 0) return;

    const tithe10 = yearly * 0.1;
    setResult({
      yearly: tithe10,
      monthly: tithe10 / 12,
      weekly: tithe10 / 52,
    });
  }

  function fmt(n) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  }

  return (
    <div className="bg-wrap">
      <WaveBackground />

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
          <Link to="/" className="header-nav-link">
            Home
          </Link>
        </div>
      </header>

      <main>
        <section className="hero" style={{ minHeight: 0, paddingTop: "var(--s-10)", paddingBottom: "var(--s-10)" }}>
          <div className="tithe-calc-wrap">
            <h1 className="tithe-calc-title">Tithe Calculator</h1>

            <p className="tithe-calc-subtitle">
              Enter your estimated yearly income to see what a biblical tithe (10%) looks like
              broken down monthly and yearly.
            </p>

            <form onSubmit={calculate} className="tithe-calc-form">
              <div className="tithe-calc-input-wrap">
                <span className="tithe-calc-dollar">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="75,000"
                  value={salary}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setSalary(raw ? parseInt(raw, 10).toLocaleString("en-US") : "");
                  }}
                  className="tithe-calc-input"
                />
                <span className="tithe-calc-per">/ year</span>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-wide">
                Calculate My Tithe
              </button>
            </form>

            {result && (
              <div className="tithe-calc-results">
                <div className="tithe-calc-result-card tithe-calc-result-main">
                  <div className="tithe-calc-result-label">Monthly tithe</div>
                  <div className="tithe-calc-result-amount">{fmt(result.monthly)}</div>
                </div>
                <div className="tithe-calc-result-card">
                  <div className="tithe-calc-result-label">Monthly</div>
                  <div className="tithe-calc-result-amount">{fmt(result.monthly)}</div>
                </div>
                <div className="tithe-calc-result-card">
                  <div className="tithe-calc-result-label">Yearly (10%)</div>
                  <div className="tithe-calc-result-amount">{fmt(result.yearly)}</div>
                </div>
              </div>
            )}

            {result && (
              <p className="tithe-calc-cta">
                With Stewarding Change, your spare change adds up toward that goal automatically — and every dollar is tax-deductible.{" "}
                <Link to="/signup" className="link-brand">Start giving today.</Link>
              </p>
            )}

            <div className="tithe-calc-disclaimer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                This calculator is a personal reference tool only. We do not store, save, or transmit
                your salary information — it never leaves your device. A 10% tithe is a biblical guideline,
                not a requirement. You are free to give any amount you're comfortable with.
              </span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
