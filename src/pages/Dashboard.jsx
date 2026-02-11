import { getUser, signOut } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const user = getUser();
  const nav = useNavigate();

  if (!user) {
    nav("/signin");
    return null;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome {user.email}</h1>
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
        <p>Not selected</p>
      </section>

      <section className="card">
        <h3>Giving Cap</h3>
        <p>Not set</p>
      </section>

      <section className="card">
        <h3>Bank Connected</h3>
        <p>Pending</p>
      </section>
    </div>
  );
}
