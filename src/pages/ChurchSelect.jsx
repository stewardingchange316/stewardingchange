import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOnboarding, setOnboarding } from "../utils/auth";

export default function ChurchSelect() {
  const navigate = useNavigate();
  const onboarding = getOnboarding() || {};

  const churches = useMemo(
    () => [
      {
        id: "countryside",
        name: "Countryside Christian Church",
        mission: "Helping Hands Foundation",
        goal: "120 families",
        cadence: "Weekly",
      },
      {
        id: "grace",
        name: "Grace Community Church",
        mission: "Local Food Relief",
        goal: "90 families",
        cadence: "Weekly",
      },
    ],
    []
  );

  const [selected, setSelected] = useState(onboarding.churchId || null);

function continueNext() {
  if (!selected) return;

const updated = {
  ...onboarding,
  step: "cap",
  churchId: selected,
};

localStorage.setItem("sc_onboarding", JSON.stringify(updated));
setOnboarding(updated);
navigate("/giving-cap");

}

  return (
    <div className="onboarding-page">
      {/* Step indicator */}
      <div className="onboarding-step">Step 1 of 3</div>

      <h1>Select your church</h1>
      <p className="onboarding-subtext">
        This sets your dashboard context. You can add more churches later.
      </p>

      <div className="church-list">
        {churches.map((church) => {
          const isSelected = selected === church.id;

          return (
            <div
              key={church.id}
              className={`church-card ${isSelected ? "selected" : ""}`}
              onClick={() => setSelected(church.id)}
            >
              <div className="church-card-header">
                <h3>{church.name}</h3>
                {isSelected && <span className="checkmark">✓</span>}
              </div>

              <p className="church-mission">{church.mission}</p>

              <div className="church-meta">
                <div>
                  <span className="label">Monthly goal</span>
                  <strong>{church.goal}</strong>
                </div>
                <div>
                  <span className="label">Updates</span>
                  <strong>{church.cadence}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-next">
          <div>
            <strong>Next:</strong> set your weekly giving cap
            <div className="muted">
              You stay in control. This can be changed anytime.
            </div>
          </div>

          <button
            className="primary"
            disabled={!selected}
            onClick={continueNext}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

}