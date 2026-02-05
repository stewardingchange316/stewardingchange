import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/auth";

function validatePassword(pw) {
  const min = pw.length >= 8;
  return {
    min,
    ok: min,
    message: min ? "" : "Password must be at least 8 characters.",
  };
}

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");

  const pwCheck = useMemo(() => validatePassword(pw), [pw]);
  const match = pw2.length === 0 ? true : pw === pw2;

  function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Please enter your email.");
    if (!pwCheck.ok) return setError(pwCheck.message);
    if (pw !== pw2) return setError("Passwords do not match.");

    // "Create account" (local demo)
    auth.login(email.trim().toLowerCase());

    // Step model:
    // step: 2 => needs church select
    auth.setOnboarding({ step: 2 });

    navigate("/onboarding/church", { replace: true });
  }

  return (
    <div className="container narrow">
      <div className="authCard">
        <div className="authHead">
          <h1>Create your account</h1>
          <p className="muted">Secure sign-in, simple onboarding, clear impact.</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label className="label">
            Password
            <input
              className="input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="At least 8 characters"
              type="password"
              autoComplete="new-password"
            />
            {!pwCheck.ok && pw.length > 0 && <div className="hint bad">{pwCheck.message}</div>}
            {pwCheck.ok && pw.length > 0 && <div className="hint good">Looks good.</div>}
          </label>

          <label className="label">
            Verify password
            <input
              className="input"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Re-enter password"
              type="password"
              autoComplete="new-password"
            />
            {pw2.length > 0 && !match && <div className="hint bad">Passwords must match.</div>}
          </label>

          {error && <div className="alert">{error}</div>}

          <button className="btn primary full" type="submit">
            Continue
          </button>

          <button className="btn ghost full" type="button" onClick={() => navigate("/signin")}>
            Already have an account? Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
