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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const resetAuthState = async () => {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    };
    resetAuthState();
  }, []);

  useEffect(() => {
    const checkSessionAndEnsureProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (user && window.location.pathname !== "/verified") {
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

  // 🔒 Tightened but safe submit gating
  const canSubmit =
    firstName &&
    lastName &&
    phone &&
    email &&
    password &&
    confirm &&
    acceptedTerms &&
    passwordStrength >= 3 &&
    password === confirm &&
    isValidEmail(email);

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

    if (!acceptedTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        },
      });

      if (authError) throw authError;

      setShowConfirmModal(true);

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

  const EyeIcon = ({ open }) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.6 }}
    >
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.77 21.77 0 015.06-6.94" />
          <path d="M1 1l22 22" />
        </>
      )}
    </svg>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
  <h2 className="brand-header" style={{ marginBottom: 8 }}>
    Stewarding Change
  </h2>

  <h1 style={{ marginBottom: 8 }}>
    Create your account
  </h1>

  <p className="auth-subtitle">
    Secure sign-in, simple onboarding, clear impact.
  </p>
</div>


        <form onSubmit={handleSubmit}>
          <label>First Name</label>
          <input
            type="text"
            autoFocus
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <label>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <label>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          {/* PASSWORD */}
          <label>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) =>
                setCapsLock(e.getModifierState("CapsLock"))
              }
              autoComplete="new-password"
              style={{ paddingRight: "40px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer"
              }}
            >
              <EyeIcon open={showPassword} />
            </span>
          </div>

          {capsLock && (
            <div style={{ color: "#f59e0b", fontSize: 12 }}>
              Caps Lock is ON
            </div>
          )}

          <div className={`password-strength s-${passwordStrength}`}>
            Strength: <strong>{strengthLabel}</strong>
          </div>

          {/* Live password checklist */}
          <ul style={{ fontSize: 12, paddingLeft: 16 }}>
            <li style={{ color: password.length >= 8 ? "#16a34a" : "#9ca3af" }}>
              At least 8 characters
            </li>
            <li style={{ color: /[A-Z]/.test(password) ? "#16a34a" : "#9ca3af" }}>
              Contains uppercase letter
            </li>
            <li style={{ color: /[0-9]/.test(password) ? "#16a34a" : "#9ca3af" }}>
              Contains a number
            </li>
            <li style={{ color: /[^A-Za-z0-9]/.test(password) ? "#16a34a" : "#9ca3af" }}>
              Contains special character
            </li>
          </ul>

          {/* CONFIRM PASSWORD */}
          <label>Verify password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              style={{ paddingRight: "40px" }}
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer"
              }}
            >
              <EyeIcon open={showConfirm} />
            </span>
          </div>

          {confirm && (
            <div
              style={{
                fontSize: 12,
                marginTop: 4,
                color: password === confirm ? "#16a34a" : "#dc2626",
              }}
            >
              {password === confirm
                ? "Passwords match"
                : "Passwords do not match"}
            </div>
          )}

          {/* TERMS */}
   {/* TERMS */}
<div
  style={{
    marginTop: 16,
    textAlign: "center"
  }}
>
  <label
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      cursor: "pointer"
    }}
  >
    <input
      type="checkbox"
      checked={acceptedTerms}
      onChange={(e) => setAcceptedTerms(e.target.checked)}
    />

    <span style={{ fontSize: 14, maxWidth: 300 }}>
      I agree to the{" "}
      <Link to="/terms" target="_blank" className="link-button">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link to="/privacy" target="_blank" className="link-button">
        Privacy Policy
      </Link>.
    </span>
  </label>
</div>


          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary" disabled={!canSubmit || submitting}>
            {submitting ? "Creating account…" : "Continue"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/">Sign in</Link>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title">Check Your Email</h2>
            <p className="modal-subtitle">
              A confirmation link has been sent to <strong>{email}</strong>.
              <br /><br />
              Please click the link to verify your account.
              If you don’t see it, check your spam folder.
            </p>

            <button
              className="btn btn-primary btn-wide"
              onClick={() => setShowConfirmModal(false)}
            >
              Back to Signup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
