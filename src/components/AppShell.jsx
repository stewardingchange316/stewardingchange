// src/AppShell.jsx
import { Link, useNavigate } from "react-router-dom";
import { getUser, isAuthenticated, logout } from "./utils/auth";

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const user = getUser();

  function handleSignOut() {
    logout();
    navigate("/signin?mode=signin", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Link to="/" className="brand-link">Stewarding Change</Link>
          <div className="tagline">Giving that feels personal — updates that feel real</div>
        </div>

        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          {authed && <Link to="/dashboard" className="nav-link">Dashboard</Link>}

          {authed ? (
            <button className="btn" type="button" onClick={handleSignOut}>
              Sign out ({user?.email || "account"})
            </button>
          ) : (
            <Link to="/signin?mode=signin" className="btn">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main className="main">{children}</main>
    </div>
  );
}
