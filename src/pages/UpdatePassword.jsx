import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function UpdatePassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

 useEffect(() => {
  const init = async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      setReady(true);
      return;
    }

    // Give Supabase a moment to process URL hash
    setTimeout(async () => {
      const { data: retry } = await supabase.auth.getSession();

      if (retry.session) {
        setReady(true);
      } else {
        navigate("/", { replace: true });
      }
    }, 500);
  };

  init();
}, [navigate]);


  async function handleUpdate(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Optional: mark onboarding as done if needed
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase
        .from("users")
        .update({ onboarding_step: "done" })
        .eq("id", data.user.id);
    }

    navigate("/dashboard", { replace: true });
  }

  if (!ready) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Verifying reset link...
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Set New Password</h1>
        <p className="auth-subtitle">
          Enter a new secure password below.
        </p>

        <form onSubmit={handleUpdate}>
         <label>New Password</label>
<div style={{ position: "relative" }}>
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    autoComplete="new-password"
    style={{ paddingRight: "42px" }}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0,
      display: "flex",
      alignItems: "center",
      opacity: 0.8,
    }}
    aria-label="Toggle password visibility"
  >
    {showPassword ? (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.42 1.47-2.73 2.57-3.86M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.08 5.08M1 1l22 22" />
      </svg>
    ) : (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
</div>

<label>Confirm Password</label>
<input
  type={showPassword ? "text" : "password"}
  value={confirm}
  onChange={(e) => setConfirm(e.target.value)}
  required
  autoComplete="new-password"
/>


          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="primary"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
