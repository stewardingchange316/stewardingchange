// web/src/pages/Dashboard.jsx
import { getUser, signOut } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();
  const user = getUser();

  // Redirect if not signed in
  if (!user) {
    nav("/signin");
    return null;
  }

  // ✅ NEW LOGIC (does NOT change UI)
  let onboarding = null;
  const raw = localStorage.getItem("sc_onboarding");

  if (raw) {
    try {
      onboarding = JSON.parse(raw);
    } catch {
      onboarding = null;
    }
  }

  const churchName = onboarding?.church?.name || "Not selected";

  const givingCap =
    onboarding?.weeklyCap === null
      ? "No limit"
      : typeof onboarding?.weeklyCap === "number"
      ? `$${onboarding.weeklyCap} per week`
      : "Not set";

  const bankStatus =
    onboarding?.bankConnected === true
      ? "Connected"
      : onboarding?.bankConnected === false
      ? "Not connected"
      : "Pending";

  return (
    <div className="dashboard">
      <div className="dashboard-header">
     <div className="welcome-pill">
  <h1>
    Welcome: Stewarding {user.firstName ? user.firstName : user.email}
  </h1>
</div>


        <button
          onClick={() => {
            signOut();
            nav("/");
          }}
        >
          Sign out
        </button>
      </div>

      <section className="card">
        <h3>Church</h3>
        <p>{churchName}</p>
      </section>

      <section className="card">
        <h3>Giving Cap</h3>
        <p>{givingCap}</p>
      </section>

      <section className="card">
        <h3>Bank Connected</h3>
        <p>{bankStatus}</p>
      </section>
    </div>
  );
}
