import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PRESETS = [10, 25, 50];

export default function GivingCap() {
  const navigate = useNavigate();
  const [weeklyCap, setWeeklyCap] = useState(25);

  function setNoLimit() {
    setWeeklyCap(null);
  }

  function handleContinue() {
    const raw = localStorage.getItem("sc_onboarding");
    if (!raw) return;

    const data = JSON.parse(raw);

    const updated = {
      ...data,
      weeklyCap,
      step: "bank",
    };

    localStorage.setItem("sc_onboarding", JSON.stringify(updated));
    navigate("/bank");
  }

  return (
    <div className="page onboarding-page">
      <div className="container narrow">
        <div className="eyebrow">Step 2 of 3</div>

        <h1 className="page-title">
          Set your weekly giving cap
        </h1>

        <p className="subtitle">
          You stay in control. This can be changed at any time.
        </p>

        <div className="card glass">
          <div className="cap-hero">
            {weeklyCap === null ? (
              <span className="cap-value">No limit</span>
            ) : (
              <>
                <span className="cap-value">${weeklyCap}</span>
                <span className="cap-unit">per week</span>
              </>
            )}
          </div>

          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={weeklyCap ?? 200}
            disabled={weeklyCap === null}
            onChange={(e) => setWeeklyCap(Number(e.target.value))}
            className="sc-giving-slider"
          />

          <div className="pill-row">
            {PRESETS.map((amount) => (
              <button
                key={amount}
                className={`pill ${
                  weeklyCap === amount ? "active" : ""
                }`}
                onClick={() => setWeeklyCap(amount)}
              >
                ${amount}
              </button>
            ))}

            <button
              className={`pill ${
                weeklyCap === null ? "active" : ""
              }`}
              onClick={setNoLimit}
            >
              No limit
            </button>
          </div>
        </div>

        <div className="next-row spaced">
          <div className="next-copy">
            <strong>Next:</strong> Connect your bank
            <span>Securely link your account with Plaid.</span>
          </div>

          <button
            className="btn-primary btn-rounded"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
