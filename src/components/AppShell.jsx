import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../utils/auth";

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const authed = auth.isAuthenticated();

  const showAuthButtons =
    !authed && (location.pathname === "/" || location.pathname === "/signin" || location.pathname === "/signup");

  function handleBrandClick() {
    if (authed) navigate("/dashboard");
    else navigate("/");
  }

  function handleSignOut() {
    auth.logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={handleBrandClick}>
          <span className="logoDot" />
          <span className="brandText">
            <span className="brandName">Stewarding Change</span>
            <span className="brandTag">Giving that feels personal — updates that feel real</span>
          </span>
        </button>

        <div className="topbarRight">
          {showAuthButtons && (
            <>
              <button className="btn ghost" onClick={() => navigate("/signin")}>
                Sign in
              </button>
              <button className="btn primary" onClick={() => navigate("/signup")}>
                Create account
              </button>
            </>
          )}

          {authed && (
            <button className="btn ghost" onClick={handleSignOut}>
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footerBar">
        <span>© {new Date().getFullYear()} Stewarding Change</span>
        <span className="muted">Built for clarity, trust, and impact.</span>
      </footer>
    </div>
  );
}
