import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <section className="hero">
        <div className="eyebrow">STEWARding CHANGE</div>
        <h1 className="heroTitle">Give consistently. See the impact.</h1>
        <p className="heroSub">
          Create an account, pick your church and mission, set a weekly giving cap, and receive real updates —
          families helped, meals funded, and where generosity goes.
        </p>

        <div className="heroCtas">
          <button className="btn primary" onClick={() => navigate("/signup")}>
            Create account
          </button>
          <button className="btn ghost" onClick={() => navigate("/signin")}>
            Sign in
          </button>
        </div>

        <div className="trustLine">
          <span className="dot" />
          <span>Designed for clarity, trust, and accountability — like modern fintech, built for giving.</span>
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <h2>How it works</h2>
          <p className="muted">Transparent giving with real-world outcomes</p>
        </div>

        <div className="grid2">
          <div className="miniCard">
            <div className="miniLabel">Choose a church</div>
            <div className="miniValue">Local & trusted</div>
          </div>
          <div className="miniCard">
            <div className="miniLabel">Set a cap</div>
            <div className="miniValue">You stay in control</div>
          </div>
          <div className="miniCard">
            <div className="miniLabel">Get updates</div>
            <div className="miniValue">Weekly impact</div>
          </div>
          <div className="miniCard">
            <div className="miniLabel">See results</div>
            <div className="miniValue">Families helped</div>
          </div>
        </div>

        <div className="progressRow">
          <div className="progressMeta">
            <span className="muted">Example progress</span>
            <span className="muted">—</span>
          </div>
          <div className="progressBar">
            <div className="progressFill" style={{ width: "62%" }} />
          </div>
          <div className="muted">Sign in to see real data for your church and mission.</div>
        </div>
      </section>
    </div>
  );
}
