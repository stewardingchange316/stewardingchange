import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { BADGE_DISPLAY } from "../services/badgeService";

export default function GivingProfile() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [church, setChurch] = useState(null);
  const [badges, setBadges] = useState([]);
  const [ringAnimated, setRingAnimated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("all"); // "week" | "month" | "ytd" | "all" | "custom"
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const cardRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let resolved = false;
    let sub = null;
    let timer = null;

    async function load() {
      const session = (await supabase.auth.getSession()).data.session;

      if (session) {
        fetchData(session.user.id);
        return;
      }

      // Session not ready yet — wait for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        if (s && !cancelled && !resolved) {
          resolved = true;
          subscription.unsubscribe();
          if (timer) clearTimeout(timer);
          fetchData(s.user.id);
        }
      });
      sub = subscription;

      // Timeout fallback
      timer = setTimeout(() => {
        if (!cancelled && !resolved) {
          resolved = true;
          subscription.unsubscribe();
          nav("/", { replace: true });
        }
      }, 4000);
    }

    async function fetchData(userId) {
      if (cancelled) return;
      resolved = true;

      const [{ data: prof }, { data: badgeRows }] = await Promise.all([
        supabase.from("users").select("*").eq("id", userId).single(),
        supabase.from("user_badges").select("badge_id, awarded_at").eq("user_id", userId),
      ]);

      if (cancelled) return;
      if (!prof) { nav("/", { replace: true }); return; }

      setProfile(prof);
      setBadges(badgeRows ?? []);

      if (prof.church_id) {
        const { data: ch } = await supabase
          .from("churches")
          .select("name, mission_progress")
          .eq("id", prof.church_id)
          .maybeSingle();
        if (!cancelled) setChurch(ch);
      }

      setLoading(false);
      requestAnimationFrame(() => setRingAnimated(true));
    }

    load();
    return () => {
      cancelled = true;
      if (sub) sub.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [nav]);

  if (loading || !profile) {
    return (
      <>
        <header className="header">
          <div className="header-inner">
            <Link to="/" className="brand">
              <img src="/logo.png" alt="Stewarding Change" className="brand-mark" style={{ height: "36px", width: "36px", objectFit: "contain" }} />
              <span className="brand-name">Stewarding Change</span>
            </Link>
          </div>
        </header>
        <div className="center" style={{ minHeight: "60vh" }}><div className="spinner" /></div>
      </>
    );
  }

  /* ── Derived data ── */
  const firstName = profile.first_name || "Friend";
  const initials = firstName.charAt(0).toUpperCase();
  const memberSince = new Date(profile.created_at);
  const now = new Date();
  const weeksActive = Math.max(1, Math.floor((now - memberSince) / (7 * 24 * 60 * 60 * 1000)));
  const cap = profile.weekly_cap ?? 25;

  // Filter date range
  const { dateFrom, dateTo, filterLabel } = getFilterRange(filter, customFrom, customTo, memberSince);
  const filterWeeks = Math.max(1, Math.round((dateTo - dateFrom) / (7 * 24 * 60 * 60 * 1000)));

  // TODO: Replace with real data from Stripe/payment processor
  const mockWeeklyGiven = Math.min(cap, Math.round((cap * 0.62) * 100) / 100);
  const mockFilteredGiven = Math.round(filterWeeks * cap * 0.58 * 100) / 100;
  const mockStreak = Math.min(weeksActive, Math.max(3, weeksActive - 2));
  const mockRoundUps = filterWeeks * 12;
  const ringPercent = Math.round((mockWeeklyGiven / cap) * 100);

  // Generate chart data
  const chartWeeks = generateChartData(Math.min(filterWeeks, 16), cap);

  const earnedBadges = badges
    .map((row) => BADGE_DISPLAY.find((b) => b.id === row.badge_id))
    .filter(Boolean);

  // Format dates for display
  const fmtDate = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const dateRangeText = filter === "all"
    ? "All Time"
    : `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`;

  async function handleShare() {
    try {
      const cardData = {
        user_id: profile.id,
        first_name: firstName,
        church_name: church?.name || null,
        total_given: mockFilteredGiven,
        streak_weeks: mockStreak,
        round_ups: mockRoundUps,
        badges_earned: earnedBadges.length,
        badge_emojis: earnedBadges.map((b) => b.emoji),
        member_since: profile.created_at,
        updated_at: new Date().toISOString(),
        date_from: filter === "all" ? null : dateFrom.toISOString().slice(0, 10),
        date_to: filter === "all" ? null : dateTo.toISOString().slice(0, 10),
        filter_label: filterLabel,
      };

      const { data: existing } = await supabase
        .from("share_cards")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      let shareId;
      if (existing) {
        await supabase.from("share_cards").update(cardData).eq("id", existing.id);
        shareId = existing.id;
      } else {
        const { data: inserted } = await supabase
          .from("share_cards")
          .insert(cardData)
          .select("id")
          .single();
        shareId = inserted.id;
      }

      const shareUrl = `${window.location.origin}/s/${shareId}`;
      const rangeText = filter === "all" ? "" : ` (${dateRangeText})`;

      if (navigator.share) {
        await navigator.share({
          title: `${firstName} is stewarding change`,
          text: `See my impact${rangeText} — $${Math.round(mockFilteredGiven)} given, ${mockStreak}-week streak at ${church?.name || "my church"}!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      if (e.name !== "AbortError") console.error("Share failed:", e);
    }
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <img src="/logo.png" alt="Stewarding Change" className="brand-mark" style={{ height: "36px", width: "36px", objectFit: "contain" }} />
            <span className="brand-name">Stewarding Change</span>
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={() => nav("/dashboard")}>
            ← Dashboard
          </button>
        </div>
      </header>

      <div className="gp-root">
        <div className="container-narrow stack-7">

          {/* ── Placeholder disclaimer ── */}
          <div className="alert" style={{ background: "rgba(26, 79, 212, 0.06)", border: "1px solid rgba(26, 79, 212, 0.15)", borderRadius: "var(--r-md)", padding: "var(--s-3) var(--s-4)", fontSize: "var(--fs-1)", color: "var(--color-text-body)", lineHeight: "var(--lh-normal)" }}>
            The data on this page is placeholder content for preview purposes. Live giving data will populate once financial services are connected.
          </div>

          {/* ── Header ── */}
          <div className="gp-header">
            <div className="gp-avatar">{initials}</div>
            <div>
              <h2 style={{ margin: 0 }}>{firstName}'s Impact</h2>
              <p className="muted" style={{ margin: 0 }}>
                {church?.name || "Your church"} · Member since {memberSince.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* ── Date filter ── */}
          <div className="gp-filter">
            <div className="gp-filter-pills">
              {[
                { key: "week", label: "This Week" },
                { key: "month", label: "Last Month" },
                { key: "ytd", label: "YTD" },
                { key: "all", label: "All Time" },
                { key: "custom", label: "Custom" },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`gp-filter-pill ${filter === f.key ? "is-active" : ""}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filter === "custom" && (
              <div className="gp-filter-custom">
                <div className="gp-filter-date">
                  <label>From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    max={customTo || undefined}
                  />
                </div>
                <div className="gp-filter-date">
                  <label>To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    min={customFrom || undefined}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>
            )}

            {filter !== "all" && (
              <div className="gp-filter-range">{dateRangeText}</div>
            )}
          </div>

          {/* ── Ring + Streak row ── */}
          <div className="gp-ring-streak-row">

            {/* Giving Ring */}
            <div className="gp-ring-card card">
              <div className="gp-ring-label">This Week</div>
              <div className="gp-ring-wrap">
                <svg viewBox="0 0 120 120" className="gp-ring-svg">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="var(--color-brand)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={ringAnimated ? `${2 * Math.PI * 52 * (1 - ringPercent / 100)}` : `${2 * Math.PI * 52}`}
                    transform="rotate(-90 60 60)"
                    className="gp-ring-progress"
                  />
                </svg>
                <div className="gp-ring-center">
                  <div className="gp-ring-amount">${mockWeeklyGiven.toFixed(2)}</div>
                  <div className="gp-ring-cap">of ${cap}</div>
                </div>
              </div>
              <div className="gp-ring-pct">{ringPercent}% of monthly cap</div>
            </div>

            {/* Streak */}
            <div className="gp-streak-card card">
              <div className="gp-streak-flame">🔥</div>
              <div className="gp-streak-count">{mockStreak}</div>
              <div className="gp-streak-label">week streak</div>
              <div className="gp-streak-sub">
                {mockRoundUps.toLocaleString()} round-ups
              </div>
            </div>
          </div>

          {/* ── Giving Trend Chart ── */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s-4)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--fs-3)" }}>Giving Trend</h3>
                <p className="small muted" style={{ margin: "2px 0 0" }}>Monthly giving over time</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "var(--fs-4)", fontWeight: "var(--fw-extrabold)", color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
                  ${mockFilteredGiven.toFixed(0)}
                </div>
                <div className="small muted">{filterLabel}</div>
              </div>
            </div>
            <GivingChart weeks={chartWeeks} cap={cap} animated={ringAnimated} />
          </div>

          {/* ── Shareable Impact Card ── */}
          <div className="gp-share-section">
            <h3 style={{ margin: "0 0 var(--s-4)", fontSize: "var(--fs-3)" }}>Share Your Impact</h3>
            <div className="gp-share-card" ref={cardRef}>
              <div className="gp-share-card-inner">
                <div className="gp-share-brand">
                  <img src="/logo.png" alt="" style={{ width: 24, height: 24 }} />
                  <span>Stewarding Change</span>
                </div>

                <div className="gp-share-name">{firstName}</div>
                <div className="gp-share-church">{church?.name || "My Church"}</div>

                <div className="gp-share-stats">
                  <div className="gp-share-stat">
                    <div className="gp-share-stat-val">${mockFilteredGiven.toFixed(0)}</div>
                    <div className="gp-share-stat-label">total given</div>
                  </div>
                  <div className="gp-share-stat-divider" />
                  <div className="gp-share-stat">
                    <div className="gp-share-stat-val">{mockStreak}</div>
                    <div className="gp-share-stat-label">week streak</div>
                  </div>
                  <div className="gp-share-stat-divider" />
                  <div className="gp-share-stat">
                    <div className="gp-share-stat-val">{earnedBadges.length}</div>
                    <div className="gp-share-stat-label">badges</div>
                  </div>
                </div>

                {earnedBadges.length > 0 && (
                  <div className="gp-share-badges">
                    {earnedBadges.map((b) => (
                      <span key={b.id} title={b.name}>{b.emoji}</span>
                    ))}
                  </div>
                )}

                <div className="gp-share-footer">stewardingchange.org</div>
              </div>
            </div>

            <button className="btn btn-primary btn-wide" onClick={handleShare} style={{ marginTop: "var(--s-4)" }}>
              {copied ? "Copied to clipboard!" : "Share Your Impact"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

/**
 * Generate mock weekly giving amounts for chart.
 * Returns array of { week: number, amount: number }.
 * TODO: Replace with real transaction data from Stripe.
 */
/** Compute date range from filter selection. */
function getFilterRange(filter, customFrom, customTo, memberSince) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { dateFrom: weekStart, dateTo: today, filterLabel: "this week" };
    }
    case "month": {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      return { dateFrom: monthStart, dateTo: today, filterLabel: "last month" };
    }
    case "ytd": {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { dateFrom: yearStart, dateTo: today, filterLabel: "year to date" };
    }
    case "custom": {
      const from = customFrom ? new Date(customFrom + "T00:00:00") : memberSince;
      const to = customTo ? new Date(customTo + "T00:00:00") : today;
      return { dateFrom: from, dateTo: to, filterLabel: "custom range" };
    }
    default:
      return { dateFrom: memberSince, dateTo: today, filterLabel: "all time" };
  }
}

function generateChartData(numWeeks, cap) {
  const data = [];
  for (let i = 0; i < numWeeks; i++) {
    // Deterministic pseudo-random — generally trending up
    const seed = i + 7;
    const hash = ((seed * 2654435761) >>> 0) % 1000;
    const base = cap * 0.3;
    const variance = cap * 0.5 * (hash / 1000);
    const trend = cap * 0.15 * (i / numWeeks); // gradual increase
    const amount = Math.min(cap, Math.round((base + variance + trend) * 100) / 100);
    data.push({ week: i + 1, amount });
  }
  return data;
}

/**
 * Bar chart component — vertical bars with dollar amounts and week labels.
 */
function GivingChart({ weeks, cap, animated }) {
  if (!weeks.length) return null;
  const max = Math.max(cap, ...weeks.map((d) => d.amount));

  // Y-axis scale lines
  const scaleLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    value: Math.round(max * pct),
    pct: pct * 100,
  }));

  return (
    <div className={`gp-chart-container ${animated ? "is-visible" : ""}`}>
      {/* Y-axis labels */}
      <div className="gp-chart-yaxis">
        {scaleLines.reverse().map((s) => (
          <span key={s.pct} className="gp-chart-yaxis-label">${s.value}</span>
        ))}
      </div>

      <div className="gp-chart-area">
        {/* Horizontal grid lines */}
        <div className="gp-chart-gridlines">
          {[0, 25, 50, 75, 100].map((pct) => (
            <div key={pct} className="gp-chart-gridline" style={{ bottom: `${pct}%` }} />
          ))}
        </div>

        {/* Bars */}
        <div className="gp-bars">
          {weeks.map((d, i) => {
            const pct = (d.amount / max) * 100;
            return (
              <div key={i} className="gp-bar-col">
                <div className="gp-bar-track">
                  <div
                    className="gp-bar-fill"
                    style={{ height: `${pct}%`, transitionDelay: `${0.06 * i}s` }}
                  />
                  <div className="gp-bar-tooltip">${d.amount.toFixed(2)}</div>
                </div>
                <span className="gp-bar-label">Wk {d.week}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
