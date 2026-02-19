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
  const [capsLock, setCapsLock] = useState(false);

  // 🔥 Password strength logic
  function getStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: "Weak", color: "#dc2626" };
    if (score === 2) return { label: "Fair", color: "#f59e0b" };
    if (score === 3) return { label: "Good", color: "#3b82f6" };
    return { label: "Strong", color: "#16a34a" };
  }

  const strength = getStrength(password);

  // 🔐 Ensure recovery session exists
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setReady(true);
        return;
      }

      // Give Supabase time to process URL hash
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

    // Preserve your onboarding update logic
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
          {/* NEW PASSWORD */}
          <label>New Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) =>
                setCapsLock(e.getModifierState("CapsLock"))
              }
              required
              autoComplete="new-password"
              autoFocus
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
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Caps lock warning */}
          {capsLock && (
            <div
              style={{
                color: "#f59e0b",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Caps Lock is ON
            </div>
          )}

          {/* Strength meter */}
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                height: 6,
                borderRadius: 6,
                background: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    (password.length / 12) * 100,
                    100
                  )}%`,
                  height: "100%",
                  background: strength.color,
                  transition: "all 0.3s ease",
                }}
              />
            </div>

            <div
              style={{
                fontSize: 12,
                marginTop: 4,
                color: strength.color,
                fontWeight: 500,
              }}
            >
              Strength: {strength.label}
            </div>
          </div>

          {/* Requirements checklist */}
          <ul
            style={{
              fontSize: 12,
              marginTop: 8,
              paddingLeft: 16,
            }}
          >
            <li
              style={{
                color:
                  password.length >= 8
                    ? "#16a34a"
                    : "#9ca3af",
              }}
            >
              At least 8 characters
            </li>
            <li
              style={{
                color:
                  /[A-Z]/.test(password)
                    ? "#16a34a"
                    : "#9ca3af",
              }}
            >
              Contains uppercase letter
            </li>
            <li
              style={{
                color:
                  /[0-9]/.test(password)
                    ? "#16a34a"
                    : "#9ca3af",
              }}
            >
              Contains a number
            </li>
            <li
              style={{
                color:
                  /[^A-Za-z0-9]/.test(password)
                    ? "#16a34a"
                    : "#9ca3af",
              }}
            >
              Contains special character
            </li>
          </ul>

          {/* CONFIRM PASSWORD */}
          <label style={{ marginTop: 16 }}>
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />

          {/* Match indicator */}
          {confirm && (
            <div
              style={{
                fontSize: 12,
                marginTop: 4,
                color:
                  password === confirm
                    ? "#16a34a"
                    : "#dc2626",
              }}
            >
              {password === confirm
                ? "Passwords match"
                : "Passwords do not match"}
            </div>
          )}

          {error && (
            <div className="auth-error">{error}</div>
          )}

          <button
            type="submit"
            className="primary"
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
