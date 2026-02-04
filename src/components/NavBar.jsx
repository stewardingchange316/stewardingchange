import { Link, useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("stewardingChangeUser"));

  function logout() {
    localStorage.removeItem("stewardingChangeUser");
    navigate("/signup");
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        backgroundColor: "#0b0f14",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div>
        <div style={{ fontWeight: 700 }}>Stewarding Change</div>
        <div style={{ fontSize: "12px", opacity: 0.7 }}>
          Countryside Christian Church
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        {user && (
          <>
            <Link to="/dashboard" style={{ color: "#e7e9ee" }}>
              Dashboard
            </Link>
            <button
              onClick={logout}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#e7e9ee",
                padding: "6px 12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
