import { Link } from "react-router-dom";

export default function Home() {
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
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "14px", opacity: 0.7 }}>
          Countryside Christian Church
        </div>

        <div style={{ fontSize: "18px", fontWeight: 600 }}>
          Giving to the Helping Hands Foundation
        </div>
      </div>

      <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>
        Stewarding Change
      </h1>

      <p style={{ fontSize: "18px", maxWidth: "520px", opacity: 0.85 }}>
        A simple way for our church family to give consistently and receive
        weekly updates on how generosity is making an impact.
      </p>

      <div style={{ marginTop: "32px", display: "flex", gap: "16px" }}>
        <Link
          to="/signup"
          style={{
            padding: "14px 24px",
            backgroundColor: "#4ade80",
            color: "#07130b",
            borderRadius: "10px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Create Account
        </Link>

        <Link
          to="/login"
          style={{
            padding: "14px 24px",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "10px",
            color: "#e7e9ee",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
