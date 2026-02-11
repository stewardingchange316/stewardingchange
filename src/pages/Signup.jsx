import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp, setOnboarding } from "../utils/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel =
    passwordStrength <= 1
      ? "Weak"
      : passwordStrength === 2
      ? "Okay"
      : passwordStrength === 3
      ? "Strong"
      : "Very strong";

  const canSubmit =
    email &&
    password &&
    confirm &&
    password === confirm &&
    passwordStrength >= 3;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError(
        "Password must be at least 8 characters and include a number and capital letter."
      );
      return;
    }

    try {
      setSubmitting(true);

      // create account
      await signUp(email, password);

      // initialize onboarding flow
      setOnboarding({ step: "church" });

      navigate("/church-select");
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Secure sign-in, simple onboarding, clear impact.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <div className={`password-strength s-${passwordStrength}`}>
            Strength: <strong>{strengthLabel}</strong>
          </div>

          <label>Verify password</label>
          <input
            type="password"
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="primary"
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Creating account…" : "Continue"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
