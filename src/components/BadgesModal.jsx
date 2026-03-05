import { useState, useEffect } from "react";
import { getUserBadges, getBadgeSettings, setBadgeSettings } from "../services/badgeService";

export default function BadgesModal({ userId, onClose }) {
  const [badges,      setBadges]      = useState([]);
  const [showOnFeed,  setShowOnFeed]  = useState(true);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [badgeData, settings] = await Promise.all([
        getUserBadges(userId),
        getBadgeSettings(userId),
      ]);
      if (cancelled) return;
      setBadges(badgeData);
      setShowOnFeed(settings.showOnFeed);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  async function handleToggleFeed() {
    const next = !showOnFeed;
    setShowOnFeed(next);
    setSaving(true);
    await setBadgeSettings(userId, next);
    setSaving(false);
  }

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title">My Badges</h2>
        <p className="modal-subtitle">
          {loading ? "Loading…" : `${earnedCount} of ${badges.length} earned`}
        </p>

        {loading ? (
          <div className="center" style={{ padding: "var(--s-8)" }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* ── Badge grid ── */}
            <div className="badges-grid">
              {badges.map(({ id, emoji, name, desc, earned, awardedAt }) => (
                <div
                  key={id}
                  className={`badge-tile ${earned ? "is-earned" : "is-locked"}`}
                  title={earned && awardedAt
                    ? `Earned ${new Date(awardedAt).toLocaleDateString()}`
                    : desc}
                >
                  <div className="badge-tile-icon">{emoji}</div>
                  <div className="badge-tile-name">{name}</div>
                  <div className="badge-tile-desc">{desc}</div>
                  {earned && <div className="badge-tile-earned-label">Earned</div>}
                </div>
              ))}
            </div>

            {/* ── Feed privacy toggle ── */}
            <div
              style={{
                marginTop:    "var(--s-6)",
                paddingTop:   "var(--s-5)",
                borderTop:    "1px solid var(--color-border)",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "space-between",
                gap:          "var(--s-4)",
              }}
            >
              <div>
                <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-2)", color: "var(--color-text-primary)" }}>
                  Share badges to church feed
                </div>
                <div className="small muted">
                  Badge achievements will appear in your church's Stewarding Social feed.
                </div>
              </div>
              <button
                className={`btn btn-sm ${showOnFeed ? "btn-primary" : "btn-secondary"}`}
                onClick={handleToggleFeed}
                disabled={saving}
                style={{ flexShrink: 0 }}
              >
                {showOnFeed ? "On" : "Off"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
