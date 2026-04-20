import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Help() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: insertError } = await supabase
      .from("contact_submissions")
      .insert({ name, email, message });

    setLoading(false);

    if (insertError) {
      setError("Something went wrong. Please try again or email us directly.");
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
          <h1>Contact us</h1>
          <p className="help-sub">
            Have a question, issue, or just want to say hello? Fill out the form below
            or email us directly at{" "}
            <a href="mailto:terence@stewardingchange.org" className="about-email">
              terence@stewardingchange.org
            </a>
          </p>

          {sent ? (
            <div className="help-success">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="rgba(107,240,178,0.12)" />
                <path d="M15 24l6 6 12-12" stroke="#6BF0B2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3>Message sent</h3>
              <p>We'll get back to you as soon as we can. Thank you for reaching out.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="help-form">
              <div className="form-group">
                <label>Your name</label>
                <input
                  type="text"
                  placeholder="First and last name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                <label>Message</label>
                <textarea
                  placeholder="How can we help?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-wide"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send message"}
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
