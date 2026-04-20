import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AddChurch() {
  const [churchName, setChurchName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: insertError } = await supabase
      .from("church_requests")
      .insert({
        church_name: churchName,
        city: city || null,
        state: state || null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        message: message || null,
      });

    setLoading(false);

    if (insertError) {
      setError("Something went wrong. Please try again or email us at terence@stewardingchange.org.");
      return;
    }

    setSent(true);
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link to="/" className="landing-brand">
          <div className="landing-brand-mark">
            <img src="/logo.png" alt="Stewarding Change" />
          </div>
          <span>Stewarding Change</span>
        </Link>
        <div className="landing-nav-cta">
          <Link to="/" className="landing-btn-sm">Home</Link>
        </div>
      </nav>

      <main className="help-page">
        <div className="help-inner">
          <h1>Add your church</h1>
          <p className="help-sub">
            Want your church on Stewarding Change? Fill out the form below and we'll
            reach out to get things set up. It's free — no cost to the church or its members.
          </p>

          {sent ? (
            <div className="help-success">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="rgba(107,240,178,0.12)" />
                <path d="M15 24l6 6 12-12" stroke="#6BF0B2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>Request submitted</h3>
              <p>We'll be in touch soon to get your church set up. Thank you for your interest.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="help-form">
              <div className="form-group">
                <label>Church name</label>
                <input
                  type="text"
                  placeholder="e.g. Countryside Christian"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="Clearwater"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    placeholder="FL"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Your name</label>
                <input
                  type="text"
                  placeholder="First and last name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Your email</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone <span style={{ color: "var(--ink-mute)", fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Anything else? <span style={{ color: "var(--ink-mute)", fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  placeholder="Tell us about your church, your role, or any questions"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-wide"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit request"}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Link to="/" className="landing-brand" style={{ fontSize: "15px" }}>
            <div className="landing-brand-mark" style={{ width: "24px", height: "24px" }}>
              <img src="/logo.png" alt="" />
            </div>
            Stewarding Change
          </Link>
          <div className="landing-footer-links">
            <Link to="/faq">FAQ</Link>
            <Link to="/about">About</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          <div className="landing-footer-copy">
            &copy; {new Date().getFullYear()} Stewarding Change
          </div>
        </div>
      </footer>
    </div>
  );
}
