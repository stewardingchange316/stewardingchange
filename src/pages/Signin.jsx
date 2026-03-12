import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    nav("/dashboard");
  }

  return (
    <div className="auth-page">
      <h1>Sign in</h1>

      <form onSubmit={submit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Signing in\u2026" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
