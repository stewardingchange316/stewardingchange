import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/auth";
import { Card } from "../components/Card";

export default function GivingCap() {
  const navigate = useNavigate();
  const ob = auth.getOnboarding();

  const [cap, setCap] = useState(ob?.weeklyCap ?? "");
  const presets = ["No limit", "$10", "$25", "$50", "$100"];

  const canContinue = useMemo(() => cap !== "", [cap]);

  function next() {
    if (!canContinue) return;

    auth.setOnboarding({
      ...ob,
      step: 4,
      weeklyCap: cap,
    });

    navigate("/onboarding/bank", { replace: true });
  }

  return (
    <div className="container narrow">
      <div className="stepHead">
        <span className="pill">Step 2 of 3</span>
        <h1 className="stepTitle">Set your weekly giving cap</h1>
        <p className="muted">
          Your cap limits automated giving for the week. You can change this anytime.
        </p>
      </div>

      <div className="panel">
        <div className="grid2">
          {presets.map((p) => (
            <Card
              key={p}
              role="button"
              onClick={() => setCap(p)}
              className={cap === p ? "selected" : ""}
            >
              <div className="cardTitle">{p}</div>
              <div className="muted">
                {p === "No limit" ? "Give as needs arise." : "A simple weekly cap."}
              </div>
            </Card>
          ))}
        </div>

        <div className="formRow">
          <label className="label">
            Or enter a custom cap
            <input
              className="input"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              placeholder='e.g. "$15" or "No limit"'
            />
          </label>
        </div>

        <div className="actions">
          <button className="btn ghost" onClick={() => navigate("/onboarding/church")}>
            Back
          </button>
          <button className="btn primary" onClick={next} disabled={!canContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
