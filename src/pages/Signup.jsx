import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp, setOnboarding } from "../utils/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

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
    firstName.length > 0 &&
    lastName.length > 0 &&
    phone.length > 0 &&
    email.length > 0 &&
    password.length > 0 &&
    confirm.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !phone) {
      setError("Please complete all required fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (passwordStrength < 3) {
      setError(
        "Password must be at least 8 characters and include a capital letter and number."
      );
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      await signUp({
        firstName,
        lastName,
        phone,
        email,
        password,
      });

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

        <h2 className="brand-header">Stewarding Change</h2>

        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Secure sign-in, simple onboarding, clear impact.
        </p>

        <form onSubmit={handleSubmit}>
          <label>First Name</label>
          <input
            type="text"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <label>Last Name</label>
          <input
            type="text"
            placeholder="Smith"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="(555) 555-5555"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

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
