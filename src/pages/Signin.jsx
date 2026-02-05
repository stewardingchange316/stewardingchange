import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/auth";

export default function Signin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState(""); // demo only
  const [error, setError] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Please enter your email.");
    if (!pw.trim()) return setError("Please enter your password.");

    auth.login(email.trim().toLowerCase());

    const ob = auth.getOnboarding();
    if (!ob?.step || ob.step < 3) return navigate("/onboarding/church", { replace: true });
    if (ob.step === 3) return navigate("/onboarding/cap", { replace: true });
    if (ob.step === 4) return navigate("/onboarding/bank", { replace: true });

    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="container narrow">
      <div className="authCard">
        <div className="authHead">
          <h1>Sign in</h1>
          <p className="muted">Welcome back — pick up right where you left off.</p>
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
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="alert">{error}</div>}

          <button className="btn primary full" type="submit">
            Sign in
          </button>

          <button className="btn ghost full" type="button" onClick={() => navigate("/signup")}>
            Need an account? Create one
          </button>
        </form>
      </div>
    </div>
  );
}
