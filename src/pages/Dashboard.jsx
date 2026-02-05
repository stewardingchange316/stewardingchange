import { auth } from "../utils/auth";

export default function Dashboard() {
  const user = auth.getUser();
  const ob = auth.getOnboarding();

  const churchName = ob?.churchName ?? "Your church";
  const missionName = ob?.missionName ?? "Mission";
  const weeklyCap = ob?.weeklyCap ?? "No limit";

  // Demo numbers (later API)
  const goalFamilies = churchName.includes("Countryside") ? 120 : 90;
  const helped = churchName.includes("Countryside") ? 37 : 22;
  const active = churchName.includes("Countryside") ? 84 : 61;
  const pct = Math.min(100, Math.round((helped / goalFamilies) * 100));

  return (
    <div className="container">
      <div className="dashHead">
        <div className="muted">{churchName}</div>
        <h1 className="dashTitle">{missionName}</h1>
        <div className="dashWelcome">
          <div className="welcomeBig">Welcome,</div>
          <div className="welcomeEmail">{user?.email}</div>
        </div>
        <p className="muted">
          Your weekly giving cap is set to <b>{weeklyCap}</b>. This dashboard will show weekly updates, outcomes,
          and where funds go.
        </p>
      </div>

      <div className="dashGrid">
        <div className="panel">
          <div className="panelHead">
            <h2>This month’s goal</h2>
            <p className="muted">Help {goalFamilies} families through the {missionName}.</p>
          </div>
        </div>

        <div className="panel">
          <div className="panelHead">
            <h2>Progress so far</h2>
            <p className="muted">
              {helped} out of {goalFamilies} families helped this month.
            </p>
          </div>
          <div className="progressBar">
            <div className="progressFill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progressMeta">
            <span className="muted">{pct}%</span>
            <span className="muted">Active givers: {active}</span>
          </div>
        </div>

        <div className="panel">
          <div className="panelHead">
            <h2>Next weekly update</h2>
            <p className="muted">We’ll email a short, specific story + receipts-style breakdown of impact.</p>
          </div>
          <a className="link" href="#" onClick={(e) => e.preventDefault()}>
            Visit mission site →
          </a>
        </div>
      </div>
    </div>
  );
}
