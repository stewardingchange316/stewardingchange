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
    // Supabase puts session in URL hash
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/", { replace: true });
        return;
      }
      setReady(true);
    };

    checkSession();
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
              style={{ paddingRight: "40px" }}
            />
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
