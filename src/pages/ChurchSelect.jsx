import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/auth";
import { Card } from "../components/Card";

export default function ChurchSelect() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);

  const churches = [
    { id: "countryside", name: "Countryside Christian Church", mission: "Helping Hands Foundation", goal: "120 families", cadence: "Weekly" },
    { id: "grace", name: "Grace Community Church", mission: "Local Food Relief", goal: "90 families", cadence: "Weekly" },
  ];

  const selected = churches.find((c) => c.id === selectedId);

  function continueNext() {
    if (!selected) return;

    auth.setOnboarding({
      step: 3,
      churchId: selected.id,
      churchName: selected.name,
      missionName: selected.mission,
    });

    navigate("/onboarding/cap", { replace: true });
  }

  return (
    <div className="container">
      <div className="stepHead">
        <span className="pill">Step 1 of 3</span>
        <h1 className="stepTitle">Select your church</h1>
        <p className="muted">This sets your dashboard context. You can expand to more churches later.</p>
      </div>

      <div className="stack">
        {churches.map((c) => (
          <Card
            key={c.id}
            role="button"
            onClick={() => setSelectedId(c.id)}
            className={selectedId === c.id ? "selected" : ""}
          >
            <div className="cardRow">
              <div>
                <div className="cardTitle">{c.name}</div>
                <div className="cardSub">{c.mission}</div>
              </div>
              <div className="cardMeta">
                <div>
                  <div className="metaLabel">Monthly goal</div>
                  <div className="metaValue">{c.goal}</div>
                </div>
                <div>
                  <div className="metaLabel">Updates</div>
                  <div className="metaValue">{c.cadence}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="nextBar">
        <div>
          <div className="nextTitle">Next: set your weekly giving cap</div>
          <div className="muted">You stay in control. This can be changed anytime.</div>
        </div>

        <button className="btn primary" disabled={!selectedId} onClick={continueNext}>
          Continue
        </button>
      </div>
    </div>
  );
}
