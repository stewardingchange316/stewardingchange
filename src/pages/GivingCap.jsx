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
    <div className="page">
      <div className="container-narrow stack-8">

        {/* Step Indicator */}
        <div className="kicker">
          <span className="dot" />
          Step 2 of 3
        </div>

        {/* Headline */}
        <div className="stack-3">
          <h1 className="page-title">
            Set your weekly giving cap
          </h1>

          <p className="page-subtitle">
            Choose the maximum amount you'd like your spare change to
            support your church each week. You remain in control at all times.
          </p>
        </div>

        {/* Cap Card */}
        <div className="glass card stack-6">

          {/* Big Value Display */}
          <div className="text-center">
            {weeklyCap === null ? (
              <div className="h2">No limit</div>
            ) : (
              <div className="h2">
                ${weeklyCap}
                <span className="muted small"> / week</span>
              </div>
            )}
          </div>

          {/* Slider */}
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={weeklyCap ?? 50}
            disabled={weeklyCap === null}
            onChange={(e) => setWeeklyCap(Number(e.target.value))}
            className="sc-giving-slider"
          />

          {/* Presets */}
          <div className="row center">
            {PRESETS.map((amount) => (
              <button
                key={amount}
                className={`btn btn-secondary btn-sm ${
                  weeklyCap === amount ? "btn-primary" : ""
                }`}
                onClick={() => setWeeklyCap(amount)}
              >
                ${amount}
              </button>
            ))}

            <button
              className={`btn btn-secondary btn-sm ${
                weeklyCap === null ? "btn-primary" : ""
              }`}
              onClick={setNoLimit}
            >
              No limit
            </button>
          </div>
        </div>

        {/* Tax Deductible Trust Block */}
        <div className="glass card-tight stack-3">
          <strong>100% Tax-Deductible Donations</strong>
          <div className="small">
            Every cent given through Stewarding Change is a tax-deductible
            contribution to your selected church. Detailed giving statements
            are delivered weekly, with a consolidated annual statement
            provided at year end.
          </div>
        </div>

        {/* Continue Section */}
        <div className="row-between mt-6">
          <div className="muted small">
            Next: Securely connect your bank account
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>

      </div>
    </div>
  );
}
