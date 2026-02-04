export default function Dashboard() {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("stewardingChangeUser"));
  } catch {
    user = null;
  }

  // --- Impact model (MVP-safe, replace with real data later) ---
  const monthlyGoalFamilies = 120;
  const familiesHelpedSoFar = 47;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f14",
        color: "#e7e9ee",
        padding: "48px",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont",
      }}
    >
      {/* Church / Foundation */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "14px", opacity: 0.7 }}>
          Countryside Christian Church
        </div>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>
          Helping Hands Foundation
        </div>
      </div>

      {/* Welcome */}
      <h1 style={{ fontSize: "40px", marginBottom: "12px" }}>
        Welcome{user?.email ? `, ${user.email}` : ""}
      </h1>

      <p style={{ maxWidth: "640px", opacity: 0.85 }}>
        This dashboard shows the real-world impact of collective generosity.
        Your participation helps families in our community receive food,
        essentials, and support—week by week.
      </p>

      {/* Monthly Mission */}
      <div
        style={{
          marginTop: "32px",
          padding: "24px",
          borderRadius: "14px",
          backgroundColor: "rgba(255,255,255,0.06)",
          maxWidth: "680px",
        }}
      >
        <h3 style={{ marginBottom: "8px" }}>This Month’s Mission</h3>

        <p style={{ opacity: 0.9 }}>
          The Helping Hands Foundation is working toward supporting{" "}
          <strong>{monthlyGoalFamilies} families</strong> this month.
        </p>

        <p style={{ marginTop: "12px", opacity: 0.75 }}>
          So far, <strong>{familiesHelpedSoFar}</strong> families have been
          helped with groceries, utilities, and essential needs — made possible
          through faithful, consistent giving.
        </p>

        {/* Progress bar */}
        <div
          style={{
            marginTop: "16px",
            height: "10px",
            borderRadius: "999px",
            backgroundColor: "rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(
                (familiesHelpedSoFar / monthlyGoalFamilies) * 100,
                100
              )}%`,
              backgroundColor: "#7ee3c8",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p style={{ marginTop: "10px", fontSize: "14px", opacity: 0.7 }}>
          {familiesHelpedSoFar} of {monthlyGoalFamilies} families served so far
          this month
        </p>
      </div>

      {/* Weekly Updates */}
      <div
        style={{
          marginTop: "32px",
          padding: "24px",
          borderRadius: "14px",
          backgroundColor: "rgba(255,255,255,0.04)",
          maxWidth: "680px",
        }}
      >
        <h3 style={{ marginBottom: "12px" }}>Recent Impact Updates</h3>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, opacity: 0.9 }}>
          <li style={{ marginBottom: "10px" }}>
            <strong>Week of Feb 1</strong> — Food assistance provided to 11
            families
          </li>
          <li style={{ marginBottom: "10px" }}>
            <strong>Week of Jan 25</strong> — Utility support for 9 households
          </li>
          <li>
            <strong>Week of Jan 18</strong> — Emergency essentials distributed to
            8 families
          </li>
        </ul>
      </div>
    </div>
  );
}
