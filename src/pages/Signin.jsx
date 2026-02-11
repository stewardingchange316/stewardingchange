import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, getNextOnboardingPath } from "../utils/auth";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    signIn(email, pw);
    nav(getNextOnboardingPath());
  }

  return (
    <div className="auth-page">
      <h1>Sign in</h1>

      <form onSubmit={submit} className="auth-form">
        <input
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
        <button type="submit" className="primary">
          Sign in
        </button>
      </form>
    </div>
  );
}
