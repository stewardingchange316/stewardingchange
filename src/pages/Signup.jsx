import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

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
  const [successMessage, setSuccessMessage] = useState("");

  // If user lands here after confirming email
  useEffect(() => {
    const checkSessionAndEnsureProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (user) {
        // 🔥 Ensure public.users row exists
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existing) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || null,
            church_id: null,
            weekly_cap: null,
            bank_connected: false
          });
        }

        navigate("/church-select", { replace: true });
      }
    };

    checkSessionAndEnsureProfile();
  }, [navigate]);

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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
    firstName &&
    lastName &&
    phone &&
    email &&
    password &&
    confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

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

      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://stewardingchange.org/auth/callback",
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        },
      });

      if (authError) throw authError;

      setSuccessMessage(
        "Account created! Please check your email to confirm your account before signing in."
      );

      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirm("");

    } catch (err) {
      if (
        err.message?.includes("already registered") ||
        err.message?.includes("already exists")
      ) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(err.message || "Unable to create account.");
      }
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

          {error && (
            <div className="auth-error">
              {error}
              {error.includes("already registered") && (
                <div style={{ marginTop: "8px" }}>
                  <Link to="/" style={{ textDecoration: "underline" }}>
                    Click here to sign in
                  </Link>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success mt-4">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            className="primary"
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Creating account…" : "Continue"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
