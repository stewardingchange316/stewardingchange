import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    // TEMP: store signup locally (we will centralize this later)
    localStorage.setItem(
      "stewardingChangeUser",
      JSON.stringify({ email })
    );

    navigate("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f14",
        color: "#e7e9ee",
        padding: "48px",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont',
      }}
    >
      <h1 style={{ fontSize: "40px", marginBottom: "12px" }}>
        Create your account
      </h1>

      <p style={{ marginBottom: "24px", opacity: 0.85 }}>
        Countryside Christian Church · Helping Hands Foundation
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: "420px" }}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            borderRadius: "10px",
            border: "none",
            marginBottom: "16px",
          }}
        />

        {error && (
          <div style={{ color: "#fca5a5", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#4ade80",
            color: "#07130b",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
